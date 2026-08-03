"use client"

import { lazy, Suspense, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { Menu, Search, ShoppingBag, X } from "lucide-react"
import { useCartStore } from "@/store/cart"
import styles from "./Header.module.css"

const SearchModal = lazy(() => import("./SearchModal"))

const NAV_LINKS = [
  { href: "/coleccion", label: "Colección" },
  { href: "/la-casa", label: "La Casa" },
  { href: "/filosofia", label: "Filosofía" },
]

function subscribeToHydration(callback: () => void) {
  const unsubscribeHydrate = useCartStore.persist.onHydrate(callback)
  const unsubscribeFinish = useCartStore.persist.onFinishHydration(callback)
  return () => {
    unsubscribeHydrate()
    unsubscribeFinish()
  }
}

function getHydrationSnapshot() {
  return useCartStore.persist.hasHydrated()
}

function getServerHydrationSnapshot() {
  return false
}

export default function Header() {
  const itemCount = useCartStore((state) => state.itemCount())
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <nav className={styles.desktopNav} aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? <X size={19} strokeWidth={1.35} /> : <Menu size={20} strokeWidth={1.35} />}
          <span>Menú</span>
        </button>

        <Link href="/" className={styles.wordmark} onClick={closeMenu} aria-label="Theia, inicio">
          Theia
        </Link>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => {
              closeMenu()
              setSearchOpen(true)
            }}
            className={styles.searchButton}
            aria-label="Buscar"
          >
            <span>Buscar</span>
            <Search size={17} strokeWidth={1.35} />
          </button>
          <Link href="/carrito" className={styles.bagLink} onClick={closeMenu} aria-label="Bolsa">
            <ShoppingBag size={18} strokeWidth={1.35} />
            {hasHydrated && itemCount > 0 && (
              <span className={styles.cartCount} aria-label={`${itemCount} artículos en la bolsa`}>
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav
        id="mobile-navigation"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
        aria-label="Navegación móvil"
        aria-hidden={!menuOpen}
      >
        <div className={styles.mobileNavInner}>
          {NAV_LINKS.map((link, index) => (
            <Link key={link.href} href={link.href} onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>
              <span aria-hidden="true">0{index + 1}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {searchOpen && (
        <Suspense fallback={null}>
          <SearchModal onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>
  )
}
