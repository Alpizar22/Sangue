"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart"

export default function Header() {
  const itemCount = useCartStore((s) => s.itemCount())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "var(--paper)",
        borderBottom: "1px solid rgba(26,26,26,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Nav izquierda */}
        <nav className="flex items-center gap-7 min-w-[120px]">
          <Link
            href="/productos?categoria=Lady+Dresses"
            className="text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-100"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
          >
            Colección
          </Link>
          <Link
            href="/productos?categoria=Jerseys"
            className="hidden sm:block text-[10px] uppercase tracking-[0.2em] transition-colors hover:opacity-100"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
          >
            Jerseys
          </Link>
        </nav>

        {/* Logo centrado */}
        <Link
          href="/"
          className="text-[28px] leading-none tracking-wide transition-opacity hover:opacity-70"
          style={{
            fontFamily: "var(--font-instrument)",
            fontStyle: "italic",
            color: "var(--ink)",
          }}
        >
          Theia
        </Link>

        {/* Carrito derecha */}
        <div className="flex items-center justify-end min-w-[120px]">
          <Link
            href="/carrito"
            className="relative transition-opacity hover:opacity-70"
            style={{ color: "var(--ink)" }}
          >
            <ShoppingBag size={19} strokeWidth={1.5} />
            {mounted && itemCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                style={{
                  background: "var(--accent-2)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  )
}
