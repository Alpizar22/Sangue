import { dropiPost } from "./client"
import type { ShippingAddress } from "@/types"

// ── Dropi order structure (confirmed by Dropi support) ──────────────────────

export interface DropiOrderProduct {
  dropi_product_id: number
  price: number
  quantity: number
}

export interface DropiOrderInput {
  name: string
  surname: string
  phone: string
  dir: string
  state: string
  city: string
  client_email: string
  total_order: number
  payment_method_id: 2          // 2 = pago anticipado (MercadoPago ya cobró)
  calculate_costs_and_shiping: true   // sic — typo is in Dropi's API
  products: DropiOrderProduct[]
}

export interface DropiOrderResult {
  id?: number | string
  order_id?: number | string
  status?: string
  [key: string]: unknown
}

export async function createDropiOrder(input: DropiOrderInput): Promise<DropiOrderResult> {
  return dropiPost<DropiOrderResult>("/orders/create", input)
}

// ── Map our order → Dropi order ─────────────────────────────────────────────

export function buildDropiOrderInput(params: {
  customerFirstName: string
  customerLastName: string
  customerPhone: string
  customerEmail: string
  shippingAddress: ShippingAddress
  products: DropiOrderProduct[]
  subtotal: number              // products only — Dropi calculates its own shipping
}): DropiOrderInput | null {
  const { customerFirstName, customerLastName, customerPhone, customerEmail, shippingAddress, products, subtotal } = params

  if (products.length === 0) return null

  const dir = [
    `${shippingAddress.street} ${shippingAddress.number}`.trim(),
    shippingAddress.floor ? `Int. ${shippingAddress.floor}` : null,
    shippingAddress.colonia ?? null,
  ]
    .filter(Boolean)
    .join(", ")

  return {
    name: customerFirstName,
    surname: customerLastName,
    phone: customerPhone.replace(/\D/g, ""),
    dir,
    state: shippingAddress.province,
    city: shippingAddress.city,
    client_email: customerEmail,
    total_order: subtotal,
    payment_method_id: 2,
    calculate_costs_and_shiping: true,
    products,
  }
}
