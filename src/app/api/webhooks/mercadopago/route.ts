import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHmac } from "crypto"
import { getMercadoPagoClient } from "@/lib/mercadopago/client"
import { Payment } from "mercadopago"
import { createCJOrder, buildCJOrderInput } from "@/lib/cj/orders"
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
      .select("*, customer:customers(name, phone)")
      .single()

    if (orderError || !order) {
      console.error("[mp-webhook] Error actualizando pedido:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log(`[mp-webhook] Pedido ${orderId} marcado como pagado`)

    // 2. Crear orden en CJ para ítems con variant ID de CJ
    const customer = order.customer as { name: string; phone: string | null } | null
    const shippingAddress = order.shipping_address as ShippingAddress

    const cjInput = buildCJOrderInput({
      orderId,
      customerName: customer?.name ?? "Cliente",
      customerPhone: customer?.phone ?? "0000000000",
      shippingAddress,
      items: (order.items ?? []) as { shein_sku: string | null; quantity: number; size: string }[],
      remark: `Pedido Theia #${orderId.slice(0, 8)}`,
    })

    if (cjInput) {
      try {
        const cjResult = await createCJOrder(cjInput)
        await supabase
          .from("orders")
          .update({ status: "ordered_to_supplier", supplier_order_id: cjResult.orderId })
          .eq("id", orderId)
        console.log(`[mp-webhook] Orden CJ ${cjResult.orderId} creada para pedido ${orderId}`)
      } catch (cjErr) {
        // Pago confirmado aunque CJ falle — Ximena puede reintentar desde el panel
        console.error(`[mp-webhook] Error CJ para pedido ${orderId}:`, cjErr)
        await supabase.from("orders").update({ status: "processing" }).eq("id", orderId)
      }
    } else {
      // Sin ítems CJ — revisión manual
      await supabase.from("orders").update({ status: "processing" }).eq("id", orderId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[mp-webhook] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
