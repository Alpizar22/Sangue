import Link from "next/link"
import Image from "next/image"
import { createAdminClient } from "@/lib/supabase/server"
import Header from "@/components/store/Header"
import Footer from "@/components/store/Footer"
import ProductCard from "@/components/store/ProductCard"
import type { Product } from "@/types"

export const revalidate = 120

export default async function HomePage() {
  const supabase = await createAdminClient()

  const [{ data: dressRow }, { data: newProducts }] = await Promise.all([
    supabase
      .from("products")
      .select("images")
      .eq("status", "active")
      .neq("category", "Jerseys")
      .not("images", "eq", "{}")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .neq("category", "Jerseys")
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  const dressImage = dressRow?.images?.[0] ?? null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Header />

      <main className="flex-1 flex flex-col">

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
            Viste como te mereces
          </p>
          <p
            className="text-xs uppercase tracking-[0.3em] mb-10 max-w-xs"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.45 }}
          >
            moda · envíos a todo México
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
            style={{ minHeight: "520px", display: "block" }}
          >
            {dressImage ? (
              <Image
                src={dressImage}
                alt="Colección Mujer"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="100vw"
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
                nueva temporada
              </p>
              <h2
                className="text-5xl md:text-6xl italic leading-tight mb-3"
                style={{ fontFamily: "var(--font-instrument)", color: "#f4f1ec" }}
              >
                Colección Mujer
              </h2>
              <span
                className="inline-block text-[10px] uppercase tracking-[0.2em] border-b pb-0.5 transition-opacity group-hover:opacity-100"
                style={{ fontFamily: "var(--font-space-mono)", color: "#f4f1ec", opacity: 0.75, borderColor: "#f4f1ec" }}
              >
                Ver vestidos y tops →
              </span>
            </div>
          </Link>

          {/* Jerseys — próximamente (nota discreta) */}
          <div
            className="flex items-center justify-center py-3 gap-3"
            style={{ borderTop: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
          >
            <span
              className="text-[9px] uppercase tracking-[0.25em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.3 }}
            >
              Jerseys de Fútbol — Próximamente
            </span>
          </div>
        </section>

        {/* ── NUEVOS INGRESOS ──────────────────────────────────────────── */}
        {newProducts && newProducts.length > 0 && (
          <section
            style={{ borderTop: "1px solid rgba(26,26,26,0.08)", background: "var(--bg)" }}
          >
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
              <div className="flex items-baseline justify-between mb-8">
                <h2
                  className="text-2xl italic"
                  style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
                >
                  Nuevos ingresos
                </h2>
                <Link
                  href="/coleccion?orden=nuevos"
                  className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
                >
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(newProducts as Product[]).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TAGLINE ──────────────────────────────────────────────────── */}
        <div
          className="text-center py-14 px-6"
          style={{ borderTop: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
        >
          <p
            className="text-2xl"
            style={{ fontFamily: "var(--font-caveat)", color: "var(--ink)", opacity: 0.5, fontSize: "1.5rem" }}
          >
            envíos a todo México · pago seguro con MercadoPago
          </p>
        </div>

      </main>

      <Footer />
    </div>
  )
}
