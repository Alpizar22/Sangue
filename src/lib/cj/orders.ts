import { cjPost, cjGet } from "./client"
import type { ShippingAddress } from "@/types"

// ─── CJ order types ───────────────────────────────────────────────────────────

export interface CJOrderItem {
  vid: string     // CJ variant ID (stored in shein_sku on our products)
  quantity: number
}

export interface CJOrderInput {
  orderNumber: string       // our internal order ID
  shippingCustomerName: string
  shippingPhone: string
  shippingAddress: string   // street + number
  shippingCity: string
  shippingProvince: string
  shippingCountry: string   // ISO-2, e.g. "MX"
  shippingZip: string
  commodities: CJOrderItem[]
  remark?: string
  logisticName?: string     // optional — CJ picks cheapest if omitted
}

export interface CJOrderResult {
  orderId: string
  orderNum: string
}

// ─── Functions ────────────────────────────────────────────────────────────────

export async function createCJOrder(input: CJOrderInput): Promise<CJOrderResult> {
  return cjPost<CJOrderResult>("/shopping/order/createOrder", input)
}

export async function getCJOrderStatus(orderId: string): Promise<{
  orderId: string
  orderStatus: string
  trackingNumber: string | null
  logisticName: string | null
}> {
  return cjGet(`/shopping/order/getOrderDetail`, { orderId })
}

// ─── Map our order → CJ order ─────────────────────────────────────────────────

export interface OurOrderItem {
  shein_sku: string | null   // holds CJ vid for CJ-sourced products
  quantity: number
  size: string
}

export function buildCJOrderInput(params: {
  orderId: string
  customerName: string
  customerPhone: string
  shippingAddress: ShippingAddress
  items: OurOrderItem[]
  remark?: string
}): CJOrderInput | null {
  const { orderId, customerName, customerPhone, shippingAddress, items, remark } = params

  // Only include items that have a CJ variant ID
  const commodities: CJOrderItem[] = items
    .filter((i) => i.shein_sku && i.shein_sku.startsWith("cj_"))
    .map((i) => ({
      vid: i.shein_sku!.replace(/^cj_/, ""),
      quantity: i.quantity,
    }))

  if (commodities.length === 0) return null

  return {
    orderNumber: orderId,
    shippingCustomerName: customerName,
    shippingPhone: customerPhone.replace(/\D/g, ""),
    shippingAddress: `${shippingAddress.street} ${shippingAddress.number}${shippingAddress.floor ? ` P${shippingAddress.floor}` : ""}${shippingAddress.apartment ? ` D${shippingAddress.apartment}` : ""}`.trim(),
    shippingCity: shippingAddress.city,
    shippingProvince: shippingAddress.province,
    shippingCountry: "MX",
    shippingZip: shippingAddress.postal_code,
    commodities,
    remark,
  }
}
