import { createHmac, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Payment } from "mercadopago"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import {
  buildPrintfulOrderInput,
  buildPrintfulFailureEventUpdate,
  createPrintfulOrder,
  printfulFailureDetail,
  resolvePrintfulSyncItems,
} from "@/lib/printful"
import {
  buildBlockedFulfillmentUpdate,
  preparePrintfulFulfillment,
  type PrintfulProductInfo,
  type StoredFulfillmentItem,
} from "@/lib/printfulVariant"
import { canAcceptUnsignedWebhook, toPrintfulExternalId } from "@/lib/payment"
import { appendUniqueOrderNote, formatOperationalNote } from "@/lib/orderNotes"
import type { ShippingAddress } from "@/types"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

function verifyMPSignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    if (!canAcceptUnsignedWebhook(process.env.NODE_ENV)) {
      console.error("[mp-webhook] Firma obligatoria no configurada en producción")
      return false
    }
    console.warn("[mp-webhook] Modo local explícito: firma no configurada")
    return true
  }

  const signature = req.headers.get("x-signature") ?? ""
  const requestId = req.headers.get("x-request-id") ?? ""
  const timestamp = signature.match(/(?:^|,)\s*ts=([^,]+)/)?.[1]
  const receivedHex = signature.match(/(?:^|,)\s*v1=([^,]+)/)?.[1]
  if (!timestamp || !receivedHex || !/^[a-f0-9]{64}$/i.test(receivedHex)) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`
  const expected = Buffer.from(createHmac("sha256", secret).update(manifest).digest("hex"), "utf8")
  const received = Buffer.from(receivedHex.toLowerCase(), "utf8")
  return expected.length === received.length && timingSafeEqual(expected, received)
}

async function recordPrintfulFailure(
  supabase: ReturnType<typeof adminSupabase>,
  orderId: string,
  existingNotes: string | null,
  type: "PRINTFUL_API_FAILED" | "PRINTFUL_RECONCILIATION_REQUIRED",
  details: Record<string, unknown>
) {
  const note = formatOperationalNote(type, details)
  const { error } = await supabase
    .from("orders")
    .update({ status: "processing", notes: appendUniqueOrderNote(existingNotes, note) })
    .eq("id", orderId)
  if (error) console.error(`[mp-webhook] No se pudo registrar ${type} para ${orderId}:`, error.code)
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let body: { type?: unknown; data?: { id?: unknown } }
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    if (body.type !== "payment") return NextResponse.json({ received: true })
    const dataId = typeof body.data?.id === "string" || typeof body.data?.id === "number"
      ? String(body.data.id)
      : ""
    if (!dataId) return NextResponse.json({ error: "Invalid payment notification" }, { status: 400 })
    if (!verifyMPSignature(req, dataId)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payment = await new Payment(getMercadoPagoClient()).get({ id: dataId })
    if (!payment || payment.status !== "approved") return NextResponse.json({ received: true })

    const orderId = payment.external_reference ?? ""
    if (!UUID_PATTERN.test(orderId)) {
      console.error("[mp-webhook] external_reference inválida para pago:", payment.id)
      return NextResponse.json({ received: true })
    }

    const paymentId = String(payment.id)
    const currency = payment.currency_id ?? ""
    const amount = Number(payment.transaction_amount)
    const supabase = adminSupabase()

    // La RPC inserta el evento único, bloquea la fila del pedido y reclama
    // fulfillment en una sola transacción. Solo "claimed" puede continuar.
    const { data: claimResult, error: claimError } = await supabase.rpc(
      "claim_mercadopago_fulfillment",
      {
        p_order_id: orderId,
        p_event_id: paymentId,
        p_payment_id: paymentId,
        p_amount: Number.isFinite(amount) ? amount : null,
        p_currency: currency,
      }
    )

    if (claimError) {
      console.error(`[mp-webhook] No se pudo reclamar pedido ${orderId}:`, claimError.code)
      return NextResponse.json({ error: "Temporary processing error" }, { status: 500 })
    }
    if (claimResult !== "claimed") {
      console.info(`[mp-webhook] Evento ${paymentId} finalizado sin fulfillment: ${claimResult}`)
      return NextResponse.json({ received: true })
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, customer:customers(name, phone, email)")
      .eq("id", orderId)
      .single()
    if (orderError || !order) {
      console.error(`[mp-webhook] Pedido reclamado no disponible ${orderId}:`, orderError?.code)
      return NextResponse.json({ error: "Temporary processing error" }, { status: 500 })
    }

    const customer = order.customer as { name: string; phone: string | null; email: string | null } | null
    const shippingAddress = order.shipping_address as ShippingAddress
    const storedItems = (order.items ?? []) as StoredFulfillmentItem[]
    const productIds = [...new Set(storedItems.map((item) => item.product_id).filter(Boolean))]
    const { data: productRows, error: productError } = await supabase
      .from("products")
      .select("id, printful_product_id, printful_variant_id, printful_variant_map, source")
      .in("id", productIds)
    if (productError) {
      console.error(`[mp-webhook] No se pudo consultar catálogo para ${orderId}:`, productError.code)
      await recordPrintfulFailure(supabase, orderId, order.notes, "PRINTFUL_API_FAILED", {
        stage: "load_products",
        reason: "catalog_unavailable",
      })
      await supabase
        .from("payment_events")
        .update({ status: "catalog_failed" })
        .eq("provider", "mercadopago")
        .eq("event_id", paymentId)
      return NextResponse.json({ received: true })
    }

    const printfulProductMap: Record<string, PrintfulProductInfo> = {}
    for (const product of productRows ?? []) {
      if (product.source === "printful") {
        printfulProductMap[product.id] = {
          printful_variant_id: product.printful_variant_id,
          printful_variant_map: product.printful_variant_map,
        }
      }
    }

    const preparation = preparePrintfulFulfillment(storedItems, printfulProductMap)
    if (!preparation.ok) {
      console.error(
        `[mp-webhook] Fulfillment Printful bloqueado para pedido ${orderId}:`,
        JSON.stringify({ orderId, errors: preparation.errors })
      )
      const { error } = await supabase
        .from("orders")
        .update(buildBlockedFulfillmentUpdate(order.notes, preparation))
        .eq("id", orderId)
      if (error) console.error(`[mp-webhook] No se pudo persistir bloqueo ${orderId}:`, error.code)
      await supabase
        .from("payment_events")
        .update({ status: "variant_blocked" })
        .eq("provider", "mercadopago")
        .eq("event_id", paymentId)
      return NextResponse.json({ received: true })
    }

    const externalId = toPrintfulExternalId(orderId)
    const productRowsById = new Map((productRows ?? []).map((product) => [product.id, product]))
    let syncPreparation
    try {
      syncPreparation = await resolvePrintfulSyncItems(
        preparation.items.map((item, index) => ({
          product_id: storedItems[index].product_id,
          printful_product_id: productRowsById.get(storedItems[index].product_id)?.printful_product_id ?? null,
          catalog_variant_id: item.printful_variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      )
    } catch (error) {
      const detail = printfulFailureDetail(error, externalId)
      console.error(`[mp-webhook] Error resolviendo variantes sincronizadas para ${orderId}:`, error)
      await recordPrintfulFailure(supabase, orderId, order.notes, "PRINTFUL_API_FAILED", {
        stage: "resolve_sync_variants",
        ...detail,
      })
      await supabase
        .from("payment_events")
        .update({ status: "printful_failed", detail })
        .eq("provider", "mercadopago")
        .eq("event_id", paymentId)
      return NextResponse.json({ received: true })
    }

    if (!syncPreparation.ok) {
      const detail = {
        external_id: externalId,
        http_status: null,
        message: "No se pudo resolver una variante sincronizada y activa de Printful.",
        errors: syncPreparation.errors,
      }
      console.error(
        `[mp-webhook] Fulfillment Printful sin sync_variant_id para pedido ${orderId}:`,
        JSON.stringify(detail)
      )
      await recordPrintfulFailure(supabase, orderId, order.notes, "PRINTFUL_API_FAILED", {
        stage: "resolve_sync_variants",
        ...detail,
      })
      await supabase
        .from("payment_events")
        .update({ status: "printful_failed", detail })
        .eq("provider", "mercadopago")
        .eq("event_id", paymentId)
      return NextResponse.json({ received: true })
    }

    const printfulInput = buildPrintfulOrderInput({
      externalId,
      customerName: customer?.name ?? "Cliente",
      customerEmail: customer?.email ?? "",
      customerPhone: (customer?.phone ?? "").replace(/\D/g, "") || "0000000000",
      shippingAddress,
      items: syncPreparation.items,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
    })

    if (!printfulInput) {
      await recordPrintfulFailure(supabase, orderId, order.notes, "PRINTFUL_API_FAILED", {
        stage: "build_order",
        reason: "empty_items",
      })
      return NextResponse.json({ received: true })
    }

    let printfulResult
    try {
      printfulResult = await createPrintfulOrder(printfulInput)
    } catch (error) {
      const failureUpdate = buildPrintfulFailureEventUpdate(error, externalId)
      console.error(`[mp-webhook] Error Printful para pedido ${orderId}:`, error)
      await recordPrintfulFailure(supabase, orderId, order.notes, "PRINTFUL_API_FAILED", {
        stage: "create_order",
        ...failureUpdate.detail,
      })
      await supabase
        .from("payment_events")
        .update(failureUpdate)
        .eq("provider", "mercadopago")
        .eq("event_id", paymentId)
      return NextResponse.json({ received: true })
    }

    const { data: finalized, error: finalizeError } = await supabase.rpc(
      "finalize_printful_fulfillment",
      {
        p_order_id: orderId,
        p_event_id: paymentId,
        p_payment_id: paymentId,
        p_supplier_order_id: String(printfulResult.id),
      }
    )
    if (finalizeError || finalized !== true) {
      console.error(
        `[mp-webhook] RECONCILIACIÓN REQUERIDA pedido=${orderId} printful=${printfulResult.id} external=${externalId}`,
        finalizeError?.code
      )
      await recordPrintfulFailure(supabase, orderId, order.notes, "PRINTFUL_RECONCILIATION_REQUIRED", {
        stage: "save_supplier_order",
        printful_order_id: String(printfulResult.id),
        external_id: externalId,
      })
    } else {
      console.log(`[mp-webhook] Orden Printful ${printfulResult.id} creada para pedido ${orderId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[mp-webhook] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
