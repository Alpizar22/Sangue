import type { Product } from "@/types"

// Nombre público de venta. Prioridad: nombre comercial curado a mano →
// título interno real, sin reescribirlo ni inferir un nombre comercial.
export function getDisplayName(product: Pick<Product, "display_name" | "title">): string {
  return product.display_name?.trim() || product.title.trim()
}

// Descriptor corto bajo el nombre. Prioridad: subtitle curado → tipo de
// prenda derivado del catálogo real de Printful (subcategory).
export function getSubtitle(product: Pick<Product, "subtitle" | "subcategory">): string | null {
  return product.subtitle?.trim() || product.subcategory?.trim() || null
}

export function mergeImageUrls(...groups: Array<readonly string[] | null | undefined>): string[] {
  const images: string[] = []
  const seen = new Set<string>()

  for (const rawUrl of groups.flatMap((group) => group ?? [])) {
    if (typeof rawUrl !== "string") continue
    const url = rawUrl.trim()
    if (!url) continue

    const identity = getImageIdentity(url)

    if (!seen.has(identity)) {
      seen.add(identity)
      images.push(url)
    }
  }

  return images
}

function getImageIdentity(url: string): string {
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.endsWith("printful.com")) {
      parsed.search = ""
      parsed.hash = ""
      return parsed.toString()
    }
  } catch {
    // Mantener URLs relativas o no estándar con comparación exacta.
  }
  return trimmed
}

type ProductImages = {
  editorial_images?: readonly string[] | null
  images?: readonly string[] | null
  color_images?: Readonly<Record<string, string>> | null
  colors?: readonly string[] | null
}

function getOrderedColorImages(product: Pick<ProductImages, "color_images" | "colors">): string[] {
  const colorImages = product.color_images ?? {}
  const ordered = (product.colors ?? []).map((color) => colorImages[color])
  return mergeImageUrls(ordered, Object.values(colorImages))
}

export function getPrimaryProductImage(product: ProductImages): string | undefined {
  return mergeImageUrls(
    product.editorial_images?.slice(0, 1),
    getOrderedColorImages(product).slice(0, 1),
    product.images?.slice(0, 1),
  )[0]
}

// Todas las superficies públicas parten de la misma portada: editorial →
// mockup del primer color disponible → imagen general de proveedor.
export function getDisplayImages(product: ProductImages): string[] {
  const primary = getPrimaryProductImage(product)
  return mergeImageUrls(
    primary ? [primary] : [],
    product.editorial_images,
    getOrderedColorImages(product),
    product.images,
  )
}

export function getProductGalleryImages(
  product: ProductImages
): string[] {
  const colorImages = getOrderedColorImages(product)

  // Printful entrega una imagen por variante además de una miniatura general.
  // Cuando existen mockups por color, son la galería comercial canónica y se
  // omiten las miniaturas generales repetidas, conservando primero editoriales.
  return mergeImageUrls(
    product.editorial_images,
    colorImages.length ? [] : product.images,
    colorImages,
  )
}

export function getColorImageIndex(
  product: ProductImages,
  color: string,
): number {
  const colorImage = product.color_images?.[color]?.trim()
  if (!colorImage) return 0

  const identity = getImageIdentity(colorImage)
  const index = getProductGalleryImages(product).findIndex(
    (image) => getImageIdentity(image) === identity
  )
  return index >= 0 ? index : 0
}

export function getColorForImageIndex(product: ProductImages, imageIndex: number): string | null {
  const image = getProductGalleryImages(product)[imageIndex]
  if (!image) return null

  const colorImages = product.color_images ?? {}
  const colors = [...new Set([...(product.colors ?? []), ...Object.keys(colorImages)])]
  const identity = getImageIdentity(image)
  return colors.find((color) => {
    const colorImage = colorImages[color]
    return colorImage && getImageIdentity(colorImage) === identity
  }) ?? null
}
