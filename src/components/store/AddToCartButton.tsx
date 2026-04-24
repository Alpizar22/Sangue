"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import type { Product } from "@/types"

const COLOR_MAP: Record<string, string> = {
  // Español básico
  negro: "#111111", blanco: "#f5f5f5", rojo: "#c0392b", azul: "#2980b9",
  verde: "#27ae60", amarillo: "#f1c40f", naranja: "#e67e22", rosa: "#e91e8c",
  morado: "#8e44ad", violeta: "#9b59b6", gris: "#95a5a6",
  beige: "#e8d5b0", crema: "#f4f1ec", café: "#795548",
  marrón: "#795548", marino: "#1a237e", dorado: "#c8a96a", plateado: "#b0bec5",
  // English basic
  black: "#111111", white: "#f5f5f5", red: "#c0392b", blue: "#2980b9",
  green: "#27ae60", yellow: "#f1c40f", orange: "#e67e22", pink: "#e91e8c",
  purple: "#8e44ad", violet: "#9b59b6", gray: "#95a5a6", grey: "#95a5a6",
  brown: "#795548", navy: "#1a237e", gold: "#c8a96a", silver: "#b0bec5",
  cream: "#f4f1ec",
  // CJ common multi-word colors (lowercase key)
  "wine red": "#722f37", "wine": "#722f37",
  "purplish red": "#9c2542", "rose red": "#c0394b",
  "dark red": "#8b0000", "brick red": "#cb4154",
  "burgundy": "#800020", "bordeaux": "#800020",
  "coral": "#ff6b6b", "coral red": "#ff4040",
  "watermelon red": "#fc4c4c",
  "dark green": "#1b4332", "army green": "#4b5320",
  "olive green": "#6b7c1e", "olive": "#808000",
  "forest green": "#228b22", "hunter green": "#355e3b",
  "mint green": "#98d8c8", "mint": "#98d8c8",
  "sage green": "#87ae73", "sage": "#87ae73",
  "teal": "#008080", "cyan": "#00bcd4",
  "turquoise": "#40e0d0", "aqua": "#00bcd4",
  "sky blue": "#87ceeb", "light blue": "#add8e6",
  "baby blue": "#89cff0", "powder blue": "#b0c4de",
  "royal blue": "#4169e1", "cobalt blue": "#0047ab",
  "navy blue": "#001f5b", "dark blue": "#00008b",
  "denim blue": "#1560bd", "steel blue": "#4682b4",
  "camel": "#c19a6b", "tan": "#d2b48c",
  "khaki": "#c3b091", "sand": "#c2b280",
  "apricot": "#fbceb1", "peach": "#ffcba4",
  "dusty pink": "#d4a5a5", "dusty rose": "#c08080",
  "blush pink": "#ffb6c1", "blush": "#ffb6c1",
  "rose": "#ff007f", "hot pink": "#ff69b4",
  "baby pink": "#f4c2c2", "light pink": "#ffb6c1",
  "fuchsia": "#ff00ff", "magenta": "#e040fb",
  "lavender": "#e6e6fa", "lilac": "#c8a2c8",
  "champagne": "#f7e7ce", "ivory": "#fffff0",
  "off white": "#faf9f6", "off-white": "#faf9f6",
  "pearl": "#f0ead6", "nude": "#e8c9a0",
  "linen": "#faf0e6",
  "mustard": "#ffdb58", "mustard yellow": "#e1ad01",
  "coffee": "#6f4e37", "mocha": "#6b4226",
  "chocolate": "#7b3f00", "walnut": "#773f1a",
  "caramel": "#c68642",
  "dark grey": "#404040", "dark gray": "#404040",
  "light grey": "#d3d3d3", "light gray": "#d3d3d3",
  "charcoal": "#36454f", "charcoal grey": "#36454f",
  "heather grey": "#b2b2b2", "heather gray": "#b2b2b2",
  "smoke grey": "#848884", "slate grey": "#708090",
  "white grey": "#e8e8e8",
}

function colorToCss(name: string): string | null {
  const key = name.toLowerCase().trim()
  return COLOR_MAP[key] ?? null
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 180
}

function isColorOutOfStock(color: string, product: Product): boolean {
  if (!product.size_stock || !product.color_sizes) return false
  const sizes = product.color_sizes[color]
  if (!sizes?.length) return false
  return sizes.every((s) => (product.size_stock?.[s] ?? 1) === 0)
}

interface Props {
  product: Product
  onColorChange?: (color: string, colorIndex: number) => void
}

export default function AddToCartButton({ product, onColorChange }: Props) {
  const allColors = product.colors ?? []
  const allSizes = product.sizes ?? []

  // Filter out colors with 0 stock
  const colors = allColors.filter((c) => !isColorOutOfStock(c, product))

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

  const availableSizes: string[] = selectedColor && product.color_sizes?.[selectedColor]
    ? product.color_sizes[selectedColor]
    : allSizes

  const hasColors = colors.length > 0
  const hasSizes = availableSizes.length > 0
  const needsSizeSelection = hasSizes && !selectedSize

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    const idx = allColors.indexOf(color)
    if (idx !== -1) onColorChange?.(color, idx)
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

      {/* ── Color ── */}
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
              const selected = selectedColor === color
              const isLight = css ? isLightColor(css) : false
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
                      background: css
                        ? css
                        : "repeating-linear-gradient(45deg,#d0d0d0,#d0d0d0 3px,#f0f0f0 3px,#f0f0f0 8px)",
                      border: (!css || isLight) ? "1px solid rgba(26,26,26,0.2)" : "1px solid transparent",
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

      {/* ── Talla ── */}
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
            <p className="text-[11px] mt-2" style={{ fontFamily: "var(--font-space-mono)", color: "#d63031" }}>
              Selecciona una talla para continuar
            </p>
          )}
        </div>
      )}

      {/* ── Agregar al carrito ── */}
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
