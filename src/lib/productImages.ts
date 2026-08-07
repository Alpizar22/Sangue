interface PrintfulImageVariant {
  color?: string | null
  files?: Array<{ type: string; preview_url?: string }>
  product?: { image?: string | null }
}

const COMMERCIAL_IMAGE_TYPES = new Set(["mockup", "preview"])

export function buildPrintfulColorImages(variants: PrintfulImageVariant[]): Record<string, string> {
  const colorImages: Record<string, string> = {}

  for (const variant of variants) {
    const color = variant.color?.trim()
    if (!color) continue

    const commercialPreview = variant.files?.find(
      (file) => COMMERCIAL_IMAGE_TYPES.has(file.type) && file.preview_url?.trim()
    )?.preview_url?.trim()

    if (commercialPreview) {
      colorImages[color] = commercialPreview
    } else if (!colorImages[color] && variant.product?.image?.trim()) {
      colorImages[color] = variant.product.image.trim()
    }
  }

  return colorImages
}
