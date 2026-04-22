import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"
import ProductCard from "@/components/store/ProductCard"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-12 text-center py-16">
        <h1 className="text-5xl font-bold tracking-tight mb-4">THEIA</h1>
        <p className="text-lg text-gray-500">Moda que habla por vos</p>
      </section>

      {/* Productos destacados */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Novedades</h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-16">
            Próximamente nuevos productos
          </p>
        )}
      </section>
    </div>
  )
}
