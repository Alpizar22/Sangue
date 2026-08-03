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
      <h1
        className="text-5xl italic leading-none mb-4"
        style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
      >
        Jerseys
      </h1>
      <p
        className="text-base mb-8"
        style={{ fontFamily: "var(--font-caveat)", color: "var(--pink)", fontSize: "1.3rem" }}
      >
        Próximamente
      </p>
      <p
        className="text-[10px] uppercase tracking-[0.25em] mb-10 max-w-xs"
        style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
      >
        Estamos preparando nuestra línea de jerseys con diseño propio
      </p>
      <Link
        href="/coleccion"
        className="inline-block px-8 py-3 text-xs uppercase tracking-[0.2em] transition-all hover:opacity-80"
        style={{ fontFamily: "var(--font-space-mono)", background: "var(--ink)", color: "var(--bg)" }}
      >
        Ver colección
      </Link>
    </div>
  )
}
