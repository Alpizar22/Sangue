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

// Imágenes a mostrar. Prioridad: imágenes editoriales propias (si existen
// y no están vacías) → imágenes reales de Printful. Nunca se inventan.
export function getDisplayImages(product: Pick<Product, "editorial_images" | "images">): string[] {
  if (product.editorial_images && product.editorial_images.length > 0) {
    return product.editorial_images
  }
  return product.images ?? []
}
