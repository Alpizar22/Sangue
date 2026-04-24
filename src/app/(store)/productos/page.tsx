import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import FilterPanel from "@/components/store/FilterPanel"
import ProductGrid from "@/components/store/ProductGrid"

export const revalidate = 60

type SearchParams = Promise<{
  categoria?: string
  q?: string
  talla?: string
  orden?: string
}>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { categoria, q } = await searchParams
  const title = q
    ? `Búsqueda: "${q}"`
    : categoria
    ? `${categoria} — Theia`
    : "Colección — Theia"
  return {
    title,
    description: "Ropa y jerseys con envío a todo México. Pago seguro con MercadoPago.",
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { categoria, q, talla, orden } = await searchParams
  const supabase = await createClient()

  let query = supabase.from("products").select("*").eq("status", "active")

  if (categoria) query = query.eq("category", categoria)
  if (q) query = query.ilike("title", `%${q}%`)
  if (talla) query = query.contains("sizes", [talla])

  switch (orden) {
    case "precio_asc":
      query = query.order("sale_price", { ascending: true })
      break
    case "precio_desc":
      query = query.order("sale_price", { ascending: false })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  const { data: products } = await query

  const count = (products ?? []).length
  const heading = q ? `"${q}"` : categoria ?? "Colección"

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Encabezado de sección */}
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1
              className="text-3xl italic"
              style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
            >
              {heading}
            </h1>
            <p
              className="text-[10px] uppercase tracking-[0.2em] mt-1"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
            >
              {count} {count === 1 ? "producto" : "productos"}
            </p>
          </div>
        </div>

        {/* Layout: sidebar (desktop) arriba (mobile) + grid */}
        <div className="flex flex-col gap-0 lg:flex-row lg:gap-10 lg:items-start">

          {/* FilterPanel: desktop → aside fija izquierda, mobile → barra arriba */}
          <Suspense fallback={<div className="hidden lg:block w-44 flex-shrink-0" />}>
            <FilterPanel />
          </Suspense>

          {/* Grid de productos: full-width mobile, flex-1 desktop */}
          <div className="w-full lg:flex-1 lg:min-w-0">
            <ProductGrid products={(products ?? []) as Product[]} />
          </div>

        </div>
      </div>
    </div>
  )
}
