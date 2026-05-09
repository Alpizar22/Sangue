import Link from "next/link"

export const dynamic = "force-static"
export const revalidate = false

const CATEGORIES = [
  {
    slug: "mascotas",
    label: "Mascotas",
    icon: "🐾",
    desc: "Accesorios y juguetes para tu mejor amigo",
    href: "/productos?categoria=mascotas",
  },
  {
    slug: "gadgets",
    label: "Gadgets",
    icon: "⚡",
    desc: "Tecnología práctica para el día a día",
    href: "/productos?categoria=gadgets",
  },
  {
    slug: "aseo",
    label: "Aseo",
    icon: "🧴",
    desc: "Cuidado personal y hogar",
    href: "/productos?categoria=aseo",
  },
]

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg, #f5f0e8)" }}
    >
      {/* ── HERO ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1
          className="italic leading-none mb-4"
          style={{
            fontFamily: "var(--font-instrument, Georgia, serif)",
            fontSize: "clamp(4rem, 14vw, 9rem)",
            fontWeight: 400,
            color: "var(--ink, #1a1a1a)",
            letterSpacing: "-0.01em",
          }}
        >
          Theia
        </h1>

        <p
          style={{
            fontFamily: "var(--font-instrument, Georgia, serif)",
            fontSize: "clamp(1.2rem, 3vw, 2rem)",
            fontStyle: "italic",
            color: "var(--ink, #1a1a1a)",
            opacity: 0.75,
            marginBottom: "0.5rem",
          }}
        >
          Todo lo que necesitas, en tu puerta
        </p>

        <p
          style={{
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--ink, #1a1a1a)",
            opacity: 0.4,
            marginBottom: "3rem",
          }}
        >
          envíos a todo México · pago seguro
        </p>

        {/* ── CATEGORY CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex flex-col items-center py-8 px-6 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-md"
              style={{
                background: "rgba(26,26,26,0.04)",
                border: "1px solid rgba(26,26,26,0.08)",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                {cat.icon}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-instrument, Georgia, serif)",
                  fontSize: "1.25rem",
                  fontStyle: "italic",
                  color: "var(--ink, #1a1a1a)",
                  marginBottom: "0.35rem",
                }}
              >
                {cat.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-space-mono, monospace)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink, #1a1a1a)",
                  opacity: 0.45,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                {cat.desc}
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/productos"
          className="mt-10 inline-block px-8 py-3 text-xs uppercase tracking-[0.2em] transition-all hover:opacity-80"
          style={{
            fontFamily: "var(--font-space-mono, monospace)",
            background: "var(--ink, #1a1a1a)",
            color: "var(--bg, #f5f0e8)",
          }}
        >
          Ver todo →
        </Link>
      </main>
    </div>
  )
}
