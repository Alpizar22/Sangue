"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import Link from "next/link"
import { ShoppingBag, Search } from "lucide-react"
import { useCartStore } from "@/store/cart"

const SearchModal = lazy(() => import("./SearchModal"))

const NAV_LINKS = [
  { href: "/coleccion", label: "Colección" },
  { href: "/la-casa",   label: "La Casa"   },
  { href: "/filosofia", label: "Filosofía" },
]

export default function Header() {
  const itemCount = useCartStore((s) => s.itemCount())
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: "var(--paper)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Nav izquierda */}
        <nav className="flex items-center gap-6 min-w-[180px]">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.1em] transition-colors hidden sm:block"
              style={{
                fontFamily: "var(--font-inter)",
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              {link.label}
            </Link>
          ))}
          {/* Mobile: solo el primer link */}
          <Link
            href="/coleccion"
            className="text-[11px] uppercase tracking-[0.1em] sm:hidden"
            style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
          >
            Colección
          </Link>
        </nav>

        {/* Logo centrado — wordmark estable, no decorativo */}
        <Link
          href="/"
          className="text-[22px] leading-none tracking-wide transition-opacity hover:opacity-80 absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Theia
        </Link>

        {/* Iconos derecha */}
        <div className="flex items-center justify-end gap-4 min-w-[120px]">
          <button
            onClick={() => setSearchOpen(true)}
            className="transition-opacity hover:opacity-70"
            style={{ color: "var(--ink)" }}
            aria-label="Buscar"
          >
            <Search size={17} strokeWidth={1.5} />
          </button>
          <Link
            href="/carrito"
            className="relative transition-opacity hover:opacity-70"
            style={{ color: "var(--ink)" }}
            aria-label="Bolsa"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {mounted && itemCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center"
                style={{ background: "var(--accent-2)", fontFamily: "var(--font-inter)", fontWeight: 600 }}
              >
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
        </div>

      </div>

      {searchOpen && (
        <Suspense fallback={null}>
          <SearchModal onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>
  )
}
