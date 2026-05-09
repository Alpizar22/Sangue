import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST() {
  try {
    const supabase = adminSupabase()

    const { count, error } = await supabase
      .from("products")
      .delete({ count: "exact" })
      .or("source.eq.cj,shein_product_id.like.cj_%")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ deleted: count ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
