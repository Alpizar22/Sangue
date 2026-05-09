import { dropiPost } from "./client"
import { getCodDane } from "./cities"
import type { ShippingAddress } from "@/types"

export interface DropiOrderItem {
  id: number          // dropi_product_id
  price: number
  quantity: number
  variation_id?: number
}

export interface DropiOrderInput {
  external_id: string
  products: DropiOrderItem[]
  EnvioConCobro: false
  amount: number
  ciudad_destino: { cod_dane: string }
  nombres: string
  apellidos: string
  telefono: string
  direccion: string
}

export interface DropiOrderResult {
  id?: number | string
  order_id?: number | string
  status?: string
  [key: string]: unknown
}

export async function createDropiOrder(input: DropiOrderInput): Promise<DropiOrderResult> {
  return dropiPost<DropiOrderResult>("/orders", input)
}

export async function buildDropiOrderInput(params: {
  orderId: string
  customerName: string
  shippingAddress: ShippingAddress
  items: Array<{
    dropi_product_id: number | null
    dropi_variation_id?: number | null
    quantity: number
    unit_price: number
  }>
  total: number
}): Promise<DropiOrderInput | null> {
  const { orderId, customerName, shippingAddress, items, total } = params

  const products: DropiOrderItem[] = items
    .filter((i) => i.dropi_product_id != null)
    .map((i) => ({
      id: i.dropi_product_id!,
      price: i.unit_price,
      quantity: i.quantity,
      ...(i.dropi_variation_id ? { variation_id: i.dropi_variation_id } : {}),
    }))

  if (products.length === 0) return null

  const codDane = await getCodDane(shippingAddress.city, shippingAddress.province)
  if (!codDane) {
    throw new Error(`Ciudad no encontrada en Dropi: ${shippingAddress.city}`)
  }

  const nameParts = customerName.trim().split(/\s+/)
  const nombres = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(" ") || customerName
  const apellidos = nameParts.slice(Math.ceil(nameParts.length / 2)).join(" ") || "."

  const street = `${shippingAddress.street} ${shippingAddress.number}`.trim()
  const extras = [
    shippingAddress.floor ? `Piso ${shippingAddress.floor}` : null,
    shippingAddress.apartment ? `Dep ${shippingAddress.apartment}` : null,
    shippingAddress.colonia ?? null,
  ]
    .filter(Boolean)
    .join(", ")

  return {
    external_id: orderId,
    products,
    EnvioConCobro: false,
    amount: total,
    ciudad_destino: { cod_dane: codDane },
    nombres,
    apellidos,
    telefono: shippingAddress.postal_code, // fallback; real phone comes from customer
    direccion: extras ? `${street}, ${extras}` : street,
  }
}
