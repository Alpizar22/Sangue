import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { translateTitles } from "@/lib/translate"

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
    if (!products?.length) return NextResponse.json({ updated: 0, total: 0 })

    const BATCH = 30
    let totalUpdated = 0
    let translateError: string | undefined

    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH)
      const result = await translateTitles(batch.map((p) => p.title))

      // Capture first error encountered and stop if API key is missing
      if (result.error) {
        translateError = result.error
        if (!result.hasApiKey) break  // No key → no point continuing
      }

      for (let j = 0; j < batch.length; j++) {
        if (result.titles[j] && result.titles[j] !== batch[j].title) {
          await supabase
            .from("products")
            .update({ title: result.titles[j] })
            .eq("id", batch[j].id)
          totalUpdated++
        }
      }
    }

    console.log(`[optimizar-nombres] ${totalUpdated}/${products.length} títulos actualizados`)

    return NextResponse.json({
      updated: totalUpdated,
      total: products.length,
      ...(translateError ? { error: translateError } : {}),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    console.error("[optimizar-nombres]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
