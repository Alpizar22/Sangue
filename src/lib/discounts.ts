// Lógica pura de códigos de descuento. El importe SIEMPRE se calcula aquí, en
// el servidor, a partir del subtotal autoritativo que sale de la base de datos:
// el navegador solo envía el código, nunca el descuento ni el total.

export const MAX_DISCOUNT_CODE_LENGTH = 40

export type DiscountType = "percentage" | "fixed"

export interface DiscountCodeRow {
  id: string
  code: string
  type: string
  value: number | string
  active: boolean
  expires_at: string | null
  usage_limit: number | null
  times_used: number
}

export type DiscountRejectionReason =
  | "invalid_format"
  | "not_found"
  | "inactive"
  | "expired"
  | "usage_limit_reached"
  | "invalid_configuration"
  | "empty_cart"

export type DiscountEvaluation =
  | {
      ok: true
      id: string
      code: string
      type: DiscountType
      value: number
      /** Importe descontado, ya redondeado y acotado al subtotal. */
      amount: number
    }
  | { ok: false; reason: DiscountRejectionReason; message: string }

const REJECTION_MESSAGES: Record<DiscountRejectionReason, string> = {
  invalid_format: "El código no es válido.",
  not_found: "El código no existe.",
  inactive: "Este código ya no está disponible.",
  expired: "Este código ya expiró.",
  usage_limit_reached: "Este código alcanzó su límite de usos.",
  invalid_configuration: "Este código no está bien configurado.",
  empty_cart: "Agrega productos antes de aplicar un código.",
}

function reject(reason: DiscountRejectionReason): DiscountEvaluation {
  return { ok: false, reason, message: REJECTION_MESSAGES[reason] }
}

/** Redondeo monetario a dos decimales, evitando el sesgo binario de los float. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

// Los códigos se comparan en mayúsculas: el usuario puede escribirlos como
// quiera, pero el valor canónico es siempre el normalizado.
export function normalizeDiscountCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const cleaned = raw.trim().replace(/\s+/g, "").toUpperCase()
  if (!cleaned || cleaned.length > MAX_DISCOUNT_CODE_LENGTH) return null
  if (!/^[A-Z0-9._-]+$/.test(cleaned)) return null
  return cleaned
}

export function evaluateDiscount(
  row: DiscountCodeRow | null | undefined,
  subtotal: number,
  now: Date = new Date()
): DiscountEvaluation {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return reject("empty_cart")
  if (!row) return reject("not_found")
  if (!row.active) return reject("inactive")

  if (row.expires_at) {
    const expiresAt = new Date(row.expires_at)
    if (Number.isNaN(expiresAt.getTime())) return reject("invalid_configuration")
    if (expiresAt.getTime() <= now.getTime()) return reject("expired")
  }

  if (row.usage_limit != null) {
    if (!Number.isInteger(row.usage_limit) || row.usage_limit <= 0) return reject("invalid_configuration")
    if (row.times_used >= row.usage_limit) return reject("usage_limit_reached")
  }

  if (row.type !== "percentage" && row.type !== "fixed") return reject("invalid_configuration")
  const value = Number(row.value)
  if (!Number.isFinite(value) || value <= 0) return reject("invalid_configuration")
  if (row.type === "percentage" && value > 100) return reject("invalid_configuration")

  const rawAmount = row.type === "percentage" ? (subtotal * value) / 100 : value
  // Nunca puede superar el subtotal: el envío se cobra aparte y el total debe
  // quedar por encima de cero para que MercadoPago acepte la preferencia.
  const amount = Math.min(roundMoney(rawAmount), roundMoney(subtotal))
  if (amount <= 0) return reject("invalid_configuration")

  return {
    ok: true,
    id: row.id,
    code: row.code.toUpperCase(),
    type: row.type,
    value,
    amount,
  }
}

export interface DiscountedTotals {
  subtotal: number
  discountAmount: number
  shippingCost: number
  total: number
}

// El total debe cuadrar al centavo con lo que se le cobra en MercadoPago: el
// webhook rechaza el pago si difiere del total guardado en el pedido.
export function buildDiscountedTotals(
  subtotal: number,
  shippingCost: number,
  discountAmount: number
): DiscountedTotals {
  const safeDiscount = Math.min(Math.max(roundMoney(discountAmount), 0), roundMoney(subtotal))
  const discountedSubtotal = roundMoney(subtotal - safeDiscount)
  return {
    subtotal: roundMoney(subtotal),
    discountAmount: safeDiscount,
    shippingCost: roundMoney(shippingCost),
    total: roundMoney(discountedSubtotal + shippingCost),
  }
}
