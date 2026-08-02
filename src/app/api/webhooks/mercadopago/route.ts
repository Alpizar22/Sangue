import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHmac } from "crypto"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { Payment } from "mercadopago"
import { createDropiOrder, buildDropiOrderInput } from "@/lib/dropi/orders"
import { createPrintfulOrder, buildPrintfulOrderInput } from "@/lib/printful"
import type { ShippingAddress } from "@/types"

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: "." }
  const mid = Math.ceil(parts.length / 2)
  return { first: parts.slice(0, mid).join(" "), last: parts.slice(mid).join(" ") }
}

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

    // 2. Crear orden(es) en el/los proveedor(es) — Dropi y/o Printful según el source de cada producto
    const customer = order.customer as { name: string; phone: string | null; email: string | null } | null
    const shippingAddress = order.shipping_address as ShippingAddress
    type StoredItem = { product_id: string; quantity: number; unit_price: number }

    const supplierIds: string[] = []
    let anySucceeded = false

    try {
      const storedItems = (order.items ?? []) as StoredItem[]
      const productIds = storedItems.map((i) => i.product_id).filter(Boolean)

      const { data: productRows } = await supabase
        .from("products")
        .select("id, dropi_product_id, printful_variant_id, source")
        .in("id", productIds)

      const dropiIdMap: Record<string, number> = {}
      const printfulIdMap: Record<string, number> = {}
      for (const p of productRows ?? []) {
        if (p.dropi_product_id) dropiIdMap[p.id] = p.dropi_product_id
        if (p.source === "printful" && p.printful_variant_id) printfulIdMap[p.id] = p.printful_variant_id
      }

      const { first, last } = splitName(customer?.name ?? "Cliente")
      const customerPhone = (customer?.phone ?? "").replace(/\D/g, "") || "0000000000"

      // ── Dropi ──
      const dropiProducts = storedItems
        .filter((i) => dropiIdMap[i.product_id])
        .map((i) => ({
          dropi_product_id: dropiIdMap[i.product_id],
          price: i.unit_price,
          quantity: i.quantity,
        }))

      const dropiInput = buildDropiOrderInput({
        customerFirstName: first,
        customerLastName: last,
        customerPhone,
        customerEmail: customer?.email ?? "",
        shippingAddress,
        products: dropiProducts,
        subtotal: order.subtotal,
      })

      if (dropiInput) {
        try {
          const dropiResult = await createDropiOrder(dropiInput)
          const supplierId = String(dropiResult.id ?? dropiResult.order_id ?? "")
          supplierIds.push(`dropi:${supplierId}`)
          anySucceeded = true
          console.log(`[mp-webhook] Orden Dropi ${supplierId} creada para pedido ${orderId}`)
        } catch (dropiErr) {
          console.error(`[mp-webhook] Error Dropi para pedido ${orderId}:`, dropiErr)
        }
      }

      // ── Printful ──
      const printfulItems = storedItems
        .filter((i) => printfulIdMap[i.product_id])
        .map((i) => ({
          printful_variant_id: printfulIdMap[i.product_id],
          quantity: i.quantity,
          unit_price: i.unit_price,
        }))

      const printfulInput = buildPrintfulOrderInput({
        customerName: customer?.name ?? "Cliente",
        customerEmail: customer?.email ?? "",
        customerPhone,
        shippingAddress,
        items: printfulItems,
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost,
        total: order.total,
      })

      if (printfulInput) {
        try {
          const printfulResult = await createPrintfulOrder(printfulInput)
          supplierIds.push(`printful:${printfulResult.id}`)
          anySucceeded = true
          console.log(`[mp-webhook] Orden Printful ${printfulResult.id} creada para pedido ${orderId}`)
        } catch (printfulErr) {
          console.error(`[mp-webhook] Error Printful para pedido ${orderId}:`, printfulErr)
        }
      }

      await supabase
        .from("orders")
        .update({
          status: anySucceeded ? "ordered_to_supplier" : "processing",
          supplier_order_id: supplierIds.length ? supplierIds.join(" / ") : null,
        })
        .eq("id", orderId)
    } catch (supplierErr) {
      // Pago confirmado aunque falle la creación de la orden con el proveedor —
      // Ximena puede reintentar desde el panel
      console.error(`[mp-webhook] Error creando orden(es) de proveedor para pedido ${orderId}:`, supplierErr)
      await supabase.from("orders").update({ status: "processing" }).eq("id", orderId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[mp-webhook] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
