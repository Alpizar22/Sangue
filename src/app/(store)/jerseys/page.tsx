import Link from "next/link"
import type { Metadata } from "next"
import Header from "@/components/store/Header"
import Footer from "@/components/store/Footer"

export const metadata: Metadata = {
  title: "Jerseys — Theia",
  description: "Jerseys de fútbol — Próximamente en Theia.",
}

export default function JerseysPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p
          className="text-[10px] uppercase tracking-[0.35em] mb-6"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          próximamente
        </p>
        <h1
          className="text-5xl md:text-7xl italic mb-5"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Jerseys de Fútbol
        </h1>
        <p
          className="text-[12px] leading-relaxed mb-12 max-w-xs"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.45 }}
        >
          Estamos preparando nuestra colección.
          <br />
          Vuelve pronto.
        </p>
        <Link
          href="/coleccion"
          className="inline-block px-8 py-3 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
          style={{ fontFamily: "var(--font-space-mono)", background: "var(--ink)", color: "var(--bg)" }}
        >
          Ver Colección Mujer
        </Link>
      </main>
      <Footer />
    </div>
  )
}
