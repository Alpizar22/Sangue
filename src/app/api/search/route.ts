import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) return NextResponse.json([])

  const supabase = adminSupabase()
  const columns = "id, title, display_name, sale_price, images, editorial_images, color_images, colors, seccion"
  const [commercialResult, technicalResult] = await Promise.all([
    supabase.from("products").select(columns).ilike("display_name", `%${q}%`).eq("status", "active").limit(8),
    supabase.from("products").select(columns).ilike("title", `%${q}%`).eq("status", "active").limit(8),
  ])

  if (commercialResult.error || technicalResult.error) {
    return NextResponse.json([], { status: 500 })
  }

  const products = new Map(
    [...(commercialResult.data ?? []), ...(technicalResult.data ?? [])]
      .map((product) => [product.id, product] as const)
  )
  return NextResponse.json([...products.values()].slice(0, 8))
}
