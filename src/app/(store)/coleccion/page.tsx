import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import Link from "next/link"
import FilterPanel, { type CategoryOption } from "@/components/store/FilterPanel"
import ProductGrid from "@/components/store/ProductGrid"

export const revalidate = 60

const PAGE_SIZE = 60

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
  pagina?: string
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
  const { categoria, q, talla, orden, pagina } = await searchParams
  const page = Math.max(1, parseInt(pagina ?? "1", 10) || 1)
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
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

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data: products, count } = await query.range(from, to)

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const heading = q ? `"${q}"` : categoria ?? "Colección"

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (categoria) params.set("categoria", categoria)
    if (q) params.set("q", q)
    if (talla) params.set("talla", talla)
    if (orden) params.set("orden", orden)
    if (p > 1) params.set("pagina", String(p))
    const s = params.toString()
    return `/coleccion${s ? `?${s}` : ""}`
  }

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
              {totalCount} {totalCount === 1 ? "producto" : "productos"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-0 lg:flex-row lg:gap-10 lg:items-start">
          <Suspense fallback={<div className="hidden lg:block w-44 flex-shrink-0" />}>
            <FilterPanel categories={MUJER_CATEGORIES} sizes={MUJER_SIZES} />
          </Suspense>

          <div className="w-full lg:flex-1 lg:min-w-0">
            <ProductGrid products={(products ?? []) as Product[]} />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                {page > 1 && (
                  <Link
                    href={buildUrl(page - 1)}
                    className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                    style={{ fontFamily: "var(--font-space-mono)", border: "1px solid rgba(26,26,26,0.2)", color: "var(--ink)" }}
                  >
                    ← Anterior
                  </Link>
                )}
                <span
                  className="text-[11px]"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
                >
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildUrl(page + 1)}
                    className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                    style={{ fontFamily: "var(--font-space-mono)", border: "1px solid rgba(26,26,26,0.2)", color: "var(--ink)" }}
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
