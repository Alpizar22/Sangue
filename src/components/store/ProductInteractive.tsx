"use client"

import { useState } from "react"
import type { Product } from "@/types"
import ProductGallery from "./ProductGallery"
import AddToCartButton from "./AddToCartButton"

interface Props {
  product: Product
}

const MATERIAL_KEYWORDS = /material|fabric|polyester|cotton|composition|spandex|elastane|nylon|linen|silk|rayon|viscose|acrylic|wool|lycra|chiffon|satin|jersey/i

function extractMaterial(desc: string): string | null {
  for (const s of desc.split(/[.\n;]+/)) {
    if (MATERIAL_KEYWORDS.test(s) && s.trim().length > 0) return s.trim()
  }
  return null
}

const WHATSAPP = "https://wa.me/5213312345678"

const SIZE_GUIDE = [
  { talla: "XS",  busto: "82",  cintura: "64", cadera: "87"  },
  { talla: "S",   busto: "86",  cintura: "68", cadera: "91"  },
  { talla: "M",   busto: "90",  cintura: "72", cadera: "95"  },
  { talla: "L",   busto: "94",  cintura: "76", cadera: "99"  },
  { talla: "XL",  busto: "98",  cintura: "80", cadera: "103" },
  { talla: "XXL", busto: "102", cintura: "84", cadera: "107" },
  { talla: "3XL", busto: "106", cintura: "88", cadera: "111" },
]

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(26,26,26,0.08)" }}
    >
      <summary
        className="px-4 py-3.5 cursor-pointer flex items-center justify-between select-none"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "var(--ink)",
          opacity: 0.6,
          background: "var(--paper)",
          listStyle: "none",
        }}
      >
        <span>{title}</span>
        <span className="text-base leading-none" style={{ opacity: 0.5 }}>+</span>
      </summary>
      <div className="px-4 py-4" style={{ background: "var(--bg)" }}>
        {children}
      </div>
    </details>
  )
}

export default function ProductInteractive({ product }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  function handleColorChange(_color: string, colorIndex: number) {
    const imageCount = product.images?.length ?? 0
    if (imageCount > 0 && colorIndex >= 0) {
      setActiveIndex(colorIndex < imageCount ? colorIndex : 0)
    }
  }

  const desc = product.description ?? ""
  const material = desc ? extractMaterial(desc) : null

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-16">

      {/* ── LEFT: Gallery ─────────────────────────────────────── */}
      <ProductGallery
        images={product.images ?? []}
        title={product.title}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
      />

      {/* ── RIGHT: Info + actions ─────────────────────────────── */}
      <div className="space-y-5">

        {/* 2. Categoría */}
        {product.category && (
          <p
            className="text-[10px] uppercase tracking-[0.25em]"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            {product.category}
          </p>
        )}

        {/* 3. Título */}
        <h1
          className="text-2xl md:text-3xl italic leading-tight"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          {product.title}
        </h1>

        {/* 4. Precio */}
        <p
          className="text-3xl"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
        >
          ${Number(product.sale_price).toLocaleString("es-MX")}
        </p>

        <div style={{ height: "1px", background: "rgba(26,26,26,0.1)" }} />

        {/* 5+6+7. Color → Talla → Botón (order enforced inside AddToCartButton) */}
        <AddToCartButton product={product} onColorChange={handleColorChange} />

        <div style={{ height: "1px", background: "rgba(26,26,26,0.1)" }} />

        {/* 8. Envío y entrega */}
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

        {/* 9. Detalles del producto */}
        <Accordion title="Detalles del producto">
          <div className="space-y-3">
            {material && (
              <div>
                <p
                  className="text-[9px] uppercase tracking-[0.2em] mb-1"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
                >
                  Material
                </p>
                <p
                  className="text-[12px] leading-relaxed"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.75 }}
                >
                  {material}
                </p>
              </div>
            )}
            {desc ? (
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink)", opacity: 0.65 }}>
                {desc}
              </p>
            ) : (
              <p
                className="text-[12px] leading-relaxed"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.6 }}
              >
                Consulta con nosotros para más detalles.{" "}
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-2)", textDecoration: "underline" }}
                >
                  Escríbenos por WhatsApp →
                </a>
              </p>
            )}
          </div>
        </Accordion>

        {/* 10. Guía de tallas */}
        <Accordion title="Guía de tallas">
          <div className="overflow-x-auto">
            <table
              className="w-full text-[11px]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(26,26,26,0.1)" }}>
                  {["Talla", "Busto", "Cintura", "Cadera"].map((h) => (
                    <th
                      key={h}
                      className="py-2 pr-4 text-left font-normal"
                      style={{ opacity: 0.4, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map(({ talla, busto, cintura, cadera }) => (
                  <tr key={talla} style={{ borderBottom: "1px solid rgba(26,26,26,0.05)" }}>
                    <td className="py-2 pr-4 font-medium" style={{ opacity: 0.9 }}>{talla}</td>
                    <td className="py-2 pr-4" style={{ opacity: 0.65 }}>{busto} cm</td>
                    <td className="py-2 pr-4" style={{ opacity: 0.65 }}>{cintura} cm</td>
                    <td className="py-2 pr-4" style={{ opacity: 0.65 }}>{cadera} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              className="mt-3 text-[10px]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
            >
              Medidas orientativas. Ante dudas, consulta por WhatsApp.
            </p>
          </div>
        </Accordion>

        {/* 11. Política de devoluciones */}
        <Accordion title="Política de devoluciones">
          <div
            className="space-y-2 text-[12px] leading-relaxed"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.65 }}
          >
            <p>Aceptamos cambios dentro de los 7 días posteriores a la recepción del pedido.</p>
            <p>El producto debe estar sin uso, con etiquetas y en su empaque original.</p>
            <p>
              Para iniciar un cambio escríbenos a{" "}
              <a href="mailto:hola@theia.mx" style={{ color: "var(--accent-2)" }}>
                hola@theia.mx
              </a>{" "}
              con tu número de pedido.
            </p>
          </div>
        </Accordion>

      </div>
    </div>
  )
}
