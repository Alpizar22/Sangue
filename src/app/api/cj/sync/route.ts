import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCJProducts } from "@/lib/cj/catalog"
import type { CJProduct } from "@/lib/cj/catalog"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

const USD_TO_MXN = 17.5
const MARGIN = 1.40   // 40% sobre costo CJ (envío cobrado por separado al cliente)
const MAX_PRICE = 999999.99

export async function translateTitles(titles: string[]): Promise<string[]> {
  if (!titles.length) return titles
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn("[sync] ANTHROPIC_API_KEY no configurado — usando títulos originales")
    return titles
  }
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Traduce estos títulos de productos de inglés a español. Reglas:
- Máximo 40 caracteres cada uno
- Estilo minimalista/aesthetic: omitir "casual", "comfort", "women's", "solid color", "ladies", marcas
- Mantener solo las características esenciales (prenda, corte, detalle principal)
- Devuelve ÚNICAMENTE un array JSON con los títulos traducidos, sin texto extra ni markdown

Ejemplos:
"Casual Loose Lapels Mid-sleeve Large Swing Dress" → "Vestido swing manga media"
"Women's Solid Color Casual Loose Long Sleeve V-neck Shirt" → "Blusa cuello V manga larga"
"Comfort And Casual Long Sleeve Striped Button Top" → "Top a rayas con botones"

Títulos:
${JSON.stringify(titles)}`,
      }],
    })
    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return titles
    const translated = JSON.parse(match[0]) as string[]
    return Array.isArray(translated) && translated.length === titles.length ? translated : titles
  } catch (err) {
    console.error("[sync] Error traduciendo títulos:", err)
    return titles
  }
}

function mapCJProductToRow(p: CJProduct, category: string, translatedTitle?: string) {
  const rawCostUSD = parseFloat(p.sellPrice) || 0
  const costPrice = Math.min(rawCostUSD * USD_TO_MXN, MAX_PRICE)
  const salePrice = Math.min(Math.ceil((costPrice * MARGIN) / 10) * 10, MAX_PRICE)
  const stock = p.warehouseInventoryNum ?? 99

  return {
    shein_product_id: `cj_${p.id}`,
    shein_url: `https://app.cjdropshipping.com/product-detail.html?id=${p.id}`,
    title: translatedTitle ?? p.nameEn,
    description: null as null,
    images: p.bigImage ? [p.bigImage] : [],
    original_price: costPrice,
    cost_price: costPrice,
    sale_price: salePrice,
    markup_percentage: costPrice > 0 ? Math.round((salePrice / costPrice - 1) * 100) : 0,
    category,
    tags: ["cj"],
    sizes: [] as string[],
    colors: [] as string[],
    shein_sku: null as null,
    subcategory: p.threeCategoryName ?? null,
    seccion: category === "Jerseys" ? "jerseys" : "mujer",
    stock,
    status: "active" as const,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const categoryId: string = body.categoryId ?? ""
    const category: string = body.category ?? ""
    const page: number = body.page ?? 1
    const limit: number = Math.min(body.limit ?? 50, 100)

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId requerido" }, { status: 400 })
    }

    const { products: cjProducts, total } = await getCJProducts(categoryId, page, limit)

    if (!cjProducts.length) {
      return NextResponse.json({ synced: 0, total, message: "Sin productos en esa categoría" })
    }

    const supabase = adminSupabase()

    const { count: currentCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    const MAX_PRODUCTS = 90
    const available = MAX_PRODUCTS - (currentCount ?? 0)

    if (available <= 0) {
      return NextResponse.json({ synced: 0, total, page, limit, message: "Límite de 90 productos alcanzado. Elimina algunos antes de sincronizar." })
    }

    const sliced = cjProducts.slice(0, available)
    const translatedTitles = await translateTitles(sliced.map((p) => p.nameEn))
    const rows = sliced.map((p, i) => mapCJProductToRow(p, category, translatedTitles[i]))

    const { error, count } = await supabase
      .from("products")
      .upsert(rows, { onConflict: "shein_product_id", count: "exact" })

    if (error) {
      console.error("[cj/sync] upsert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const limitMsg = rows.length < cjProducts.length ? ` (limitado a ${rows.length} — límite 90)` : ""
    console.log(`[cj/sync] Sincronizados ${count} productos de categoría ${categoryId}`)
    return NextResponse.json({ synced: count, total, page, limit, message: limitMsg || undefined })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    console.error("[cj/sync]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
