import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Preference } from "mercadopago"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import {
  buildAuthoritativeCart,
  parseCheckoutBody,
  type AuthoritativeProduct,
} from "@/lib/checkout"
import { appendUniqueOrderNote, formatOperationalNote } from "@/lib/orderNotes"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.theia.lat"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

function errorResponse(issues: { field: string; code: string; message: string }[]) {
  return NextResponse.json(
    { error: { code: "checkout_validation_failed", message: "Revisa los datos del pedido.", issues } },
    { status: 400 }
  )
}

function safeFailureNote(stage: "create_preference" | "incomplete_preference" | "save_preference"): string {
  return formatOperationalNote("MERCADOPAGO_PREFERENCE_FAILED", { stage })
}

export async function POST(req: NextRequest) {
  let parsedBody: unknown
  try {
    parsedBody = await req.json()
  } catch {
    return errorResponse([{ field: "body", code: "invalid_json", message: "Solicitud inválida." }])
  }

  const parsed = parseCheckoutBody(parsedBody)
  if (!parsed.ok) return errorResponse(parsed.issues)

  const supabase = adminSupabase()
  const productIds = [...new Set(parsed.value.items.map((item) => item.product_id))]
  const { data: productRows, error: productsError } = await supabase
    .from("products")
    .select(
      "id, title, display_name, sale_price, cost_price, status, source, stock, size_stock, sizes, colors, color_sizes, printful_variant_map"
    )
    .in("id", productIds)

  if (productsError) {
    console.error("[checkout] Error consultando productos:", productsError.code)
    return NextResponse.json(
      { error: { code: "checkout_unavailable", message: "No pudimos validar el pedido. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  const cart = buildAuthoritativeCart(parsed.value.items, (productRows ?? []) as AuthoritativeProduct[])
  if (!cart.ok) return errorResponse(cart.issues)

  const { customer, shipping_address: shippingAddress } = parsed.value
  const { data: dbCustomer, error: customerError } = await supabase
    .from("customers")
    .upsert(
      { email: customer.email, name: customer.name, phone: customer.phone },
      { onConflict: "email" }
    )
    .select("id")
    .single()

  if (customerError || !dbCustomer) {
    console.error("[checkout] Error guardando cliente:", customerError?.code)
    return NextResponse.json(
      { error: { code: "customer_save_failed", message: "No pudimos iniciar el pago. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  const publicAccessToken = randomBytes(32).toString("hex")
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: dbCustomer.id,
      status: "pending",
      subtotal: cart.subtotal,
      shipping_cost: cart.shippingCost,
      total: cart.total,
      shipping_address: shippingAddress,
      public_access_token: publicAccessToken,
      items: cart.items,
    })
    .select("id, notes")
    .single()

  if (orderError || !order) {
    console.error("[checkout] Error insertando pedido:", orderError?.code)
    return NextResponse.json(
      { error: { code: "order_save_failed", message: "No pudimos crear el pedido. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  const orderPath = `/pedidos/${order.id}?token=${encodeURIComponent(publicAccessToken)}`
  const preferenceBody = {
    external_reference: order.id,
    items: [
      ...cart.items.map((item) => ({
        id: item.product_id,
        title: item.title.slice(0, 256),
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "MXN",
      })),
      {
        id: "envio",
        title: "Envío estándar a México",
        quantity: 1,
        unit_price: cart.shippingCost,
        currency_id: "MXN",
      },
    ],
    payer: { email: customer.email, name: customer.name },
    back_urls: {
      success: `${SITE_URL}${orderPath}&status=success`,
      failure: `${SITE_URL}/checkout?status=failure`,
      pending: `${SITE_URL}${orderPath}&status=pending`,
    },
    auto_return: "approved" as const,
    notification_url: `${SITE_URL}/api/webhooks/mercadopago`,
  }

  let preference: Awaited<ReturnType<Preference["create"]>>
  try {
    preference = await new Preference(getMercadoPagoClient()).create({ body: preferenceBody })
  } catch (error) {
    console.error("[checkout] Error creando preferencia MercadoPago:", error instanceof Error ? error.name : "unknown")
    const note = safeFailureNote("create_preference")
    const { error: noteError } = await supabase
      .from("orders")
      .update({ notes: appendUniqueOrderNote(order.notes, note) })
      .eq("id", order.id)
    if (noteError) console.error("[checkout] No se pudo registrar el fallo de preferencia:", noteError.code)
    return NextResponse.json(
      { error: { code: "payment_preference_failed", message: "MercadoPago no está disponible. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  if (!preference.id || !preference.init_point) {
    console.error("[checkout] Preferencia MercadoPago incompleta")
    const note = safeFailureNote("incomplete_preference")
    const { error: noteError } = await supabase
      .from("orders")
      .update({ notes: appendUniqueOrderNote(order.notes, note) })
      .eq("id", order.id)
    if (noteError) console.error("[checkout] No se pudo registrar la preferencia incompleta:", noteError.code)
    return NextResponse.json(
      { error: { code: "payment_preference_failed", message: "MercadoPago no devolvió una sesión de pago válida." } },
      { status: 503 }
    )
  }

  const { error: preferenceSaveError } = await supabase
    .from("orders")
    .update({ mercadopago_preference_id: preference.id })
    .eq("id", order.id)

  if (preferenceSaveError) {
    console.error("[checkout] Error guardando preference_id:", preferenceSaveError.code)
    const note = safeFailureNote("save_preference")
    await supabase.from("orders").update({ notes: appendUniqueOrderNote(order.notes, note) }).eq("id", order.id)
    return NextResponse.json(
      { error: { code: "payment_session_save_failed", message: "No pudimos confirmar la sesión de pago. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  return NextResponse.json({
    orderId: order.id,
    preferenceId: preference.id,
    checkoutUrl: preference.init_point,
  })
}
