import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { translateTitles } from "@/app/api/cj/sync/route"

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  if (!cookieStore.get("admin_session")?.value) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const supabase = adminSupabase()

    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, title")

    if (fetchError) throw fetchError
    if (!products?.length) return NextResponse.json({ updated: 0 })

    const BATCH = 30
    let totalUpdated = 0

    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH)
      const translated = await translateTitles(batch.map((p) => p.title))

      for (let j = 0; j < batch.length; j++) {
        if (translated[j] && translated[j] !== batch[j].title) {
          await supabase
            .from("products")
            .update({ title: translated[j] })
            .eq("id", batch[j].id)
          totalUpdated++
        }
      }
    }

    console.log(`[optimizar-nombres] ${totalUpdated} títulos actualizados`)
    return NextResponse.json({ updated: totalUpdated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
