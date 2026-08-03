import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHmac } from "crypto"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { Payment } from "mercadopago"
import { createPrintfulOrder, buildPrintfulOrderInput } from "@/lib/printful"
import {
  buildBlockedFulfillmentUpdate,
  preparePrintfulFulfillment,
  type PrintfulProductInfo,
  type StoredFulfillmentItem,
} from "@/lib/printfulVariant"
import type { ShippingAddress } from "@/types"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

// Verifica la firma HMAC-SHA256 que MercadoPago envía en x-signature
// https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
function verifyMPSignature(req: NextRequest, rawBody: string, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — omitiendo validación de firma")
    return true
  }

  const xSignature = req.headers.get("x-signature") ?? ""
  const xRequestId = req.headers.get("x-request-id") ?? ""

  const tsMatch = xSignature.match(/ts=([^,]+)/)
  const v1Match = xSignature.match(/v1=([^,]+)/)
  if (!tsMatch || !v1Match) {
    console.error("[mp-webhook] Header x-signature malformado:", xSignature)
    return false
  }

  const ts = tsMatch[1]
  const v1 = v1Match[1]
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac("sha256", secret).update(manifest).digest("hex")

  if (expected !== v1) {
    console.error("[mp-webhook] Firma inválida")
    return false
  }
  return true
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let body: { type: string; data: { id: string } }

    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { type, data } = body

    if (type !== "payment") {
      return NextResponse.json({ received: true })
    }

    // Validar firma
    if (!verifyMPSignature(req, rawBody, data.id)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const mp = getMercadoPagoClient()
    const payment = await new Payment(mp).get({ id: data.id })

    if (!payment || payment.status !== "approved") {
      return NextResponse.json({ received: true })
    }

    const orderId = payment.external_reference
    if (!orderId) {
      console.warn("[mp-webhook] Sin external_reference en pago:", payment.id)
      return NextResponse.json({ received: true })
    }

    const supabase = adminSupabase()

    // 1. Marcar pedido como pagado
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        mercadopago_payment_id: String(payment.id),
      })
      .eq("id", orderId)
      .select("*, customer:customers(name, phone, email)")
      .single()

    if (orderError || !order) {
      console.error("[mp-webhook] Error actualizando pedido:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log(`[mp-webhook] Pedido ${orderId} marcado como pagado`)

    // 2. Crear orden en Printful
    const customer = order.customer as { name: string; phone: string | null; email: string | null } | null
    const shippingAddress = order.shipping_address as ShippingAddress
    try {
      const storedItems = (order.items ?? []) as StoredFulfillmentItem[]
      const productIds = storedItems.map((i) => i.product_id).filter(Boolean)

      const { data: productRows } = await supabase
        .from("products")
        .select("id, printful_variant_id, printful_variant_map, source")
        .in("id", productIds)

      const printfulProductMap: Record<string, PrintfulProductInfo> = {}
      for (const p of productRows ?? []) {
        if (p.source === "printful") {
          printfulProductMap[p.id] = {
            printful_variant_id: p.printful_variant_id,
            printful_variant_map: p.printful_variant_map,
          }
        }
      }

      const customerPhone = (customer?.phone ?? "").replace(/\D/g, "") || "0000000000"

      // El fulfillment es atómico: primero se resuelven todas las variantes.
      // Si falla una sola, no se envía ningún artículo a Printful.
      const preparation = preparePrintfulFulfillment(storedItems, printfulProductMap)
      if (!preparation.ok) {
        console.error(
          `[mp-webhook] Fulfillment Printful bloqueado para pedido ${orderId}:`,
          JSON.stringify({ orderId, errors: preparation.errors })
        )

        await supabase
          .from("orders")
          .update(buildBlockedFulfillmentUpdate(order.notes, preparation))
          .eq("id", orderId)

        return NextResponse.json({ received: true })
      }

      const printfulInput = buildPrintfulOrderInput({
        customerName: customer?.name ?? "Cliente",
        customerEmail: customer?.email ?? "",
        customerPhone,
        shippingAddress,
        items: preparation.items,
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost,
        total: order.total,
      })

      if (printfulInput) {
        const printfulResult = await createPrintfulOrder(printfulInput)
        await supabase
          .from("orders")
          .update({ status: "ordered_to_supplier", supplier_order_id: String(printfulResult.id) })
          .eq("id", orderId)
        console.log(`[mp-webhook] Orden Printful ${printfulResult.id} creada para pedido ${orderId}`)
      } else {
        await supabase.from("orders").update({ status: "processing" }).eq("id", orderId)
      }
    } catch (printfulErr) {
      // Pago confirmado aunque falle la creación de la orden con Printful —
      // Ximena puede reintentar desde el panel
      console.error(`[mp-webhook] Error Printful para pedido ${orderId}:`, printfulErr)
      await supabase.from("orders").update({ status: "processing" }).eq("id", orderId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[mp-webhook] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
