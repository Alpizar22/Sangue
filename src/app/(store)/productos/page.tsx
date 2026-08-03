import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import ProductGrid from "@/components/store/ProductGrid"
import { HERO } from "@/lib/editorial"

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

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">

        {/* Encabezado editorial */}
        <div className="max-w-xl mb-14">
          <p
            className="text-[11px] uppercase tracking-[0.16em] mb-4"
            style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
          >
            {categoria ? categoria : HERO.eyebrow}
          </p>
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            {categoria ? categoria : HERO.title}
          </h1>
          <p
            className="text-[14px] leading-relaxed"
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
          >
            Una selección de esenciales construidos alrededor de la forma, la materia
            y la permanencia.
          </p>
        </div>

        {/* Filtro por tipo de prenda */}
        {tipos.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-12" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <a
              href="/productos"
              className="py-3 text-[12px] uppercase tracking-[0.06em] transition-colors"
              style={{
                fontFamily: "var(--font-inter)",
                fontWeight: !categoria ? 600 : 400,
                color: !categoria ? "var(--ink)" : "var(--text-secondary)",
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
                  className="py-3 text-[12px] uppercase tracking-[0.06em] transition-colors"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--ink)" : "var(--text-secondary)",
                  }}
                >
                  {tipo}
                </a>
              )
            })}
          </div>
        )}

        {/* Grid o empty state */}
        {products && products.length > 0 ? (
          <ProductGrid products={products as Product[]} />
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-center gap-3">
            <p
              className="text-xl"
              style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
            >
              Nuevos diseños llegando pronto
            </p>
            <p
              className="text-[12px]"
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
            >
              Estamos preparando algo especial para ti
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
