import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import Link from "next/link"
import ProductInteractive from "@/components/store/ProductInteractive"
import ProductCard from "@/components/store/ProductCard"

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("title, description, images")
    .eq("id", slug)
    .single()

  if (!data) return { title: "Producto no encontrado" }

  return {
    title: `${data.title} — Theia`,
    description:
      data.description?.slice(0, 155) ??
      `${data.title} — disponible en Theia con envío a todo México.`,
    openGraph: {
      title: data.title,
      description:
        data.description?.slice(0, 155) ??
        `${data.title} — disponible en Theia con envío a todo México.`,
      images: data.images?.[0] ? [{ url: data.images[0] }] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", slug)
    .eq("status", "active")
    .single()

  if (!product) notFound()

  // Related products: same category, exclude current, random 4 from latest 8
  const { data: related } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("category", product.category)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(8)

  const relatedProducts: Product[] = (related ?? [])
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)

  return (
    <div style={{ background: "var(--bg)" }}>

      {/* ── PRODUCT SECTION ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

        {/* Breadcrumb */}
        <nav
          className="text-[10px] uppercase tracking-[0.2em] mb-8 flex items-center gap-2"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
        >
          <Link href="/productos" className="hover:opacity-100 transition-opacity">
            Colección
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/productos?categoria=${encodeURIComponent(product.category)}`}
                className="hover:opacity-100 transition-opacity"
              >
                {product.category}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="truncate max-w-[180px]" style={{ opacity: 0.7, color: "var(--ink)" }}>
            {product.title}
          </span>
        </nav>

        {/* Interactive 2-col section (client component — owns gallery + cart state) */}
        <ProductInteractive product={product} />

      </div>

      {/* ── RELATED PRODUCTS ──────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section
          className="mt-8 md:mt-16"
          style={{ borderTop: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
        >
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <div className="flex items-baseline justify-between mb-8">
              <h2
                className="text-2xl italic"
                style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
              >
                También te puede gustar
              </h2>
              {product.category && (
                <Link
                  href={`/productos?categoria=${encodeURIComponent(product.category)}`}
                  className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
                >
                  Ver todo →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
