"use client"

import { useState, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export type CategoryOption = { value: string; label: string }

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: "", label: "Todos" },
  { value: "Lady Dresses", label: "Vestidos" },
  { value: "Blouses & Shirts", label: "Blusas" },
  { value: "Ladies Short Sleeve", label: "Camisetas" },
  { value: "Jerseys", label: "Jerseys" },
]

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]

const SORT_OPTIONS = [
  { value: "nuevos", label: "Más nuevos" },
  { value: "precio_asc", label: "Precio: menor → mayor" },
  { value: "precio_desc", label: "Precio: mayor → menor" },
]

function filterCount(cat: string, talla: string, orden: string): number {
  return [cat, talla, orden !== "nuevos" ? orden : ""].filter(Boolean).length
}

function FilterContent({
  onClose,
  categories,
  sizes,
}: {
  onClose?: () => void
  categories: CategoryOption[]
  sizes: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCat = searchParams.get("categoria") ?? ""
  const currentTalla = searchParams.get("talla") ?? ""
  const currentOrden = searchParams.get("orden") ?? "nuevos"
  const hasFilters = !!(currentCat || currentTalla || (currentOrden && currentOrden !== "nuevos"))

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      onClose?.()
    },
    [router, pathname, searchParams, onClose]
  )

  function clearAll() {
    router.replace(pathname, { scroll: false })
    onClose?.()
  }

  return (
    <div className="space-y-7">

      {/* Categoría */}
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.25em] mb-3"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Categoría
        </p>
        <div className="space-y-1">
          {categories.map(({ value, label }) => {
            const active = currentCat === value
            return (
              <button
                key={value}
                onClick={() => updateParam("categoria", value)}
                className="block w-full text-left text-[11px] px-2.5 py-1.5 transition-all duration-150"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  border: `1px solid ${active ? "var(--ink)" : "transparent"}`,
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink)",
                  opacity: active ? 1 : 0.5,
                  borderRadius: "2px",
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

      {/* Talla */}
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.25em] mb-3"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Talla
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((size) => {
            const selected = currentTalla === size
            return (
              <button
                key={size}
                onClick={() => updateParam("talla", selected ? "" : size)}
                className="px-2.5 py-1 text-[10px] uppercase transition-all duration-150"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  border: `1px solid ${selected ? "var(--ink)" : "rgba(26,26,26,0.18)"}`,
                  background: selected ? "var(--ink)" : "transparent",
                  color: selected ? "var(--bg)" : "var(--ink)",
                  opacity: selected ? 1 : 0.6,
                  borderRadius: "2px",
                  transform: selected ? "scale(1.03)" : "scale(1)",
                }}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

      {/* Ordenar */}
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.25em] mb-3"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Ordenar
        </p>
        <div className="space-y-1">
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = currentOrden === value
            return (
              <button
                key={value}
                onClick={() => updateParam("orden", value)}
                className="block w-full text-left text-[11px] px-2.5 py-1.5 transition-all duration-150"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  border: `1px solid ${active ? "var(--ink)" : "transparent"}`,
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--bg)" : "var(--ink)",
                  opacity: active ? 1 : 0.5,
                  borderRadius: "2px",
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {hasFilters && (
        <>
          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />
          <button
            onClick={clearAll}
            className="text-[10px] uppercase tracking-[0.15em] transition-all duration-150 hover:opacity-80"
            style={{
              fontFamily: "var(--font-space-mono)",
              color: "var(--ink)",
              opacity: 0.45,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Limpiar filtros
          </button>
        </>
      )}
    </div>
  )
}

export default function FilterPanel({
  categories = DEFAULT_CATEGORIES,
  sizes = DEFAULT_SIZES,
}: {
  categories?: CategoryOption[]
  sizes?: string[]
} = {}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentCat = searchParams.get("categoria") ?? ""
  const currentTalla = searchParams.get("talla") ?? ""
  const currentOrden = searchParams.get("orden") ?? "nuevos"
  const activeCount = filterCount(currentCat, currentTalla, currentOrden)
  const hasFilters = activeCount > 0

  return (
    <>
      {/* ── Desktop sidebar (lg+) ─────────────────────── */}
      <aside className="hidden lg:block w-44 flex-shrink-0 pt-1">
        <FilterContent categories={categories} sizes={sizes} />
      </aside>

      {/* ── Mobile top bar ─────────────────────────────── */}
      <div className="lg:hidden w-full flex items-center justify-between mb-5">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] px-4 py-2 transition-all duration-150"
          style={{
            fontFamily: "var(--font-space-mono)",
            color: hasFilters ? "var(--bg)" : "var(--ink)",
            background: hasFilters ? "var(--ink)" : "transparent",
            border: `1px solid ${hasFilters ? "var(--ink)" : "rgba(26,26,26,0.2)"}`,
          }}
        >
          Filtros
          {activeCount > 0 && (
            <span
              className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--bg)",
                color: "var(--ink)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {activeCount}
            </span>
          )}
        </button>

        <select
          value={currentOrden}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("orden", e.target.value)
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
          }}
          className="text-[10px] uppercase tracking-[0.1em] px-3 py-2 bg-transparent focus:outline-none"
          style={{
            fontFamily: "var(--font-space-mono)",
            color: "var(--ink)",
            border: "1px solid rgba(26,26,26,0.2)",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Mobile drawer ─────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden overflow-y-auto p-6"
            style={{ background: "var(--paper)" }}
          >
            <div className="flex items-center justify-between mb-7">
              <p
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
              >
                Filtros
                {activeCount > 0 && (
                  <span
                    className="ml-2 inline-flex w-4 h-4 rounded-full text-[9px] items-center justify-center"
                    style={{ background: "var(--ink)", color: "var(--bg)", fontFamily: "var(--font-space-mono)" }}
                  >
                    {activeCount}
                  </span>
                )}
              </p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-xl leading-none transition-opacity hover:opacity-60"
                style={{ color: "var(--ink)", opacity: 0.4 }}
              >
                ×
              </button>
            </div>

            <FilterContent categories={categories} sizes={sizes} onClose={() => setDrawerOpen(false)} />

            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-8 w-full py-3.5 text-[10px] uppercase tracking-[0.2em]"
              style={{
                fontFamily: "var(--font-space-mono)",
                background: "var(--ink)",
                color: "var(--bg)",
              }}
            >
              Ver resultados
            </button>
          </div>
        </>
      )}
    </>
  )
}
