"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cart"
import { colorToCss, isLightColor } from "@/lib/colors"
import type { Product } from "@/types"

function isColorOutOfStock(color: string, product: Product): boolean {
  if (!product.color_sizes) return false
  const sizes = product.color_sizes[color]
  if (!sizes?.length) return false
  if (product.color_size_stock) {
    return sizes.every((size) => (product.color_size_stock?.[`${color}|${size}`] ?? 0) === 0)
  }
  if (!product.size_stock) return false
  return sizes.every((size) => (product.size_stock?.[size] ?? 1) === 0)
}

function getVariantStock(product: Product, color: string, size: string): number | undefined {
  if (product.color_size_stock && color) return product.color_size_stock[`${color}|${size}`] ?? 0
  return product.size_stock?.[size]
}

function isColorVisible(color: string, product: Product): boolean {
  if (!colorToCss(color)) return false
  if (product.color_sizes && !(color in product.color_sizes)) return false
  if (isColorOutOfStock(color, product)) return false
  return true
}

interface Props {
  product: Product
  onColorChange?: (color: string, colorIndex: number) => void
}

export default function AddToCartButton({ product, onColorChange }: Props) {
  const allColors = product.colors ?? []
  const allSizes = product.sizes ?? []

  const colors = allColors.filter((c) => isColorVisible(c, product))

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

  // Agotado: el producto está marcado sin stock, o ninguna combinación
  // color/talla real tiene inventario disponible.
  const noPurchasableColor = allColors.length > 0 && colors.length === 0
  const noPurchasableSize =
    hasSizes &&
    (product.size_stock != null || (product.color_size_stock != null && !!selectedColor)) &&
    availableSizes.every((size) => (getVariantStock(product, selectedColor, size) ?? 0) === 0)
  const soldOut = product.status === "out_of_stock" || noPurchasableColor || noPurchasableSize

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
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
            >
              Color
            </p>
            {selectedColor && (
              <span
                className="text-[11px]"
                style={{ fontFamily: "var(--font-inter)", color: "var(--accent-2)" }}
              >
                {selectedColor}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const css = colorToCss(color)!
              const selected = selectedColor === color
              const isLight = isLightColor(css)
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
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: css,
                      border: isLight ? "1px solid var(--border)" : "1px solid transparent",
                      boxShadow: selected ? `0 0 0 2px var(--bg), 0 0 0 3.5px var(--ink)` : "none",
                      transition: "box-shadow 150ms",
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
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
            >
              Talla
              {hasColors && !selectedColor && (
                <span style={{ fontWeight: 400 }}> — selecciona un color primero</span>
              )}
            </p>
            {selectedSize && (
              <span
                className="text-[11px]"
                style={{ fontFamily: "var(--font-inter)", color: "var(--accent-2)" }}
              >
                {selectedSize}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const selected = selectedSize === size
              const stockCount = getVariantStock(product, selectedColor, size)
              const hasVariantStock = product.size_stock != null || (product.color_size_stock != null && !!selectedColor)
              const outOfStock = hasVariantStock && (stockCount ?? 0) === 0
              return (
                <button
                  key={size}
                  onClick={() => { if (!outOfStock) { setSelectedSize(size); setSizeError(false) } }}
                  disabled={outOfStock}
                  title={outOfStock ? "Sin stock" : undefined}
                  className="px-4 text-[12px] uppercase transition-all duration-150 flex items-center justify-center"
                  style={{
                    fontFamily: "var(--font-inter)",
                    minHeight: "44px",
                    minWidth: "44px",
                    border: `1px solid ${outOfStock ? "var(--border)" : selected ? "var(--ink)" : "var(--border)"}`,
                    background: outOfStock ? "transparent" : selected ? "var(--ink)" : "transparent",
                    color: outOfStock ? "var(--text-secondary)" : selected ? "var(--bg)" : "var(--ink)",
                    opacity: outOfStock ? 0.5 : 1,
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
            <p className="text-[11px] mt-2" style={{ fontFamily: "var(--font-inter)", color: "#a13a2f" }}>
              Selecciona una talla para continuar
            </p>
          )}
        </div>
      )}

      {/* ── CTA ── */}
      <button
        onClick={handleAdd}
        disabled={soldOut}
        className="w-full py-4 text-[12px] uppercase tracking-[0.12em] transition-opacity duration-300 disabled:cursor-not-allowed"
        style={{
          fontFamily: "var(--font-inter)",
          fontWeight: 500,
          background: soldOut ? "var(--border)" : "var(--ink)",
          color: soldOut ? "var(--text-secondary)" : "var(--bg)",
          opacity: added ? 0.85 : 1,
        }}
      >
        {soldOut
          ? "NO DISPONIBLE"
          : added
          ? "AÑADIDO A LA BOLSA"
          : needsSizeSelection
          ? "SELECCIONA TU TALLA"
          : "AÑADIR A LA BOLSA"}
      </button>

    </div>
  )
}
