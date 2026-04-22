import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import ProductCard from "@/components/store/ProductCard"

export const revalidate = 60

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>
}): Promise<Metadata> {
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>
}) {
  const { categoria, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (categoria) query = query.eq("category", categoria)
  if (q) query = query.ilike("title", `%${q}%`)

  const { data: products } = await query

  const heading = q ? `"${q}"` : categoria ?? "Todos los productos"

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1
        className="text-3xl italic mb-1"
        style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
      >
        {heading}
      </h1>
      {(categoria || q) && (
        <p
          className="text-[10px] uppercase tracking-[0.25em] mb-8"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          {q ? "búsqueda" : "categoría"} · {(products ?? []).length} productos
        </p>
      )}
      {!categoria && !q && (
        <div className="mb-8" />
      )}

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p
          className="text-center py-16 text-sm"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          No hay productos disponibles
        </p>
      )}
    </div>
  )
}
