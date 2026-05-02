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
  const { data, error } = await supabase
    .from("products")
    .select("id, title, price, sale_price, images, seccion")
    .ilike("title", `%${q}%`)
    .eq("status", "active")
    .limit(8)

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}
