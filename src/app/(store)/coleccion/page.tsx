import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import FilterPanel, { type CategoryOption } from "@/components/store/FilterPanel"
import ProductGrid from "@/components/store/ProductGrid"

export const revalidate = 60

const MUJER_CATEGORIES: CategoryOption[] = [
  { value: "", label: "Todas" },
  { value: "Lady Dresses", label: "Vestidos" },
  { value: "Blouses & Shirts", label: "Blusas" },
  { value: "Ladies Short Sleeve", label: "Camisetas" },
]

const MUJER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]

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
    : "Colección Mujer — Theia"
  return {
    title,
    description: "Vestidos, blusas y camisetas con envío a todo México. Pago seguro con MercadoPago.",
  }
}

export default async function ColeccionPage({ searchParams }: { searchParams: SearchParams }) {
  const { categoria, q, talla, orden } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .neq("category", "Jerseys")

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

        <div className="flex flex-col gap-0 lg:flex-row lg:gap-10 lg:items-start">
          <Suspense fallback={<div className="hidden lg:block w-44 flex-shrink-0" />}>
            <FilterPanel categories={MUJER_CATEGORIES} sizes={MUJER_SIZES} />
          </Suspense>

          <div className="w-full lg:flex-1 lg:min-w-0">
            <ProductGrid products={(products ?? []) as Product[]} />
          </div>
        </div>
      </div>
    </div>
  )
}
