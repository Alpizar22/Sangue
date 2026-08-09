interface PrintfulImageVariant {
  color?: string | null
  files?: Array<{ type: string; preview_url?: string }>
  product?: { image?: string | null }
}

const COMMERCIAL_IMAGE_TYPES = new Set(["mockup", "preview"])

export function buildPrintfulColorImages(variants: PrintfulImageVariant[]): Record<string, string> {
  const colors: string[] = []
  const previewsByColor = new Map<string, string[]>()
  const fallbackByColor = new Map<string, string>()

  for (const variant of variants) {
    const color = variant.color?.trim()
    if (!color) continue

    if (!previewsByColor.has(color)) {
      colors.push(color)
      previewsByColor.set(color, [])
    }

    const previews = previewsByColor.get(color)!
    for (const file of variant.files ?? []) {
      const previewUrl = file.preview_url?.trim()
      if (COMMERCIAL_IMAGE_TYPES.has(file.type) && previewUrl && !previews.includes(previewUrl)) {
        previews.push(previewUrl)
      }
    }

    const fallback = variant.product?.image?.trim()
    if (fallback && !fallbackByColor.has(color)) {
      fallbackByColor.set(color, fallback)
    }
  }

  return Object.fromEntries(
    colors.flatMap((color, colorIndex) => {
      const previews = previewsByColor.get(color) ?? []
      const image = previews.length > 0
        ? previews[colorIndex % previews.length]
        : fallbackByColor.get(color)

      return image ? [[color, image]] : []
    }),
  )
}
