import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { Preference } from "mercadopago"
import type { CartItem, ShippingAddress } from "@/types"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
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
    const shippingCost = 0 // Ajustar cuando tengamos lógica de envío
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
      console.error("[checkout] Error creando orden:", orderError)
      return NextResponse.json({ error: "Error al crear orden" }, { status: 500 })
    }

    // Crear preferencia MercadoPago
    const mp = getMercadoPagoClient()
    const preference = await new Preference(mp).create({
      body: {
        external_reference: order.id,
        items: items.map((i) => ({
          id: i.product_id,
          title: i.product.title,
          quantity: i.quantity,
          unit_price: i.product.sale_price,
          currency_id: "ARS",
        })),
        payer: { email: customer.email, name: customer.name },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/pedidos/${order.id}?status=success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pedidos/${order.id}?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
      },
    })

    // Guardar preference_id
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
    console.error("[checkout]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
