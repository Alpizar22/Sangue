"use client"

import { useState, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "Lady Dresses", label: "Vestidos" },
  { value: "Blouses & Shirts", label: "Blusas" },
  { value: "Ladies Short Sleeve", label: "Camisetas" },
  { value: "Jerseys", label: "Jerseys" },
]

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]

const SORT_OPTIONS = [
  { value: "nuevos", label: "Más nuevos" },
  { value: "precio_asc", label: "Precio: menor → mayor" },
  { value: "precio_desc", label: "Precio: mayor → menor" },
]

function FilterContent({
  onClose,
}: {
  onClose?: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCat = searchParams.get("categoria") ?? ""
  const currentTalla = searchParams.get("talla") ?? ""
  const currentOrden = searchParams.get("orden") ?? "nuevos"

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

  const hasFilters = !!(currentCat || currentTalla || (currentOrden && currentOrden !== "nuevos"))

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
        <div className="space-y-1.5">
          {CATEGORIES.map(({ value, label }) => {
            const active = currentCat === value
            return (
              <button
                key={value}
                onClick={() => updateParam("categoria", value)}
                className="block w-full text-left text-[11px] py-0.5 transition-opacity hover:opacity-100"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  color: "var(--ink)",
                  opacity: active ? 1 : 0.45,
                  fontWeight: active ? "600" : "400",
                }}
              >
                {active && <span className="mr-1.5 text-[9px]">—</span>}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Divisor */}
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
          {SIZES.map((size) => {
            const selected = currentTalla === size
            return (
              <button
                key={size}
                onClick={() => updateParam("talla", selected ? "" : size)}
                className="px-2.5 py-1 text-[10px] uppercase transition-all"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  border: `1px solid ${selected ? "var(--ink)" : "rgba(26,26,26,0.18)"}`,
                  background: selected ? "var(--ink)" : "transparent",
                  color: selected ? "var(--bg)" : "var(--ink)",
                  opacity: selected ? 1 : 0.7,
                }}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>

      {/* Divisor */}
      <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

      {/* Ordenar */}
      <div>
        <p
          className="text-[9px] uppercase tracking-[0.25em] mb-3"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Ordenar
        </p>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = currentOrden === value
            return (
              <button
                key={value}
                onClick={() => updateParam("orden", value)}
                className="block text-[11px] transition-opacity hover:opacity-100"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  color: "var(--ink)",
                  opacity: active ? 1 : 0.45,
                  fontWeight: active ? "600" : "400",
                }}
              >
                {active && <span className="mr-1.5 text-[9px]">—</span>}
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
            className="text-[10px] uppercase tracking-[0.15em] underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            Limpiar filtros
          </button>
        </>
      )}
    </div>
  )
}

export default function FilterPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchParams = useSearchParams()

  const currentCat = searchParams.get("categoria") ?? ""
  const currentTalla = searchParams.get("talla") ?? ""
  const currentOrden = searchParams.get("orden") ?? "nuevos"
  const hasFilters = !!(currentCat || currentTalla || (currentOrden && currentOrden !== "nuevos"))

  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop sidebar (lg+) ─────────────────────── */}
      <aside className="hidden lg:block w-44 flex-shrink-0 pt-1">
        <FilterContent />
      </aside>

      {/* ── Mobile top bar — w-full so it never shrinks as a flex-item ── */}
      <div className="lg:hidden w-full flex items-center justify-between mb-5">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] px-4 py-2 transition-colors"
          style={{
            fontFamily: "var(--font-space-mono)",
            color: "var(--ink)",
            border: "1px solid rgba(26,26,26,0.2)",
          }}
        >
          {hasFilters && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "var(--ink)" }}
            />
          )}
          Filtros
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
              </p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-xl leading-none transition-opacity hover:opacity-60"
                style={{ color: "var(--ink)", opacity: 0.4 }}
              >
                ×
              </button>
            </div>

            <FilterContent onClose={() => setDrawerOpen(false)} />

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
