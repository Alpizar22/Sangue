import type { ShippingAddress } from "@/types"

// ─── Base client ────────────────────────────────────────────────────────────

const PRINTFUL_BASE = process.env.PRINTFUL_API_URL || "https://api.printful.com"

interface PrintfulEnvelope<T> {
  code: number
  result: T
  error?: { reason: string; message: string }
}

function getApiKey(): string {
  const key = process.env.PRINTFUL_API_KEY
  if (!key) throw new Error("PRINTFUL_API_KEY no configurado")
  return key
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Authorization: `Bearer ${getApiKey()}` }
  const storeId = process.env.PRINTFUL_STORE_ID
  if (storeId) headers["X-PF-Store-Id"] = storeId
  return headers
}

async function handleResponse<T>(res: Response, method: string, path: string): Promise<T> {
  const raw = await res.text()
  let json: PrintfulEnvelope<T>
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error(`Printful ${method} ${path}: respuesta no es JSON (status ${res.status}): ${raw.slice(0, 200)}`)
  }
  if (!res.ok || json.code >= 300) {
    throw new Error(`Printful ${method} ${path} error ${json.code ?? res.status}: ${json.error?.message ?? raw.slice(0, 200)}`)
  }
  return json.result
}

export async function printfulGet<T = unknown>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${PRINTFUL_BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    cache: "no-store",
  })
  return handleResponse<T>(res, "GET", path)
}

export async function printfulPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PRINTFUL_BASE}${path}`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  return handleResponse<T>(res, "POST", path)
}

// ─── Store products (ya creados/sincronizados en Printful) ─────────────────

export interface PrintfulStoreProduct {
  id: number
  external_id: string | null
  name: string
  variants: number
  synced: number
  thumbnail_url: string | null
}

export async function getPrintfulProducts(): Promise<PrintfulStoreProduct[]> {
  return printfulGet<PrintfulStoreProduct[]>("/store/products")
}

export interface PrintfulSyncVariant {
  id: number
  external_id: string | null
  sync_product_id: number
  name: string
  synced: boolean
  variant_id: number // catalog variant id — el que se usa para crear órdenes
  retail_price: string
  currency: string
  size: string
  color: string
  files: { type: string; preview_url?: string }[]
  product: { variant_id: number; product_id: number; image: string; name: string }
}

export interface PrintfulSyncProductDetail {
  sync_product: {
    id: number
    external_id: string | null
    name: string
    variants: number
    synced: number
    thumbnail_url: string | null
  }
  sync_variants: PrintfulSyncVariant[]
}

export async function getPrintfulProduct(id: number): Promise<PrintfulSyncProductDetail> {
  return printfulGet<PrintfulSyncProductDetail>(`/store/products/${id}`)
}

// ─── Catálogo general (blanks: Bella+Canvas, Gildan, etc) ──────────────────

export interface PrintfulCatalogVariant {
  id: number
  product_id: number
  name: string
  size: string
  color: string
  color_code: string | null
  image: string
  price: string // costo Printful en la moneda configurada de la cuenta — ver product.currency
}

export interface PrintfulCatalogProductDetail {
  product: {
    id: number
    type: string
    type_name: string
    title: string
    brand: string | null
    model: string
    image: string
    variant_count: number
    currency: string
  }
  variants: PrintfulCatalogVariant[]
}

export async function getPrintfulCatalogProduct(id: number): Promise<PrintfulCatalogProductDetail> {
  return printfulGet<PrintfulCatalogProductDetail>(`/products/${id}`)
}

// ─── Envío ───────────────────────────────────────────────────────────────────

export interface PrintfulShippingRecipient {
  address1: string
  city: string
  state_code?: string
  country_code: string
  zip: string
}

export interface PrintfulShippingItem {
  variant_id: number
  quantity: number
}

export interface PrintfulShippingRate {
  id: string
  name: string
  rate: string
  currency: string
  min_delivery_days?: number
  max_delivery_days?: number
}

export async function estimateShipping(
  recipient: PrintfulShippingRecipient,
  items: PrintfulShippingItem[]
): Promise<PrintfulShippingRate[]> {
  return printfulPost<PrintfulShippingRate[]>("/shipping/rates", { recipient, items })
}

// ─── Órdenes ─────────────────────────────────────────────────────────────────

export interface PrintfulOrderItem {
  variant_id: number
  quantity: number
  retail_price?: string
}

export interface PrintfulOrderInput {
  recipient: {
    name: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    phone?: string
    email?: string
  }
  items: PrintfulOrderItem[]
  retail_costs?: { currency: string; subtotal?: string; shipping?: string; total?: string }
  confirm?: boolean
}

export interface PrintfulOrderResult {
  id: number
  external_id: string | null
  status: string
  [key: string]: unknown
}

export async function createPrintfulOrder(input: PrintfulOrderInput): Promise<PrintfulOrderResult> {
  return printfulPost<PrintfulOrderResult>("/orders", input)
}

// Mapea nuestro pedido → orden Printful. Cada línea usa el printful_variant_id
// guardado en el producto (variante única por producto — no distingue
// talla/color elegido en el pedido; ver printful_variant_map para eso).
export function buildPrintfulOrderInput(params: {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: ShippingAddress
  items: { printful_variant_id: number; quantity: number; unit_price: number }[]
  subtotal: number
  shippingCost: number
  total: number
}): PrintfulOrderInput | null {
  const { customerName, customerEmail, customerPhone, shippingAddress, items, subtotal, shippingCost, total } = params

  if (items.length === 0) return null

  return {
    recipient: {
      name: customerName,
      address1: `${shippingAddress.street} ${shippingAddress.number}`.trim(),
      address2: shippingAddress.colonia || shippingAddress.floor || undefined,
      city: shippingAddress.city,
      state_code: shippingAddress.province,
      country_code: "MX",
      zip: shippingAddress.postal_code,
      phone: customerPhone.replace(/\D/g, ""),
      email: customerEmail,
    },
    items: items.map((i) => ({
      variant_id: i.printful_variant_id,
      quantity: i.quantity,
      retail_price: i.unit_price.toFixed(2),
    })),
    retail_costs: {
      currency: "MXN",
      subtotal: subtotal.toFixed(2),
      shipping: shippingCost.toFixed(2),
      total: total.toFixed(2),
    },
    confirm: true,
  }
}
