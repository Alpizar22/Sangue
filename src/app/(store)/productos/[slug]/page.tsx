import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import Link from "next/link"
import ProductInteractive from "@/components/store/ProductInteractive"
import ProductCard from "@/components/store/ProductCard"
import { getDisplayName } from "@/lib/presentation"

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("title, description, images, display_name")
    .eq("id", slug)
    .single()

  if (!data) return { title: "Producto no encontrado" }

  const name = getDisplayName(data as Pick<Product, "display_name" | "title">)

  return {
    title: `${name} — Theia`,
    description:
      data.description?.slice(0, 155) ??
      `${name} — disponible en Theia con envío a todo México.`,
    openGraph: {
      title: name,
      description:
        data.description?.slice(0, 155) ??
        `${name} — disponible en Theia con envío a todo México.`,
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

  const displayName = getDisplayName(product as Product)

  // Productos relacionados: mismo tipo de prenda (subcategory), excluye el actual
  let relatedQuery = supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(8)

  relatedQuery = product.subcategory
    ? relatedQuery.eq("subcategory", product.subcategory)
    : relatedQuery

  const { data: related } = await relatedQuery

  const relatedProducts: Product[] = (related ?? [])
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)

  return (
    <div style={{ background: "var(--bg)" }}>

      {/* ── PRODUCT SECTION ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

        {/* Breadcrumb */}
        <nav
          className="text-[11px] uppercase tracking-[0.06em] mb-8 flex items-center gap-2"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
        >
          <Link href="/coleccion" className="hover:text-[var(--ink)] transition-colors">
            Colección
          </Link>
          <span>/</span>
          <span className="truncate max-w-[220px]" style={{ color: "var(--ink)" }}>
            {displayName}
          </span>
        </nav>

        {/* Interactive 2-col section (client component — owns gallery + cart state) */}
        <ProductInteractive product={product} />

      </div>

      {/* ── RELATED PRODUCTS ──────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section
          className="mt-8 md:mt-16"
          style={{ borderTop: "1px solid var(--border)", background: "var(--paper)" }}
        >
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <div className="flex items-baseline justify-between mb-8">
              <h2
                className="text-2xl"
                style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
              >
                También te puede gustar
              </h2>
              <Link
                href="/coleccion"
                className="text-[11px] uppercase tracking-[0.06em] transition-colors hover:text-[var(--ink)]"
                style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
              >
                Ver todo →
              </Link>
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
