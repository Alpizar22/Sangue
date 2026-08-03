import type { OrderStatus } from "@/types"

export interface PaymentSnapshot {
  id: string
  status: string | null | undefined
  externalReference: string | null | undefined
  currency: string | null | undefined
  amount: number | null | undefined
}

export interface OrderPaymentSnapshot {
  id: string
  total: number
  status: OrderStatus
  supplierOrderId: string | null
}

export type PaymentValidationResult =
  | { ok: true }
  | { ok: false; code: string; reason: string }

export function validateApprovedPayment(
  payment: PaymentSnapshot,
  order: OrderPaymentSnapshot
): PaymentValidationResult {
  if (payment.status !== "approved") {
    return { ok: false, code: "not_approved", reason: "El pago no está aprobado." }
  }
  if (!payment.externalReference || payment.externalReference !== order.id) {
    return { ok: false, code: "order_mismatch", reason: "La referencia del pago no corresponde al pedido." }
  }
  if (payment.currency !== "MXN") {
    return { ok: false, code: "currency_mismatch", reason: "La moneda del pago no es MXN." }
  }
  const amount = Number(payment.amount)
  const expected = Number(order.total)
  if (!Number.isFinite(amount) || !Number.isFinite(expected) || Math.abs(amount - expected) > 0.005) {
    return { ok: false, code: "amount_mismatch", reason: "El monto del pago no coincide con el total del pedido." }
  }
  if (order.supplierOrderId) {
    return { ok: false, code: "already_fulfilled", reason: "El pedido ya tiene una orden de proveedor." }
  }
  if (["ordered_to_supplier", "shipped", "delivered", "cancelled"].includes(order.status)) {
    return { ok: false, code: "terminal_status", reason: "El estado del pedido no permite fulfillment." }
  }
  return { ok: true }
}

export function toPrintfulExternalId(orderId: string): string {
  const externalId = orderId.replace(/-/g, "")
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(externalId)) {
    throw new Error("El ID del pedido no puede convertirse en external_id de Printful")
  }
  return externalId
}

export function canAcceptUnsignedWebhook(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "production"
}
