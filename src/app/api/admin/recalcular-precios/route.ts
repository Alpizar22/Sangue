import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const MARGIN = 1.40
const MAX_PRICE = 999999.99

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
      .select("id, cost_price")

    if (fetchError) throw fetchError

    if (!products?.length) {
      return NextResponse.json({ updated: 0, message: "Sin productos" })
    }

    const updates = products.map((p) => {
      const salePrice = Math.min(
        Math.ceil((Number(p.cost_price) * MARGIN) / 10) * 10,
        MAX_PRICE
      )
      return { id: p.id, sale_price: salePrice }
    })

    // Actualizar en lotes de 50
    let totalUpdated = 0
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50)
      for (const u of batch) {
        await supabase.from("products").update({ sale_price: u.sale_price }).eq("id", u.id)
      }
      totalUpdated += batch.length
    }

    console.log(`[recalcular-precios] ${totalUpdated} productos actualizados con margen 40%`)
    return NextResponse.json({ updated: totalUpdated, margin: "40%" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
