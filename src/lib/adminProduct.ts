import type { ProductStatus } from "@/types"

const PRODUCT_STATUSES = new Set<ProductStatus>(["draft", "active", "inactive", "out_of_stock"])

export interface AdminProductInput {
  title: string
  description: string | null
  category: string
  cost_price: number
  original_price: number
  sale_price: number
  status: ProductStatus
  featured: boolean
  sort_order: number | null
}

export type AdminProductParseResult =
  | { ok: true; value: AdminProductInput }
  | { ok: false; error: string }

function money(value: FormDataEntryValue | null): number | null {
  const parsed = Number(String(value ?? "").trim())
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null
}

export function parseAdminProductForm(formData: FormData): AdminProductParseResult {
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const category = String(formData.get("category") ?? "").trim()
  const costPrice = money(formData.get("cost_price"))
  const originalPrice = money(formData.get("original_price"))
  const salePrice = money(formData.get("sale_price"))
  const status = String(formData.get("status") ?? "") as ProductStatus
  const sortOrderRaw = String(formData.get("sort_order") ?? "").trim()
  const sortOrder = sortOrderRaw === "" ? null : Number(sortOrderRaw)

  if (!title) return { ok: false, error: "El título es requerido." }
  if (title.length > 200) return { ok: false, error: "El título no puede superar 200 caracteres." }
  if (!category) return { ok: false, error: "La categoría es requerida." }
  if (category.length > 100) return { ok: false, error: "La categoría no puede superar 100 caracteres." }
  if (description && description.length > 5000) {
    return { ok: false, error: "La descripción no puede superar 5,000 caracteres." }
  }
  if (costPrice === null || originalPrice === null || salePrice === null) {
    return { ok: false, error: "Los precios deben ser importes válidos y no negativos." }
  }
  if (originalPrice <= 0 || salePrice <= 0) {
    return { ok: false, error: "El precio normal y el precio de venta deben ser mayores que cero." }
  }
  if (!PRODUCT_STATUSES.has(status)) return { ok: false, error: "El estado no es válido." }
  if (sortOrder !== null && (!Number.isSafeInteger(sortOrder) || sortOrder < 0)) {
    return { ok: false, error: "El orden debe ser un entero positivo o quedar vacío." }
  }

  return {
    ok: true,
    value: {
      title,
      description,
      category,
      cost_price: costPrice,
      original_price: originalPrice,
      sale_price: salePrice,
      status,
      featured: formData.get("featured") === "on",
      sort_order: sortOrder,
    },
  }
}

export function parseEditorialImages(value: FormDataEntryValue | null): string[] | null {
  const urls = String(value ?? "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (urls.length === 0) return null
  if (urls.length > 20) throw new Error("Se permiten hasta 20 imágenes editoriales.")
  for (const entry of urls) {
    if (entry.length > 2048) throw new Error("Una URL de imagen es demasiado larga.")
    let url: URL
    try {
      url = new URL(entry)
    } catch {
      throw new Error(`URL de imagen inválida: ${entry}`)
    }
    if (url.protocol !== "https:") throw new Error("Todas las imágenes editoriales deben usar HTTPS.")
  }
  return [...new Set(urls)]
}
