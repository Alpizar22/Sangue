import type { Product } from "@/types"

// Limpia un nombre crudo de proveedor (ej. "men's heavyweight long sleeve
// t-shirt") a algo presentable sin inventar ni recortar información —
// solo formatea lo que ya vino de la API.
function titleCaseFallback(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => (word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ")
}

// Nombre público de venta. Prioridad: nombre comercial curado a mano →
// fallback formateado del título real de Printful.
export function getDisplayName(product: Pick<Product, "display_name" | "title">): string {
  return product.display_name?.trim() || titleCaseFallback(product.title)
}

// Descriptor corto bajo el nombre. Prioridad: subtitle curado → tipo de
// prenda derivado del catálogo real de Printful (subcategory).
export function getSubtitle(product: Pick<Product, "subtitle" | "subcategory">): string | null {
  return product.subtitle?.trim() || product.subcategory?.trim() || null
}

export function mergeImageUrls(...groups: Array<readonly string[] | null | undefined>): string[] {
  return [...new Set(groups.flatMap((group) => group ?? []).map((url) => url.trim()).filter(Boolean))]
}

// Imágenes a mostrar. Prioridad: imágenes editoriales propias → imágenes
// reales del producto/Printful. Se conservan ambas fuentes sin duplicados.
export function getDisplayImages(product: Pick<Product, "editorial_images" | "images">): string[] {
  return mergeImageUrls(product.editorial_images, product.images)
}
