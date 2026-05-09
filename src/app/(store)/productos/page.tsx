import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import ProductGrid from "@/components/store/ProductGrid"

export const revalidate = 60

const CATEGORIES = [
  { value: "",          label: "Todo" },
  { value: "mascotas",  label: "Mascotas 🐾" },
  { value: "gadgets",   label: "Gadgets ⚡" },
  { value: "aseo",      label: "Aseo 🧴" },
]

type SearchParams = Promise<{ categoria?: string; q?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { categoria } = await searchParams
  const label = CATEGORIES.find((c) => c.value === categoria)?.label ?? "Tienda"
  return { title: `${label} — Theia` }
}

export default async function ProductosPage({ searchParams }: { searchParams: SearchParams }) {
  const { categoria, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (categoria) query = query.ilike("category", `%${categoria}%`)
  if (q)         query = query.ilike("title", `%${q}%`)

  const { data: products } = await query

  const heading = CATEGORIES.find((c) => c.value === categoria)?.label ?? "Tienda"

  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Título + filtros por categoría */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 mb-8">
          <h1
            className="text-3xl italic"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            {heading}
          </h1>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = (categoria ?? "") === cat.value
              const href = cat.value ? `/productos?categoria=${cat.value}` : "/productos"
              return (
                <a
                  key={cat.value}
                  href={href}
                  className="px-3 py-1 text-[10px] uppercase tracking-[0.15em] transition-all"
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    background: active ? "var(--ink)" : "transparent",
                    color: active ? "var(--bg)" : "var(--ink)",
                    border: "1px solid rgba(26,26,26,0.2)",
                    opacity: active ? 1 : 0.55,
                  }}
                >
                  {cat.label}
                </a>
              )
            })}
          </div>
        </div>

        {/* Grid o empty state */}
        {products && products.length > 0 ? (
          <ProductGrid products={products as Product[]} />
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-center gap-4">
            <span style={{ fontSize: "3rem" }}>🐾</span>
            <p
              className="text-xl italic"
              style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)", opacity: 0.7 }}
            >
              Nuevos productos llegando pronto
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
