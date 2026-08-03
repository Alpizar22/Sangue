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
import { buildDiscountedTotals, evaluateDiscount, normalizeDiscountCode, roundMoney } from "@/lib/discounts"
import { consumeDiscountCode, findDiscountCode, releaseDiscountCode } from "@/lib/discountLookup"

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

// Los errores de PostgREST traen code/message/details/hint. Registrar solo el
// code deja invisibles fallos de esquema como 42703 (columna inexistente), que
// rompen el checkout por completo sin dejar rastro accionable en los logs.
function logSupabaseError(stage: string, error: unknown) {
  const pg = error as { code?: string; message?: string; details?: string; hint?: string } | null
  console.error(
    `[checkout] ${stage}:`,
    JSON.stringify({
      code: pg?.code ?? null,
      message: pg?.message ?? null,
      details: pg?.details ?? null,
      hint: pg?.hint ?? null,
    })
  )
}

// El SDK de MercadoPago devuelve el motivo real en message/status/cause.
// Registrar solo error.name dejaba "unknown" en los logs ante cualquier fallo
// (token inválido, campo rechazado, monto inconsistente). Se registran el
// mensaje y los códigos de causa, nunca el objeto completo: la configuración
// de la petición incluye el access token.
function logMercadoPagoError(error: unknown) {
  const mp = error as { message?: string; status?: number; cause?: unknown } | null
  const causes = Array.isArray(mp?.cause)
    ? (mp.cause as Array<{ code?: unknown; description?: unknown }>).map((entry) => ({
        code: entry?.code ?? null,
        description: typeof entry?.description === "string" ? entry.description : null,
      }))
    : null
  console.error(
    "[checkout] Error creando preferencia MercadoPago:",
    JSON.stringify({
      name: error instanceof Error ? error.name : "unknown",
      message: mp?.message ?? null,
      status: mp?.status ?? null,
      causes,
    })
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
  // size_stock NO se pide aquí: la columna nunca existió en el esquema y
  // pedirla hacía fallar la consulta entera con 42703, bloqueando todos los
  // checkouts. buildAuthoritativeCart trata size_stock como opcional, así que
  // la validación por talla queda inerte hasta que exista la columna, mientras
  // el control de stock agregado (products.stock) sigue aplicándose.
  const { data: productRows, error: productsError } = await supabase
    .from("products")
    .select(
      "id, title, display_name, sale_price, cost_price, status, source, stock, sizes, colors, color_sizes, printful_variant_map"
    )
    .in("id", productIds)

  if (productsError) {
    logSupabaseError("Error consultando productos", productsError)
    return NextResponse.json(
      { error: { code: "checkout_unavailable", message: "No pudimos validar el pedido. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  const cart = buildAuthoritativeCart(parsed.value.items, (productRows ?? []) as AuthoritativeProduct[])
  if (!cart.ok) return errorResponse(cart.issues)

  // El descuento se vuelve a resolver aquí contra el subtotal autoritativo: el
  // navegador solo aporta el código, nunca el importe. Un código inválido no
  // tumba la compra, simplemente no se aplica.
  const requestedCode = normalizeDiscountCode((parsedBody as Record<string, unknown>)?.discount_code)
  let appliedDiscount: { id: string; code: string; amount: number } | null = null
  if (requestedCode) {
    const lookup = await findDiscountCode(supabase, requestedCode)
    if (lookup.ok) {
      const evaluation = evaluateDiscount(lookup.row, cart.subtotal)
      if (evaluation.ok && lookup.row) {
        // Se reserva el uso antes de cobrar. Si otro checkout agotó el cupo en
        // el intervalo, el incremento atómico falla y el pedido sigue sin él.
        const consumed = await consumeDiscountCode(supabase, lookup.row)
        if (consumed) {
          appliedDiscount = { id: evaluation.id, code: evaluation.code, amount: evaluation.amount }
        } else {
          console.warn(`[checkout] Código ${requestedCode} no se pudo reservar; se continúa sin descuento`)
        }
      } else if (!evaluation.ok) {
        console.info(`[checkout] Código ${requestedCode} rechazado: ${evaluation.reason}`)
      }
    }
  }

  const totals = buildDiscountedTotals(cart.subtotal, cart.shippingCost, appliedDiscount?.amount ?? 0)

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
    logSupabaseError("Error guardando cliente", customerError)
    return NextResponse.json(
      { error: { code: "customer_save_failed", message: "No pudimos iniciar el pago. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  const publicAccessToken = randomBytes(32).toString("hex")
  // Las columnas de descuento solo se envían cuando hay un descuento real. Así,
  // si add_discount_codes.sql aún no se aplicó, no puede existir un descuento
  // aplicado (la tabla no existe) y el insert nunca menciona columnas ausentes.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: dbCustomer.id,
      status: "pending",
      subtotal: totals.subtotal,
      shipping_cost: totals.shippingCost,
      total: totals.total,
      shipping_address: shippingAddress,
      public_access_token: publicAccessToken,
      items: cart.items,
      ...(appliedDiscount
        ? { discount_code: appliedDiscount.code, discount_amount: totals.discountAmount }
        : {}),
    })
    .select("id, notes")
    .single()

  if (orderError || !order) {
    logSupabaseError("Error insertando pedido", orderError)
    // El cupo ya estaba reservado: se devuelve para no quemar un uso por un
    // pedido que nunca llegó a existir.
    if (appliedDiscount) await releaseDiscountCode(supabase, appliedDiscount.id)
    return NextResponse.json(
      { error: { code: "order_save_failed", message: "No pudimos crear el pedido. Intenta nuevamente." } },
      { status: 503 }
    )
  }

  const orderPath = `/pedidos/${order.id}?token=${encodeURIComponent(publicAccessToken)}`
  // MercadoPago no admite importes negativos, así que un descuento no puede ir
  // como línea aparte. Sin descuento se conserva el desglose por artículo; con
  // descuento se manda una sola línea ya rebajada, de modo que la suma cuadre
  // exactamente con orders.total (el webhook rechaza el pago si difieren en más
  // de medio centavo) sin arrastrar errores de redondeo por prorrateo.
  const productLines = appliedDiscount
    ? [
        {
          id: "pedido",
          title: `Pedido Theia · ${cart.items.length} ${cart.items.length === 1 ? "pieza" : "piezas"} (código ${appliedDiscount.code})`.slice(0, 256),
          quantity: 1,
          unit_price: roundMoney(totals.subtotal - totals.discountAmount),
          currency_id: "MXN",
        },
      ]
    : cart.items.map((item) => ({
        id: item.product_id,
        title: item.title.slice(0, 256),
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "MXN",
      }))

  const preferenceBody = {
    external_reference: order.id,
    items: [
      ...productLines,
      {
        id: "envio",
        title: "Envío estándar a México",
        quantity: 1,
        unit_price: totals.shippingCost,
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
    logMercadoPagoError(error)
    const note = safeFailureNote("create_preference")
    const { error: noteError } = await supabase
      .from("orders")
      .update({ notes: appendUniqueOrderNote(order.notes, note) })
      .eq("id", order.id)
    if (noteError) logSupabaseError("No se pudo registrar el fallo de preferencia", noteError)
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
    if (noteError) logSupabaseError("No se pudo registrar la preferencia incompleta", noteError)
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
    logSupabaseError("Error guardando preference_id", preferenceSaveError)
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
