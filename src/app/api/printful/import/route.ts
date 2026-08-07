import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPrintfulProduct, getPrintfulCatalogProduct } from "@/lib/printful"
import { hasValidAdminSession } from "@/lib/adminAuth"
import { mergeImageUrls } from "@/lib/presentation"

const EXCHANGE_RATE = 17.5 // solo se aplica si Printful devuelve costos en USD — ver getCostInMxn()
const DEFAULT_MARGIN = 2.75

// Printful's `type` es un enum en inglés (T-SHIRT, HOODIE, ...) — lo usamos como
// subcategory/filtro de prenda en la tienda, con nombres más amigables en español.
const TYPE_LABELS: Record<string, string> = {
  "T-SHIRT": "Playeras",
  "TANK-TOP": "Tops",
  "HOODIE": "Hoodies",
  "SWEATSHIRT": "Sudaderas",
  "LONGSLEEVE": "Manga larga",
  "DRESS": "Vestidos",
  "LEGGINGS": "Leggings",
  "JOGGERS": "Joggers",
  "JACKET": "Chamarras",
  "CAP": "Gorras",
  "BAG": "Bolsas",
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type.toUpperCase()] ?? type.charAt(0) + type.slice(1).toLowerCase()
}

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

function roundUpTo10(n: number): number {
  return Math.ceil(n / 10) * 10
}

export async function POST(req: NextRequest) {
  if (!(await hasValidAdminSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  try {
    const { id, margin } = await req.json()
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "id numérico requerido" }, { status: 400 })
    }
    const marginMultiplier = Number(margin) > 1 ? Number(margin) : DEFAULT_MARGIN

    const detail = await getPrintfulProduct(Number(id))
    const { sync_product, sync_variants } = detail

    if (sync_variants.length === 0) {
      return NextResponse.json({ error: "Producto Printful sin variantes" }, { status: 400 })
    }

    // Costo real de cada variante viene del catálogo general de Printful.
    // OJO: Printful devuelve los precios en la moneda configurada en la cuenta
    // (este store está en MXN), no siempre en USD — convertir solo si hace falta.
    const catalogProductId = sync_variants[0].product.product_id
    const catalog = await getPrintfulCatalogProduct(catalogProductId)
    const costMap = new Map(catalog.variants.map((v) => [v.id, parseFloat(v.price) || 0]))
    const isMxn = (catalog.product.currency ?? "").toUpperCase() === "MXN"

    function toMxn(cost: number): number {
      return isMxn ? cost : cost * EXCHANGE_RATE
    }

    const costsMxn = sync_variants.map((v) => toMxn(costMap.get(v.variant_id) ?? (parseFloat(v.retail_price) || 0)))
    const maxCostMxn = Math.max(...costsMxn)

    const costPrice = roundUpTo10(maxCostMxn)
    const salePrice = roundUpTo10(maxCostMxn * marginMultiplier)

    const colors = new Set<string>()
    const colorSizes: Record<string, string[]> = {}
    const printfulVariantMap: Record<string, number> = {}
    const productImages = new Set<string>()

    for (const sv of sync_variants) {
      const color = sv.color || "Único"
      const size = sv.size || "Única"
      colors.add(color)
      colorSizes[color] = colorSizes[color] ? [...new Set([...colorSizes[color], size])] : [size]
      printfulVariantMap[`${color}|${size}`] = sv.variant_id
      if (sv.product.image) productImages.add(sv.product.image)
    }
    const images = mergeImageUrls(
      sync_product.thumbnail_url ? [sync_product.thumbnail_url] : [],
      [...productImages],
    )

    const sizes = [...new Set(Object.values(colorSizes).flat())]

    const row = {
      shein_product_id: `printful_${sync_product.id}`,
      shein_url: `https://www.printful.com/dashboard/store/product/${sync_product.id}`,
      title: sync_product.name,
      description: catalog.product.title || null,
      images,
      original_price: salePrice,
      cost_price: costPrice,
      sale_price: salePrice,
      markup_percentage: Math.round((marginMultiplier - 1) * 100),
      category: "theia",
      subcategory: catalog.product.type ? typeLabel(catalog.product.type) : null,
      seccion: "theia",
      tags: ["printful", "diseno-propio"],
      sizes,
      colors: [...colors],
      color_sizes: colorSizes,
      status: "active" as const,
      source: "printful",
      stock: 99,
      printful_product_id: sync_product.id,
      printful_variant_id: sync_variants[0].variant_id,
      printful_variant_map: printfulVariantMap,
    }

    const supabase = adminSupabase()
    const { error } = await supabase.from("products").upsert(row, { onConflict: "shein_product_id" })

    if (error) {
      // Columnas printful_* podrían no existir aún — reintenta sin ellas
      if (error.message?.includes("printful_")) {
        const { printful_product_id: _pid, printful_variant_id: _vid, printful_variant_map: _map, ...rowWithout } = row
        void _pid; void _vid; void _map
        const { error: err2 } = await supabase.from("products").upsert(rowWithout, { onConflict: "shein_product_id" })
        if (err2) return NextResponse.json({ error: err2.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      ok: true,
      product: { id: sync_product.id, title: sync_product.name, price: salePrice },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
