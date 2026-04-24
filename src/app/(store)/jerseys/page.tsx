import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import FilterPanel, { type CategoryOption } from "@/components/store/FilterPanel"
import ProductGrid from "@/components/store/ProductGrid"

export const revalidate = 60

const JERSEY_CATEGORIES: CategoryOption[] = [
  { value: "", label: "Todos" },
  { value: "Jerseys", label: "Jerseys" },
]

const JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]

type SearchParams = Promise<{
  talla?: string
  orden?: string
}>

export const metadata: Metadata = {
  title: "Jerseys — Theia",
  description: "Jerseys de fútbol con envío a todo México. Pago seguro con MercadoPago.",
}

export default async function JerseysPage({ searchParams }: { searchParams: SearchParams }) {
  const { talla, orden } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("category", "Jerseys")

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

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1
              className="text-3xl italic"
              style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
            >
              Jerseys
            </h1>
            <p
              className="text-[10px] uppercase tracking-[0.2em] mt-1"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
            >
              {count} {count === 1 ? "jersey" : "jerseys"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-0 lg:flex-row lg:gap-10 lg:items-start">
          <Suspense fallback={<div className="hidden lg:block w-44 flex-shrink-0" />}>
            <FilterPanel categories={JERSEY_CATEGORIES} sizes={JERSEY_SIZES} />
          </Suspense>

          <div className="w-full lg:flex-1 lg:min-w-0">
            <ProductGrid products={(products ?? []) as Product[]} />
          </div>
        </div>
      </div>
    </div>
  )
}
