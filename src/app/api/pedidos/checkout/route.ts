import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { Preference } from "mercadopago"
import type { CartItem, ShippingAddress } from "@/types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.theia.lat"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err == null) return { raw: String(err) }
  return {
    name: (err as { name?: unknown }).name,
    message: (err as { message?: unknown }).message,
    status: (err as { status?: unknown }).status,
    cause: (err as { cause?: unknown }).cause,
    error: (err as { error?: unknown }).error,
    stack: err instanceof Error ? err.stack : undefined,
    keys: Object.keys(err as object),
    json: (() => { try { return JSON.parse(JSON.stringify(err)) } catch { return "[circular]" } })(),
  }
}

interface CheckoutBody {
  items: CartItem[]
  customer: {
    email: string
    name: string
    phone?: string
  }
  shipping_address: ShippingAddress
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json()
    const { items, customer, shipping_address } = body

    if (!items?.length || !customer?.email || !shipping_address) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const supabase = adminSupabase()

    // Upsert customer
    const { data: dbCustomer } = await supabase
      .from("customers")
      .upsert({ email: customer.email, name: customer.name, phone: customer.phone || null }, { onConflict: "email" })
      .select()
      .single()

    const subtotal = items.reduce((s, i) => s + i.product.sale_price * i.quantity, 0)
    const shippingCost = 0
    const total = subtotal + shippingCost

    // Crear orden
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: dbCustomer?.id,
        status: "pending",
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          unit_price: i.product.sale_price,
          unit_cost: i.product.cost_price,
          shein_sku: i.product.shein_sku,
        })),
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error("[checkout] supabase order error:", orderError)
      return NextResponse.json({ error: "Error al crear orden" }, { status: 500 })
    }

    console.log("[checkout] orden creada:", order.id)

    // Crear preferencia MercadoPago
    const mpBody = {
      external_reference: order.id,
      items: items.map((i) => ({
        id: i.product_id,
        title: i.product.title.slice(0, 256),
        quantity: i.quantity,
        unit_price: Number(i.product.sale_price),
        currency_id: "MXN",
      })),
      payer: { email: customer.email.toLowerCase().trim(), name: customer.name.trim() },
      back_urls: {
        success: `${SITE_URL}/pedidos/${order.id}?status=success`,
        failure: `${SITE_URL}/checkout?status=failure`,
        pending: `${SITE_URL}/pedidos/${order.id}?status=pending`,
      },
      auto_return: "approved" as const,
      notification_url: `${SITE_URL}/api/webhooks/mercadopago`,
    }

    console.log("[checkout] MP preference body:", JSON.stringify(mpBody))

    const mp = getMercadoPagoClient()
    const preference = await new Preference(mp).create({ body: mpBody })

    console.log("[checkout] preference creada:", preference.id, "url:", preference.init_point)

    await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", order.id)

    return NextResponse.json({
      orderId: order.id,
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
    })
  } catch (error) {
    console.error("[checkout] CATCH:", JSON.stringify(serializeError(error), null, 2))
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
