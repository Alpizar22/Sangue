import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchDropiProduct } from "@/lib/dropi/catalog"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "id numérico requerido" }, { status: 400 })
    }

    const product = await fetchDropiProduct(Number(id))

    const row = {
      shein_product_id: `dropi_${product.id}`,
      shein_url: `https://app.dropi.mx/productos/${product.id}`,
      dropi_product_id: product.id,
      title: product.title,
      description: product.description || null,
      images: product.images,
      original_price: product.price,
      cost_price: product.price,
      sale_price: product.price,
      markup_percentage: 0,
      category: product.category,
      tags: ["dropi"],
      sizes: product.variations.map((v) => v.name),
      colors: [] as string[],
      status: "active" as const,
      source: "dropi",
      seccion: "general",
      stock: 99,
    }

    const supabase = adminSupabase()
    const { error } = await supabase
      .from("products")
      .upsert(row, { onConflict: "shein_product_id" })

    if (error) {
      // dropi_product_id column might not exist yet — retry without it
      if (error.message?.includes("dropi_product_id")) {
        const { dropi_product_id: _, ...rowWithout } = row as typeof row & { dropi_product_id: number }
        const { error: err2 } = await supabase
          .from("products")
          .upsert(rowWithout, { onConflict: "shein_product_id" })
        if (err2) return NextResponse.json({ error: err2.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, product })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
