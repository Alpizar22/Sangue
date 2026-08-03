import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import ProductGrid from "@/components/store/ProductGrid"

export const revalidate = 60

type SearchParams = Promise<{ categoria?: string; q?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { categoria } = await searchParams
  return { title: categoria ? `${categoria} — Theia` : "Colección — Theia" }
}

export default async function ProductosPage({ searchParams }: { searchParams: SearchParams }) {
  const { categoria, q } = await searchParams
  const supabase = await createClient()

  const [{ data: allActive }, query] = await Promise.all([
    supabase.from("products").select("subcategory").eq("status", "active"),
    (async () => {
      let q_ = supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (categoria) q_ = q_.ilike("subcategory", `%${categoria}%`)
      if (q)         q_ = q_.ilike("title", `%${q}%`)

      return q_
    })(),
  ])

  const { data: products } = await query

  // Tipos de prenda disponibles — se arman solos a partir del catálogo real,
  // así no hay que tocar código cada vez que se agregan nuevos diseños.
  const tipos = [...new Set((allActive ?? []).map((p) => p.subcategory).filter(Boolean))] as string[]

  const heading = categoria || "Colección Theia"

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Título + filtros por tipo de prenda */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 mb-8">
          <h1
            className="text-3xl italic"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            {heading}
          </h1>
          {tipos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <a
                href="/productos"
                className="px-3 py-1 text-[10px] uppercase tracking-[0.15em] transition-all"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  background: !categoria ? "var(--ink)" : "transparent",
                  color: !categoria ? "var(--bg)" : "var(--ink)",
                  border: "1px solid rgba(26,26,26,0.2)",
                  opacity: !categoria ? 1 : 0.55,
                }}
              >
                Todo
              </a>
              {tipos.map((tipo) => {
                const active = categoria === tipo
                return (
                  <a
                    key={tipo}
                    href={`/productos?categoria=${encodeURIComponent(tipo)}`}
                    className="px-3 py-1 text-[10px] uppercase tracking-[0.15em] transition-all"
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--bg)" : "var(--ink)",
                      border: "1px solid rgba(26,26,26,0.2)",
                      opacity: active ? 1 : 0.55,
                    }}
                  >
                    {tipo}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Grid o empty state */}
        {products && products.length > 0 ? (
          <ProductGrid products={products as Product[]} />
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-center gap-4">
            <span style={{ fontSize: "3rem" }}>🖤</span>
            <p
              className="text-xl italic"
              style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)", opacity: 0.7 }}
            >
              Nuevos diseños llegando pronto
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
            >
              Estamos preparando algo especial para ti
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
