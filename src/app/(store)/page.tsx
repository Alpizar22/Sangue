import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"
import ProductGrid from "@/components/store/ProductGrid"

export const revalidate = 120

export default async function HomePage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8)

  const heroImage = products?.[0]?.images?.[0] ?? null

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-28"
        style={{ background: "var(--bg)" }}
      >
        <h1
          className="text-6xl md:text-8xl italic leading-none mb-4"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Theia
        </h1>
        <p
          className="text-base mb-2"
          style={{ fontFamily: "var(--font-caveat)", color: "var(--pink)", fontSize: "1.3rem" }}
        >
          moda que habla por ti
        </p>
        <p
          className="text-xs uppercase tracking-[0.3em] mb-10 max-w-xs"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.45 }}
        >
          diseños propios · envíos a todo México
        </p>
        <Link
          href="/coleccion"
          className="inline-block px-8 py-3 text-xs uppercase tracking-[0.2em] transition-all hover:opacity-80"
          style={{ fontFamily: "var(--font-space-mono)", background: "var(--ink)", color: "var(--bg)" }}
        >
          Ver colección
        </Link>
      </section>

      <div style={{ height: "1px", background: "rgba(26,26,26,0.1)" }} />

      {/* ── CARD COLECCIÓN ───────────────────────────────────────── */}
      <section>
        <Link
          href="/coleccion"
          className="group relative overflow-hidden flex flex-col justify-end"
          style={{ minHeight: "440px", display: "block" }}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt="Colección Theia"
              loading="eager"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "var(--paper)" }} />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(26,26,26,0.7) 0%, transparent 60%)" }}
          />
          <div className="relative z-10 p-8 md:p-12">
            <p
              className="text-sm mb-1"
              style={{ fontFamily: "var(--font-caveat)", color: "var(--accent-2)", fontSize: "1.1rem" }}
            >
              diseño propio
            </p>
            <p
              className="text-3xl md:text-4xl italic mb-2"
              style={{ fontFamily: "var(--font-instrument)", color: "var(--bg)" }}
            >
              Colección Theia
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--bg)", opacity: 0.75 }}
            >
              Explorar →
            </p>
          </div>
        </Link>
      </section>

      <div style={{ height: "1px", background: "rgba(26,26,26,0.1)" }} />

      {/* ── NUEVOS INGRESOS ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 py-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2
            className="text-2xl italic"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            Nuevos ingresos
          </h2>
          <Link
            href="/coleccion"
            className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.45 }}
          >
            Ver todo →
          </Link>
        </div>

        {products && products.length > 0 ? (
          <ProductGrid products={products as Product[]} />
        ) : (
          <p
            className="text-center py-16 text-sm"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
          >
            Nuevos diseños llegando pronto
          </p>
        )}
      </section>

    </div>
  )
}
