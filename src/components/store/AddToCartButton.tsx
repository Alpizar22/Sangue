"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import type { Product } from "@/types"

// Maps Shein/CJ color name strings to CSS color values for the color circles
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
  const key = name.toLowerCase().trim()
  return COLOR_MAP[key] ?? "#b2bec3"
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
  /** Called when a color is selected — passes color name and its index in product.colors */
  onColorChange?: (color: string, colorIndex: number) => void
}

export default function AddToCartButton({ product, onColorChange }: Props) {
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes?.length === 1 ? product.sizes[0] : ""
  )
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.length === 1 ? product.colors[0] : ""
  )
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const hasSizes = product.sizes && product.sizes.length > 0
  const hasColors = product.colors && product.colors.length > 0

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    const idx = product.colors?.indexOf(color) ?? -1
    if (idx !== -1) onColorChange?.(color, idx)
  }

  function handleAdd() {
    if (hasSizes && !selectedSize) {
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

      {/* Size selector */}
      {hasSizes && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p
              className="text-[11px] uppercase tracking-[0.15em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.55 }}
            >
              Talla
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
            {product.sizes.map((size) => {
              const selected = selectedSize === size
              return (
                <button
                  key={size}
                  onClick={() => { setSelectedSize(size); setSizeError(false) }}
                  className="px-3.5 py-1.5 text-[11px] uppercase tracking-wide transition-all duration-150"
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    border: `1px solid ${selected ? "var(--ink)" : "rgba(26,26,26,0.2)"}`,
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
          {sizeError && (
            <p
              className="text-[11px] mt-2"
              style={{ fontFamily: "var(--font-space-mono)", color: "#d63031" }}
            >
              Seleccioná una talla para continuar
            </p>
          )}
        </div>
      )}

      {/* Color selector */}
      {hasColors && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
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
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((color) => {
              const css = colorToCss(color)
              const light = isLightColor(css)
              const selected = selectedColor === color
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                  className="w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center"
                  style={{
                    background: css,
                    border: light ? "1px solid rgba(26,26,26,0.2)" : "1px solid transparent",
                    boxShadow: selected
                      ? `0 0 0 2px var(--bg), 0 0 0 3.5px var(--ink)`
                      : "none",
                    transform: selected ? "scale(1.15)" : "scale(1)",
                  }}
                  aria-label={color}
                  aria-pressed={selected}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Add to cart button */}
      <button
        onClick={handleAdd}
        className="w-full py-4 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden"
        style={{
          fontFamily: "var(--font-space-mono)",
          background: added ? "var(--accent)" : "var(--ink)",
          color: "var(--bg)",
        }}
      >
        {added ? "¡Agregado al carrito!" : "Agregar al carrito"}
      </button>

    </div>
  )
}
