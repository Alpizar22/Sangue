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
const SHIPPING_MXN = 120   // costo fijo estimado de envío CJ → México
const MARGIN = 1.30        // 30% de margen mínimo sobre costo real
const MAX_PRICE = 999999.99

function mapCJProductToRow(p: CJProduct, category: string) {
  const rawCostUSD = parseFloat(p.sellPrice) || 0
  // Costo real = precio CJ en MXN + envío estimado
  const costPrice = Math.min(rawCostUSD * USD_TO_MXN + SHIPPING_MXN, MAX_PRICE)
  // Precio venta = costo real × 1.30, redondeado al 100 MXN superior
  const salePrice = Math.min(Math.ceil((costPrice * MARGIN) / 100) * 100, MAX_PRICE)
  const stock = p.warehouseInventoryNum ?? 99

  return {
    shein_product_id: `cj_${p.id}`,
    shein_url: `https://app.cjdropshipping.com/product-detail.html?id=${p.id}`,
    title: p.nameEn,
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
    const rows = cjProducts.map((p) => mapCJProductToRow(p, category))

    const { error, count } = await supabase
      .from("products")
      .upsert(rows, { onConflict: "shein_product_id", count: "exact" })

    if (error) {
      console.error("[cj/sync] upsert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[cj/sync] Sincronizados ${count} productos de categoría ${categoryId}`)
    return NextResponse.json({ synced: count, total, page, limit })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    console.error("[cj/sync]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
