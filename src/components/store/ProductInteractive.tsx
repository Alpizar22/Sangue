"use client"

import { useState } from "react"
import type { Product } from "@/types"
import ProductGallery from "./ProductGallery"
import AddToCartButton from "./AddToCartButton"

interface Props {
  product: Product
}

/**
 * Full 2-column product section as a client component.
 * Owns activeIndex so that selecting a color in AddToCartButton
 * updates the image in ProductGallery.
 *
 * Convention (enforced by /api/cj/enrich):
 *   images[i] corresponds to colors[i]  for i < colors.length
 *   images[i] for i >= colors.length are general product shots
 */
export default function ProductInteractive({ product }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  function handleColorChange(_color: string, colorIndex: number) {
    const imageCount = product.images?.length ?? 0
    if (imageCount > 0 && colorIndex >= 0) {
      setActiveIndex(colorIndex < imageCount ? colorIndex : 0)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-10 lg:gap-16">

      {/* ── LEFT: Gallery ─────────────────────────────────────── */}
      <ProductGallery
        images={product.images ?? []}
        title={product.title}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
      />

      {/* ── RIGHT: Info + actions ─────────────────────────────── */}
      <div className="space-y-6">

        {product.category && (
          <p
            className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            {product.category}
          </p>
        )}

        <h1
          className="text-2xl md:text-3xl italic leading-tight"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          {product.title}
        </h1>

        <p
          className="text-3xl"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
        >
          ${Number(product.sale_price).toLocaleString("es-MX")}
        </p>

        <div style={{ height: "1px", background: "rgba(26,26,26,0.1)" }} />

        <AddToCartButton product={product} onColorChange={handleColorChange} />

        <div style={{ height: "1px", background: "rgba(26,26,26,0.1)" }} />

        {product.description && (
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.2em] mb-3"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Descripción
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--ink)", opacity: 0.7 }}
            >
              {product.description}
            </p>
          </div>
        )}

        {/* Shipping */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "var(--paper)", border: "1px solid rgba(26,26,26,0.08)" }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
          >
            Envío y entrega
          </p>
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5">📦</span>
            <div>
              <p
                className="text-[12px] font-medium mb-0.5"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
              >
                Envío estándar · 7–15 días hábiles
              </p>
              <p
                className="text-[11px]"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
              >
                A toda la República Mexicana · Seguimiento incluido
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5">🔒</span>
            <p
              className="text-[11px]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.5 }}
            >
              Pago seguro con MercadoPago · Tarjeta, transferencia o efectivo
            </p>
          </div>
        </div>

        {/* Returns */}
        <details
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(26,26,26,0.08)" }}
        >
          <summary
            className="px-4 py-3 cursor-pointer flex items-center justify-between select-none"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--ink)",
              opacity: 0.5,
              background: "var(--paper)",
              listStyle: "none",
            }}
          >
            <span>Política de devoluciones</span>
            <span className="text-base leading-none" style={{ opacity: 0.6 }}>+</span>
          </summary>
          <div
            className="px-4 py-4 space-y-2 text-[12px] leading-relaxed"
            style={{
              fontFamily: "var(--font-space-mono)",
              color: "var(--ink)",
              opacity: 0.6,
              background: "var(--bg)",
            }}
          >
            <p>Aceptamos cambios dentro de los 7 días posteriores a la recepción del pedido.</p>
            <p>El producto debe estar sin uso, con etiquetas y en su empaque original.</p>
            <p>
              Para iniciar un cambio escribinos a{" "}
              <a href="mailto:hola@theia.mx" style={{ color: "var(--accent-2)" }}>
                hola@theia.mx
              </a>{" "}
              con tu número de pedido.
            </p>
          </div>
        </details>

      </div>
    </div>
  )
}
