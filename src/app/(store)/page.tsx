import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"
import { getDisplayName, getDisplayImages } from "@/lib/presentation"
import { HERO, INTRO, MANIFESTO, MATERIALS } from "@/lib/editorial"
import NewsletterForm from "@/components/store/NewsletterForm"
import { Eyebrow, Divider } from "@/components/store/Editorial"

export const revalidate = 120

const FEATURED_LIMIT = 4

export default async function HomePage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(FEATURED_LIMIT)

  const featured = (products ?? []) as Product[]

  return (
    <div className="flex flex-col">

      {/* ── HERO — tipográfico si HERO.image es null, editorial si no ── */}
      {HERO.image ? (
        <section className="relative" style={{ minHeight: "72vh" }}>
          <img
            src={HERO.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "rgba(26,26,26,0.32)" }} />
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 h-full" style={{ minHeight: "72vh" }}>
            <HeroCopy dark />
          </div>
        </section>
      ) : (
        <section
          className="flex flex-col items-center justify-center text-center px-6"
          style={{ background: "var(--bg)", minHeight: "72vh" }}
        >
          <HeroCopy />
        </section>
      )}

      <Divider />

      {/* ── INTRODUCCIÓN ─────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto w-full px-6 py-20 text-center">
        <Eyebrow>{INTRO.eyebrow}</Eyebrow>
        <p
          className="text-[15px] md:text-base leading-relaxed mt-4"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
        >
          {INTRO.text}
        </p>
      </section>

      <Divider />

      {/* ── SELECCIÓN LIMITADA ───────────────────────────────────── */}
      {featured.length > 0 && (
        <>
          <section className="max-w-6xl mx-auto w-full px-6 py-20">
            <div className="flex items-baseline justify-between mb-10">
              <h2
                className="text-2xl md:text-3xl"
                style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
              >
                Selección actual
              </h2>
              <Link
                href="/coleccion"
                className="text-[11px] uppercase tracking-[0.1em] transition-opacity hover:opacity-60"
                style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
              >
                Ver colección →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
              {featured.map((product) => {
                const images = getDisplayImages(product)
                return (
                  <Link key={product.id} href={`/productos/${product.id}`} className="group block">
                    <div className="relative overflow-hidden aspect-[3/4]" style={{ background: "var(--paper)" }}>
                      {images[0] && (
                        <img
                          src={images[0]}
                          alt={getDisplayName(product)}
                          loading="lazy"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                        />
                      )}
                    </div>
                    <p
                      className="text-[14px] mt-3"
                      style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
                    >
                      {getDisplayName(product)}
                    </p>
                    <p
                      className="text-[13px] mt-0.5"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
                    >
                      ${Number(product.sale_price).toLocaleString("es-MX")} MXN
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
          <Divider />
        </>
      )}

      {/* ── MANIFIESTO ────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto w-full px-6 py-20 text-center">
        <Eyebrow>{MANIFESTO.eyebrow}</Eyebrow>
        <div className="mt-6 space-y-3">
          {MANIFESTO.lines.map((line, i) => (
            <p
              key={i}
              className="text-lg md:text-xl leading-snug"
              style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
            >
              {line}
            </p>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── MATERIA / FILOSOFÍA ──────────────────────────────────── */}
      <section className="max-w-2xl mx-auto w-full px-6 py-20 text-center">
        <Eyebrow>{MATERIALS.eyebrow}</Eyebrow>
        <p
          className="text-[15px] leading-relaxed mt-4"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
        >
          {MATERIALS.text}
        </p>
      </section>

      <Divider />

      {/* ── NEWSLETTER DISCRETO ──────────────────────────────────── */}
      <section className="max-w-2xl mx-auto w-full px-6 py-16 flex flex-col items-center text-center gap-4">
        <p
          className="text-[13px]"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
        >
          Piezas nuevas, sin ruido.
        </p>
        <NewsletterForm />
      </section>

    </div>
  )
}

function HeroCopy({ dark = false }: { dark?: boolean }) {
  const secondary = dark ? "rgba(244,241,235,0.8)" : "var(--text-secondary)"
  const ink = dark ? "var(--bg)" : "var(--ink)"
  return (
    <>
      <p
        className="text-[11px] uppercase tracking-[0.16em] mb-5"
        style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: secondary }}
      >
        {HERO.eyebrow}
      </p>
      <h1
        className="text-6xl md:text-8xl leading-none mb-6"
        style={{ fontFamily: "var(--font-instrument)", color: ink }}
      >
        {HERO.title}
      </h1>
      <p
        className="text-base md:text-lg mb-10 max-w-sm"
        style={{ fontFamily: "var(--font-inter)", color: secondary }}
      >
        {HERO.text}
      </p>
      <Link
        href={HERO.ctaHref}
        className="inline-block px-8 py-3 text-[11px] uppercase tracking-[0.12em] transition-opacity hover:opacity-80"
        style={{
          fontFamily: "var(--font-inter)",
          fontWeight: 500,
          background: dark ? "var(--bg)" : "var(--ink)",
          color: dark ? "var(--ink)" : "var(--bg)",
        }}
      >
        {HERO.cta}
      </Link>
    </>
  )
}
