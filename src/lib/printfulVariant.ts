// Resuelve qué variant_id de Printful corresponde a un item de pedido
// (color + talla exactos), usando printful_variant_map como fuente de
// verdad y printful_variant_id como respaldo — nunca al revés.
//
// Contrato (estricto — sin fallbacks silenciosos):
// - Si el mapa tiene la combinación exacta (o la misma combinación con
//   espacios/mayúsculas distintas), se usa esa — resolvedBy: "map".
// - Si el mapa EXISTE y tiene variantes, pero no cubre la combinación
//   solicitada (o el item no trae color/talla con qué buscar), es un
//   error duro: NO se cae a printful_variant_id. Un mapa con datos
//   significa que el producto tiene variantes reales por color/talla,
//   así que usar el variant "por defecto" podría enviar la prenda
//   equivocada — mejor excluir el item que arriesgarse.
// - printful_variant_id como fallback solo aplica cuando no hay mapa en
//   absoluto, o el mapa está vacío — es decir, productos realmente de
//   variante única, donde no existe otra fuente de verdad.
// - Si tampoco hay printful_variant_id disponible en ese caso, se
//   devuelve ok:false con un error explícito.

export interface ResolveVariantInput {
  color: string | null | undefined
  size: string | null | undefined
  printfulVariantMap: Record<string, number> | null | undefined
  printfulVariantId: number | null | undefined
}

export type VariantResolution =
  | {
      ok: true
      variantId: number
      resolvedBy: "map" | "fallback-no-map"
    }
  | {
      ok: false
      error: string
    }

function normalizeKeyPart(s: string): string {
  return s.trim().toLowerCase()
}

// Índice normalizado (trim + lowercase) construido aparte del mapa
// original — nunca se muta ni se altera el mapa ni sus valores.
function buildNormalizedIndex(map: Record<string, number>): Map<string, number> {
  const index = new Map<string, number>()
  for (const [key, value] of Object.entries(map)) {
    const sep = key.indexOf("|")
    if (sep === -1) continue
    const color = key.slice(0, sep)
    const size = key.slice(sep + 1)
    index.set(`${normalizeKeyPart(color)}|${normalizeKeyPart(size)}`, value)
  }
  return index
}

export function resolvePrintfulVariant({
  color,
  size,
  printfulVariantMap,
  printfulVariantId,
}: ResolveVariantInput): VariantResolution {
  const hasMap = !!printfulVariantMap && Object.keys(printfulVariantMap).length > 0

  if (hasMap) {
    const hasColor = !!color && color.trim().length > 0
    const hasSize = !!size && size.trim().length > 0

    if (hasColor && hasSize) {
      const exactKey = `${color}|${size}`
      const exactMatch = printfulVariantMap![exactKey]
      if (exactMatch != null) {
        return { ok: true, variantId: exactMatch, resolvedBy: "map" }
      }

      // Reintenta solo normalizando espacios/mayúsculas para la búsqueda —
      // no se alteran los valores originales del mapa ni del item.
      const normalizedMatch = buildNormalizedIndex(printfulVariantMap!).get(
        `${normalizeKeyPart(color!)}|${normalizeKeyPart(size!)}`
      )
      if (normalizedMatch != null) {
        return { ok: true, variantId: normalizedMatch, resolvedBy: "map" }
      }
    }

    // El mapa existe y tiene variantes reales — no se usa printful_variant_id
    // como respaldo aquí. Es preferible excluir el item a arriesgarse a
    // enviar la talla/color equivocados.
    const available = Object.keys(printfulVariantMap!).join(", ")
    return {
      ok: false,
      error:
        `No se encontró la combinación color="${color ?? ""}", talla="${size ?? ""}" en printful_variant_map ` +
        `(claves disponibles: ${available}). printful_variant_id no se usa como respaldo porque el producto ` +
        `tiene variantes mapeadas — se requiere una coincidencia exacta.`,
    }
  }

  // Sin mapa, o mapa vacío — producto realmente de variante única. El
  // único dato disponible es el variant fijo del producto.
  if (printfulVariantId != null) {
    return { ok: true, variantId: printfulVariantId, resolvedBy: "fallback-no-map" }
  }

  return {
    ok: false,
    error: "No hay printful_variant_map ni printful_variant_id para resolver la variante.",
  }
}

export interface StoredFulfillmentItem {
  product_id: string
  quantity: number
  unit_price: number
  size?: string | null
  color?: string | null
}

export interface PrintfulProductInfo {
  printful_variant_id: number | null
  printful_variant_map: Record<string, number> | null
}

export interface ResolvedPrintfulItem {
  printful_variant_id: number
  quantity: number
  unit_price: number
}

export interface FulfillmentResolutionError {
  product: string
  color: string | null
  size: string | null
  reason: string
}

export type PrintfulFulfillmentPreparation =
  | {
      ok: true
      items: ResolvedPrintfulItem[]
    }
  | {
      ok: false
      items: []
      errors: FulfillmentResolutionError[]
      notes: string
    }

export function formatFulfillmentBlockNotes(errors: FulfillmentResolutionError[]): string {
  return `[PRINTFUL_FULFILLMENT_BLOCKED] ${JSON.stringify({ errors })}`
}

export function appendFulfillmentNotes(existingNotes: string | null, blockNotes: string): string {
  const current = existingNotes?.trim()
  if (current?.includes(blockNotes)) return current
  return current ? `${current}\n${blockNotes}` : blockNotes
}

export function buildBlockedFulfillmentUpdate(
  existingNotes: string | null,
  preparation: Extract<PrintfulFulfillmentPreparation, { ok: false }>
): { status: "processing"; supplier_order_id: null; notes: string } {
  return {
    status: "processing",
    supplier_order_id: null,
    notes: appendFulfillmentNotes(existingNotes, preparation.notes),
  }
}

// Prepara el pedido completo antes de cualquier llamada a Printful. El
// resultado es atómico: todos los artículos resueltos o ninguno.
export function preparePrintfulFulfillment(
  storedItems: StoredFulfillmentItem[],
  printfulProductMap: Record<string, PrintfulProductInfo>
): PrintfulFulfillmentPreparation {
  const resolvedItems: ResolvedPrintfulItem[] = []
  const errors: FulfillmentResolutionError[] = []

  for (const item of storedItems) {
    const info = printfulProductMap[item.product_id]
    if (!info) {
      errors.push({
        product: item.product_id,
        color: item.color ?? null,
        size: item.size ?? null,
        reason: "El producto no existe en el catálogo activo de Printful.",
      })
      continue
    }

    const resolution = resolvePrintfulVariant({
      color: item.color,
      size: item.size,
      printfulVariantMap: info.printful_variant_map,
      printfulVariantId: info.printful_variant_id,
    })

    if (!resolution.ok) {
      errors.push({
        product: item.product_id,
        color: item.color ?? null,
        size: item.size ?? null,
        reason: resolution.error,
      })
      continue
    }

    resolvedItems.push({
      printful_variant_id: resolution.variantId,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })
  }

  if (errors.length > 0) {
    return {
      ok: false,
      items: [],
      errors,
      notes: formatFulfillmentBlockNotes(errors),
    }
  }

  return { ok: true, items: resolvedItems }
}
