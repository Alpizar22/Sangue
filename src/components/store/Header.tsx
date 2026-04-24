"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart"

const COLECCION_MENU = [
  { href: "/coleccion", label: "Todas" },
  { href: "/coleccion?categoria=Lady+Dresses", label: "Vestidos" },
  { href: "/coleccion?categoria=Blouses+%26+Shirts", label: "Blusas" },
  { href: "/coleccion?categoria=Ladies+Short+Sleeve", label: "Camisetas" },
  { href: "/coleccion?orden=nuevos", label: "Nuevos ingresos" },
]

const JERSEYS_MENU = [
  { href: "/jerseys", label: "Todos los jerseys" },
]

type MenuKey = "coleccion" | "jerseys"

function NavDropdown({
  label,
  menuKey,
  items,
  open,
  onOpen,
  onClose,
}: {
  label: string
  menuKey: MenuKey
  items: { href: string; label: string }[]
  open: boolean
  onOpen: (k: MenuKey) => void
  onClose: () => void
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => onOpen(menuKey)}
      onMouseLeave={onClose}
    >
      <button
        className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-100 flex items-center gap-1"
        style={{
          fontFamily: "var(--font-space-mono)",
          color: "var(--ink)",
          opacity: open ? 1 : 0.5,
        }}
      >
        {label}
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none", opacity: 0.5, fontSize: "8px" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-0 min-w-[200px] py-2 z-50"
          style={{
            background: "var(--paper)",
            borderTop: "2px solid var(--ink)",
            boxShadow: "0 12px 32px rgba(26,26,26,0.12)",
          }}
          onMouseEnter={() => onOpen(menuKey)}
          onMouseLeave={onClose}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-all hover:pl-7"
              style={{
                fontFamily: "var(--font-space-mono)",
                color: "var(--ink)",
                opacity: 0.55,
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const itemCount = useCartStore((s) => s.itemCount())
  const [mounted, setMounted] = useState(false)
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setMounted(true), [])

  function openDropdown(menu: MenuKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(menu)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120)
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: "var(--paper)", borderBottom: "1px solid rgba(26,26,26,0.1)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Nav izquierda */}
        <nav className="flex items-center gap-7 min-w-[180px]">
          <NavDropdown
            label="Colección"
            menuKey="coleccion"
            items={COLECCION_MENU}
            open={openMenu === "coleccion"}
            onOpen={openDropdown}
            onClose={scheduleClose}
          />
          <div className="hidden sm:block">
            <NavDropdown
              label="Jerseys"
              menuKey="jerseys"
              items={JERSEYS_MENU}
              open={openMenu === "jerseys"}
              onOpen={openDropdown}
              onClose={scheduleClose}
            />
          </div>
        </nav>

        {/* Logo centrado */}
        <Link
          href="/"
          className="text-[28px] leading-none tracking-wide transition-opacity hover:opacity-70 absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: "var(--font-instrument)", fontStyle: "italic", color: "var(--ink)" }}
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
                style={{ background: "var(--accent-2)", fontFamily: "var(--font-space-mono)" }}
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
