"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import type { Product } from "@/types"

const COLOR_MAP: Record<string, string> = {
  negro: "#111111", black: "#111111",
  blanco: "#f5f5f5", white: "#f5f5f5",
  rojo: "#d63031", red: "#d63031",
  azul: "#0984e3", blue: "#0984e3",
  verde: "#00b894", green: "#00b894",
  amarillo: "#fdcb6e", yellow: "#fdcb6e",
  naranja: "#e17055", orange: "#e17055",
  rosa: "#fd79a8", pink: "#fd79a8",
  morado: "#6c5ce7", purple: "#6c5ce7",
  violeta: "#a29bfe", violet: "#a29bfe",
  gris: "#b2bec3", gray: "#b2bec3", grey: "#b2bec3",
  beige: "#e8d5b0", crema: "#f4f1ec", cream: "#f4f1ec",
  café: "#8B4513", brown: "#8B4513", marrón: "#8B4513",
  marino: "#2d3a5f", navy: "#2d3a5f",
  dorado: "#c8a96a", gold: "#c8a96a",
  plateado: "#dfe6e9", silver: "#dfe6e9",
}

function colorToCss(name: string): string {
  return COLOR_MAP[name.toLowerCase().trim()] ?? "#b2bec3"
}

function isLightColor(css: string): boolean {
  const hex = css.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 180
}

interface Props {
  product: Product
  onColorChange?: (color: string, colorIndex: number) => void
}

export default function AddToCartButton({ product, onColorChange }: Props) {
  const colors = product.colors ?? []
  const allSizes = product.sizes ?? []

  const [selectedColor, setSelectedColor] = useState<string>(
    colors.length === 1 ? colors[0] : ""
  )
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const initColor = colors.length === 1 ? colors[0] : ""
    const initSizes = product.color_sizes?.[initColor] ?? allSizes
    return initSizes.length === 1 ? initSizes[0] : ""
  })
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  // Sizes visible for currently selected color
  const availableSizes: string[] = selectedColor && product.color_sizes?.[selectedColor]
    ? product.color_sizes[selectedColor]
    : allSizes

  const hasColors = colors.length > 0
  const hasSizes = availableSizes.length > 0
  const needsSizeSelection = hasSizes && !selectedSize

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    const idx = colors.indexOf(color)
    if (idx !== -1) onColorChange?.(color, idx)

    // Clear size if it doesn't exist for the new color
    const newSizes = product.color_sizes?.[color] ?? allSizes
    if (selectedSize && !newSizes.includes(selectedSize)) {
      setSelectedSize(newSizes.length === 1 ? newSizes[0] : "")
    }
  }

  function handleAdd() {
    if (needsSizeSelection) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 2500)
      return
    }
    addItem(product, selectedSize, selectedColor)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <div className="space-y-5">

      {/* ── 1. Color ── */}
      {hasColors && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="text-[11px] uppercase tracking-[0.15em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.55 }}
            >
              Color
            </p>
            {selectedColor && (
              <span
                className="text-[11px]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--accent-2)" }}
              >
                {selectedColor}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const css = colorToCss(color)
              const light = isLightColor(css)
              const selected = selectedColor === color
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                  aria-label={color}
                  aria-pressed={selected}
                  className="flex items-center justify-center transition-all duration-150"
                  style={{ width: "44px", height: "44px", background: "transparent", border: "none", padding: 0 }}
                >
                  <span
                    style={{
                      display: "block",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: css,
                      border: light ? "1px solid rgba(26,26,26,0.2)" : "1px solid transparent",
                      boxShadow: selected ? `0 0 0 2px var(--bg), 0 0 0 3.5px var(--ink)` : "none",
                      transform: selected ? "scale(1.1)" : "scale(1)",
                      transition: "transform 150ms, box-shadow 150ms",
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 2. Talla (filtered by selected color) ── */}
      {hasSizes && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="text-[11px] uppercase tracking-[0.15em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.55 }}
            >
              Talla
              {hasColors && !selectedColor && (
                <span style={{ opacity: 0.5, fontWeight: 400, letterSpacing: 0 }}>
                  {" — "}selecciona un color primero
                </span>
              )}
            </p>
            {selectedSize && (
              <span
                className="text-[11px]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--accent-2)" }}
              >
                {selectedSize}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const selected = selectedSize === size
              const stockCount = product.size_stock?.[size]
              const outOfStock = product.size_stock != null && (stockCount ?? 0) === 0
              return (
                <button
                  key={size}
                  onClick={() => { if (!outOfStock) { setSelectedSize(size); setSizeError(false) } }}
                  disabled={outOfStock}
                  title={outOfStock ? "Sin stock" : undefined}
                  className="px-4 text-[11px] uppercase tracking-wide transition-all duration-150 flex items-center justify-center"
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    minHeight: "44px",
                    minWidth: "44px",
                    border: `1px solid ${outOfStock ? "rgba(26,26,26,0.1)" : selected ? "var(--ink)" : "rgba(26,26,26,0.2)"}`,
                    background: outOfStock ? "transparent" : selected ? "var(--ink)" : "transparent",
                    color: outOfStock ? "rgba(26,26,26,0.25)" : selected ? "var(--bg)" : "var(--ink)",
                    opacity: outOfStock ? 0.5 : selected ? 1 : 0.7,
                    cursor: outOfStock ? "not-allowed" : "pointer",
                    textDecoration: outOfStock ? "line-through" : "none",
                  }}
                >
                  {size}
                </button>
              )
            })}
          </div>
          {sizeError && (
            <p
              className="text-[11px] mt-2"
              style={{ fontFamily: "var(--font-space-mono)", color: "#d63031" }}
            >
              Selecciona una talla para continuar
            </p>
          )}
        </div>
      )}

      {/* ── 3. Agregar al carrito ── */}
      <button
        onClick={handleAdd}
        className="w-full py-4 text-[11px] uppercase tracking-[0.2em] transition-all duration-300"
        style={{
          fontFamily: "var(--font-space-mono)",
          background: added ? "var(--accent)" : "var(--ink)",
          color: "var(--bg)",
          opacity: needsSizeSelection ? 0.6 : 1,
        }}
      >
        {added ? "¡Agregado al carrito!" : needsSizeSelection ? "Selecciona una talla" : "Agregar al carrito"}
      </button>

    </div>
  )
}
