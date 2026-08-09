import type { ShippingAddress } from "@/types"

// ─── Base client ────────────────────────────────────────────────────────────

const PRINTFUL_BASE = process.env.PRINTFUL_API_URL || "https://api.printful.com"

interface PrintfulEnvelope<T> {
  code: number
  result: T
  error?: { reason: string; message: string }
}

export class PrintfulApiError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number
  ) {
    super(message)
    this.name = "PrintfulApiError"
  }
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
    throw new PrintfulApiError(
      `Printful ${method} ${path}: respuesta no es JSON (status ${res.status})`,
      res.status
    )
  }
  if (!res.ok || json.code >= 300) {
    throw new PrintfulApiError(
      `Printful ${method} ${path} error ${json.code ?? res.status}: ${json.error?.message ?? json.error?.reason ?? "request_failed"}`,
      res.status
    )
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
  availability_status?: "active" | "discontinued" | "out_of_stock" | "temporary_out_of_stock"
  variant_id: number // catalog variant id; para órdenes sincronizadas se traduce a sync variant id
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
  sync_variant_id: number
  quantity: number
  retail_price?: string
}

export interface PrintfulOrderInput {
  external_id?: string
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
  retail_costs?: { currency: string; subtotal?: string; shipping?: string }
  confirm?: boolean
}

export interface PrintfulOrderResult {
  id: number
  external_id: string | null
  status: string
  [key: string]: unknown
}

export function buildPrintfulAddress2(shippingAddress: ShippingAddress, maxLength = 100): string | undefined {
  const parts = [
    shippingAddress.floor?.trim() ? `Interior ${shippingAddress.floor.trim()}` : "",
    shippingAddress.colonia?.trim() ? `Col. ${shippingAddress.colonia.trim()}` : "",
  ].filter(Boolean)
  if (parts.length === 0) return undefined
  return parts.join(", ").replace(/\s+/g, " ").slice(0, maxLength).trim()
}

export async function createPrintfulOrder(input: PrintfulOrderInput): Promise<PrintfulOrderResult> {
  const { confirm, ...body } = input
  const query = confirm ? "?confirm=1" : ""
  return printfulPost<PrintfulOrderResult>(`/orders${query}`, body)
}

export interface PrintfulSyncItemCandidate {
  product_id: string
  printful_product_id: number | null
  catalog_variant_id: number
  quantity: number
  unit_price: number
}

export interface PrintfulSyncItem {
  sync_variant_id: number
  quantity: number
  unit_price: number
}

export interface PrintfulSyncResolutionError {
  product: string
  printful_product_id: number | null
  catalog_variant_id: number
  reason: "missing_printful_product_id" | "sync_variant_not_found" | "sync_variant_not_synced"
}

export type PrintfulSyncItemResolution =
  | { ok: true; items: PrintfulSyncItem[] }
  | { ok: false; items: []; errors: PrintfulSyncResolutionError[] }

export async function resolvePrintfulSyncItems(
  candidates: PrintfulSyncItemCandidate[],
  loadProduct: (id: number) => Promise<PrintfulSyncProductDetail> = getPrintfulProduct
): Promise<PrintfulSyncItemResolution> {
  const productRequests = new Map<number, Promise<PrintfulSyncProductDetail>>()
  const resolved: PrintfulSyncItem[] = []
  const errors: PrintfulSyncResolutionError[] = []

  for (const candidate of candidates) {
    if (candidate.printful_product_id == null) {
      errors.push({
        product: candidate.product_id,
        printful_product_id: null,
        catalog_variant_id: candidate.catalog_variant_id,
        reason: "missing_printful_product_id",
      })
      continue
    }

    let request = productRequests.get(candidate.printful_product_id)
    if (!request) {
      request = loadProduct(candidate.printful_product_id)
      productRequests.set(candidate.printful_product_id, request)
    }
    const detail = await request
    const syncVariant = detail.sync_variants.find(
      (variant) => variant.variant_id === candidate.catalog_variant_id
    )

    if (!syncVariant || !Number.isSafeInteger(syncVariant.id) || syncVariant.id <= 0) {
      errors.push({
        product: candidate.product_id,
        printful_product_id: candidate.printful_product_id,
        catalog_variant_id: candidate.catalog_variant_id,
        reason: "sync_variant_not_found",
      })
      continue
    }
    if (!syncVariant.synced) {
      errors.push({
        product: candidate.product_id,
        printful_product_id: candidate.printful_product_id,
        catalog_variant_id: candidate.catalog_variant_id,
        reason: "sync_variant_not_synced",
      })
      continue
    }

    resolved.push({
      sync_variant_id: syncVariant.id,
      quantity: candidate.quantity,
      unit_price: candidate.unit_price,
    })
  }

  return errors.length > 0
    ? { ok: false, items: [], errors }
    : { ok: true, items: resolved }
}

export function printfulFailureDetail(error: unknown, externalId: string) {
  return {
    external_id: externalId,
    http_status: error instanceof PrintfulApiError ? error.httpStatus : null,
    message: error instanceof Error ? error.message.slice(0, 500) : "unknown_error",
  }
}

export function buildPrintfulFailureEventUpdate(error: unknown, externalId: string) {
  return {
    status: "printful_failed" as const,
    detail: printfulFailureDetail(error, externalId),
  }
}

// Mapea los items ya traducidos a variantes sincronizadas a una orden Printful.
export function buildPrintfulOrderInput(params: {
  externalId?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: ShippingAddress
  items: { sync_variant_id: number; quantity: number; unit_price: number }[]
  subtotal: number
  shippingCost: number
}): PrintfulOrderInput | null {
  const { externalId, customerName, customerEmail, customerPhone, shippingAddress, items, subtotal, shippingCost } = params

  if (items.length === 0) return null

  return {
    external_id: externalId,
    recipient: {
      name: customerName,
      address1: `${shippingAddress.street} ${shippingAddress.number}`.trim(),
      address2: buildPrintfulAddress2(shippingAddress),
      city: shippingAddress.city || shippingAddress.municipality || "",
      state_code: shippingAddress.province,
      country_code: "MX",
      zip: shippingAddress.postal_code,
      phone: customerPhone.replace(/\D/g, ""),
      email: customerEmail,
    },
    items: items.map((i) => ({
      sync_variant_id: i.sync_variant_id,
      quantity: i.quantity,
      retail_price: i.unit_price.toFixed(2),
    })),
    retail_costs: {
      currency: "MXN",
      subtotal: subtotal.toFixed(2),
      shipping: shippingCost.toFixed(2),
    },
    confirm: true,
  }
}
