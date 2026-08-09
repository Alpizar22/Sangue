import type { ShippingAddress } from "@/types"

export const SHIPPING_COST_MXN = 155
export const MAX_ITEM_QUANTITY = 10

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const POSTAL_CODE_PATTERN = /^\d{5}$/

export interface CheckoutItemInput {
  product_id: string
  quantity: number
  size: string
  color: string
}

export interface CheckoutInput {
  items: CheckoutItemInput[]
  customer: { email: string; name: string; phone: string }
  shipping_address: ShippingAddress
}

export interface CheckoutValidationIssue {
  field: string
  code: string
  message: string
}

export type CheckoutParseResult =
  | { ok: true; value: CheckoutInput }
  | { ok: false; issues: CheckoutValidationIssue[] }

export interface AuthoritativeProduct {
  id: string
  title: string
  display_name?: string | null
  sale_price: number
  cost_price: number
  status: string
  source?: string | null
  stock?: number | null
  size_stock?: Record<string, number> | null
  color_size_stock?: Record<string, number> | null
  sizes: string[] | null
  colors: string[] | null
  color_sizes?: Record<string, string[]> | null
  printful_variant_map?: Record<string, number> | null
}

export interface AuthoritativeOrderItem {
  product_id: string
  title: string
  quantity: number
  size: string
  color: string
  unit_price: number
  unit_cost: number
}

export type AuthoritativeCartResult =
  | {
      ok: true
      items: AuthoritativeOrderItem[]
      subtotal: number
      shippingCost: number
      total: number
    }
  | { ok: false; issues: CheckoutValidationIssue[] }

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  const cleaned = value.trim().replace(/\s+/g, " ")
  if (!cleaned || cleaned.length > maxLength) return null
  return cleaned
}

function canonicalValue(value: string, options: string[] | null | undefined): string | null {
  const normalized = value.trim().toLocaleLowerCase("es-MX")
  return options?.find((option) => option.trim().toLocaleLowerCase("es-MX") === normalized) ?? null
}

function hasMappedVariant(map: Record<string, number>, color: string, size: string): boolean {
  const wanted = `${color.trim().toLocaleLowerCase("es-MX")}|${size.trim().toLocaleLowerCase("es-MX")}`
  return Object.entries(map).some(([key, variantId]) => {
    const separator = key.indexOf("|")
    if (separator === -1 || !Number.isInteger(variantId) || variantId <= 0) return false
    const normalized = `${key.slice(0, separator).trim().toLocaleLowerCase("es-MX")}|${key
      .slice(separator + 1)
      .trim()
      .toLocaleLowerCase("es-MX")}`
    return normalized === wanted
  })
}

// Extraído para que la validación de códigos de descuento reutilice
// exactamente las mismas reglas de artículos que el checkout, sin duplicarlas.
export function parseCheckoutItems(rawItems: unknown): {
  items: CheckoutItemInput[]
  issues: CheckoutValidationIssue[]
} {
  const issues: CheckoutValidationIssue[] = []
  const parsedItems: CheckoutItemInput[] = []

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    issues.push({ field: "items", code: "required", message: "Agrega al menos un producto." })
    return { items: parsedItems, issues }
  }
  if (rawItems.length > 20) {
    issues.push({ field: "items", code: "too_many", message: "El pedido tiene demasiadas líneas." })
    return { items: parsedItems, issues }
  }

  rawItems.forEach((rawItem, index) => {
    const prefix = `items.${index}`
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      issues.push({ field: prefix, code: "invalid", message: "Artículo inválido." })
      return
    }
    const item = rawItem as Record<string, unknown>
    const productId = cleanString(item.product_id, 36)
    const color = cleanString(item.color, 80)
    const size = cleanString(item.size, 40)
    const quantity = item.quantity
    if (!productId || !UUID_PATTERN.test(productId)) {
      issues.push({ field: `${prefix}.product_id`, code: "invalid", message: "Producto inválido." })
    }
    if (!Number.isInteger(quantity) || Number(quantity) <= 0 || Number(quantity) > MAX_ITEM_QUANTITY) {
      issues.push({
        field: `${prefix}.quantity`,
        code: "invalid_quantity",
        message: `La cantidad debe ser un entero entre 1 y ${MAX_ITEM_QUANTITY}.`,
      })
    }
    if (!color) issues.push({ field: `${prefix}.color`, code: "required", message: "Selecciona un color." })
    if (!size) issues.push({ field: `${prefix}.size`, code: "required", message: "Selecciona una talla." })
    if (productId && UUID_PATTERN.test(productId) && color && size && Number.isInteger(quantity)) {
      parsedItems.push({ product_id: productId, quantity: Number(quantity), color, size })
    }
  })

  return { items: parsedItems, issues }
}

export function parseCheckoutBody(body: unknown): CheckoutParseResult {
  const issues: CheckoutValidationIssue[] = []
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, issues: [{ field: "body", code: "invalid", message: "Solicitud inválida." }] }
  }

  const raw = body as Record<string, unknown>
  const parsedItemsResult = parseCheckoutItems(raw.items)
  const parsedItems = parsedItemsResult.items
  issues.push(...parsedItemsResult.issues)

  const rawCustomer = raw.customer && typeof raw.customer === "object" && !Array.isArray(raw.customer)
    ? raw.customer as Record<string, unknown>
    : {}
  const email = cleanString(rawCustomer.email, 254)?.toLocaleLowerCase("es-MX") ?? null
  const name = cleanString(rawCustomer.name, 120)
  const phone = typeof rawCustomer.phone === "string" ? rawCustomer.phone.replace(/\D/g, "") : ""
  if (!email || !EMAIL_PATTERN.test(email)) issues.push({ field: "customer.email", code: "invalid", message: "Email inválido." })
  if (!name || name.length < 2) issues.push({ field: "customer.name", code: "invalid", message: "Nombre inválido." })
  if (!/^\d{10}$/.test(phone)) issues.push({ field: "customer.phone", code: "invalid", message: "El teléfono debe tener 10 dígitos." })

  const rawAddress = raw.shipping_address && typeof raw.shipping_address === "object" && !Array.isArray(raw.shipping_address)
    ? raw.shipping_address as Record<string, unknown>
    : {}
  const street = cleanString(rawAddress.street, 120)
  const number = cleanString(rawAddress.number, 20)
  const floor = typeof rawAddress.floor === "string" ? rawAddress.floor.trim().replace(/\s+/g, " ").slice(0, 40) : ""
  const colonia = cleanString(rawAddress.colonia, 100)
  const municipality = typeof rawAddress.municipality === "string"
    ? rawAddress.municipality.trim().replace(/\s+/g, " ").slice(0, 100)
    : ""
  const city = cleanString(rawAddress.city, 100)
  const province = cleanString(rawAddress.province, 100)
  const postalCode = cleanString(rawAddress.postal_code, 5)
  if (!street) issues.push({ field: "shipping_address.street", code: "required", message: "Calle requerida." })
  if (!number) issues.push({ field: "shipping_address.number", code: "required", message: "Número exterior requerido." })
  if (!colonia) issues.push({ field: "shipping_address.colonia", code: "required", message: "Colonia requerida." })
  if (!city) issues.push({ field: "shipping_address.city", code: "required", message: "Ciudad requerida." })
  if (!province) issues.push({ field: "shipping_address.province", code: "required", message: "Estado requerido." })
  if (!postalCode || !POSTAL_CODE_PATTERN.test(postalCode)) {
    issues.push({ field: "shipping_address.postal_code", code: "invalid", message: "El CP debe tener cinco dígitos." })
  }

  if (issues.length || !email || !name || !street || !number || !colonia || !city || !province || !postalCode) {
    return { ok: false, issues }
  }

  return {
    ok: true,
    value: {
      items: parsedItems,
      customer: { email, name, phone },
      shipping_address: {
        street,
        number,
        floor: floor || undefined,
        colonia,
        municipality: municipality || undefined,
        city,
        province,
        postal_code: postalCode,
        country: "MX",
      },
    },
  }
}

export function buildAuthoritativeCart(
  requestedItems: CheckoutItemInput[],
  products: AuthoritativeProduct[]
): AuthoritativeCartResult {
  const issues: CheckoutValidationIssue[] = []
  const productMap = new Map(products.map((product) => [product.id, product]))
  const validatedItems: Array<{
    product: AuthoritativeProduct
    sourceIndex: number
    quantity: number
    color: string
    size: string
    unitPrice: number
    unitCost: number
  }> = []

  requestedItems.forEach((item, index) => {
    const product = productMap.get(item.product_id)
    const prefix = `items.${index}`
    if (!product) {
      issues.push({ field: `${prefix}.product_id`, code: "not_found", message: "El producto ya no está disponible." })
      return
    }
    if (product.status !== "active" || product.source !== "printful") {
      issues.push({ field: `${prefix}.product_id`, code: "unavailable", message: "El producto ya no está disponible." })
      return
    }
    const color = canonicalValue(item.color, product.colors)
    const size = canonicalValue(item.size, product.sizes)
    if (!color) issues.push({ field: `${prefix}.color`, code: "invalid", message: "El color seleccionado no está disponible." })
    if (!size) issues.push({ field: `${prefix}.size`, code: "invalid", message: "La talla seleccionada no está disponible." })
    if (!color || !size) return

    const allowedSizes = product.color_sizes?.[color]
    if (allowedSizes?.length && !canonicalValue(size, allowedSizes)) {
      issues.push({ field: `${prefix}.size`, code: "invalid_combination", message: "Esa talla no está disponible para el color seleccionado." })
      return
    }
    const variantMap = product.printful_variant_map
    if (variantMap && Object.keys(variantMap).length > 0 && !hasMappedVariant(variantMap, color, size)) {
      issues.push({ field: prefix, code: "invalid_variant", message: "La combinación seleccionada ya no está disponible." })
      return
    }
    const combinationStock = product.color_size_stock?.[`${color}|${size}`]
    if (combinationStock != null && Number(combinationStock) <= 0) {
      issues.push({ field: prefix, code: "unavailable", message: "La combinación seleccionada ya no está disponible." })
      return
    }
    const unitPrice = Number(product.sale_price)
    const unitCost = Number(product.cost_price)
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
      issues.push({ field: `${prefix}.product_id`, code: "invalid_product", message: "No pudimos validar el producto." })
      return
    }
    validatedItems.push({
      product,
      sourceIndex: index,
      quantity: item.quantity,
      color,
      size,
      unitPrice,
      unitCost,
    })
  })

  if (issues.length) return { ok: false, issues }

  const groupedItems = new Map<string, (typeof validatedItems)[number]>()
  for (const item of validatedItems) {
    const key = `${item.product.id}\u0000${item.color}\u0000${item.size}`
    const existing = groupedItems.get(key)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      groupedItems.set(key, { ...item })
    }
  }

  const productQuantities = new Map<string, number>()
  const sizeQuantities = new Map<string, number>()
  const combinationQuantities = new Map<string, number>()
  for (const item of groupedItems.values()) {
    productQuantities.set(item.product.id, (productQuantities.get(item.product.id) ?? 0) + item.quantity)
    const sizeKey = `${item.product.id}\u0000${item.size}`
    sizeQuantities.set(sizeKey, (sizeQuantities.get(sizeKey) ?? 0) + item.quantity)
    const combinationKey = `${item.product.id}\u0000${item.color}\u0000${item.size}`
    combinationQuantities.set(combinationKey, (combinationQuantities.get(combinationKey) ?? 0) + item.quantity)
  }

  const checkedProducts = new Set<string>()
  const checkedSizes = new Set<string>()
  const checkedCombinations = new Set<string>()
  for (const item of groupedItems.values()) {
    const prefix = `items.${item.sourceIndex}`
    if (item.quantity > MAX_ITEM_QUANTITY) {
      issues.push({
        field: `${prefix}.quantity`,
        code: "invalid_quantity",
        message: `La cantidad agregada por variante no puede superar ${MAX_ITEM_QUANTITY}.`,
      })
    }

    if (!checkedProducts.has(item.product.id)) {
      checkedProducts.add(item.product.id)
      const requestedForProduct = productQuantities.get(item.product.id) ?? 0
      if (item.product.stock != null && Number(item.product.stock) < requestedForProduct) {
        issues.push({
          field: `${prefix}.quantity`,
          code: "unavailable",
          message: "No hay disponibilidad suficiente para este producto.",
        })
      }
    }

    const sizeKey = `${item.product.id}\u0000${item.size}`
    if (!checkedSizes.has(sizeKey)) {
      checkedSizes.add(sizeKey)
      const requestedForSize = sizeQuantities.get(sizeKey) ?? 0
      if (item.product.size_stock && Number(item.product.size_stock[item.size] ?? 0) < requestedForSize) {
        issues.push({
          field: `${prefix}.size`,
          code: "unavailable",
          message: "La talla seleccionada ya no está disponible.",
        })
      }
    }

    const combinationKey = `${item.product.id}\u0000${item.color}\u0000${item.size}`
    if (!checkedCombinations.has(combinationKey)) {
      checkedCombinations.add(combinationKey)
      const requestedForCombination = combinationQuantities.get(combinationKey) ?? 0
      const combinationStock = item.product.color_size_stock?.[`${item.color}|${item.size}`]
      if (combinationStock != null && Number(combinationStock) < requestedForCombination) {
        issues.push({
          field: `${prefix}.quantity`,
          code: "unavailable",
          message: "No hay disponibilidad suficiente para esa combinación de color y talla.",
        })
      }
    }
  }

  if (issues.length) return { ok: false, issues }

  const authoritativeItems: AuthoritativeOrderItem[] = [...groupedItems.values()].map((item) => ({
    product_id: item.product.id,
    title: item.product.display_name?.trim() || item.product.title,
    quantity: item.quantity,
    color: item.color,
    size: item.size,
    unit_price: item.unitPrice,
    unit_cost: item.unitCost,
  }))
  const subtotal = authoritativeItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  return {
    ok: true,
    items: authoritativeItems,
    subtotal,
    shippingCost: SHIPPING_COST_MXN,
    total: subtotal + SHIPPING_COST_MXN,
  }
}
