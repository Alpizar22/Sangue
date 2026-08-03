import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Jerseys — Theia" }
export const dynamic = "force-static"

export default function JerseysPage() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28"
      style={{ background: "var(--bg)", minHeight: "60vh" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.14em] mb-4"
        style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
      >
        Próximamente
      </p>
      <h1
        className="text-5xl leading-none mb-6"
        style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
      >
        Jerseys
      </h1>
      <p
        className="text-[13px] mb-10 max-w-xs leading-relaxed"
        style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
      >
        Estamos preparando nuestra línea de jerseys con diseño propio.
      </p>
      <Link
        href="/coleccion"
        className="inline-block px-8 py-3 text-xs uppercase tracking-[0.12em] transition-opacity hover:opacity-75"
        style={{ fontFamily: "var(--font-inter)", background: "var(--ink)", color: "var(--bg)" }}
      >
        Ver colección
      </Link>
    </div>
  )
}
