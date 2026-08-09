"use client"

import { useState } from "react"
import type { Product } from "@/types"
import ProductGallery from "./ProductGallery"
import AddToCartButton from "./AddToCartButton"
import { getColorForImageIndex, getColorImageIndex, getDisplayName, getProductGalleryImages, getSubtitle } from "@/lib/presentation"
import { CONTACT_EMAIL, CONTACT_EMAIL_URL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/contact"
import { Truck, ShieldCheck } from "lucide-react"

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
    <details style={{ borderBottom: "1px solid var(--border)" }}>
      <summary
        className="py-4 cursor-pointer flex items-center justify-between select-none"
        style={{
          fontFamily: "var(--font-inter)",
          fontWeight: 500,
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--ink)",
          listStyle: "none",
        }}
      >
        <span>{title}</span>
        <span className="text-base leading-none" style={{ color: "var(--text-secondary)" }}>+</span>
      </summary>
      <div className="pb-4" style={{ background: "var(--bg)" }}>
        {children}
      </div>
    </details>
  )
}

export default function ProductInteractive({ product }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState("")
  const galleryImages = getProductGalleryImages(product)

  function handleColorChange(color: string) {
    setSelectedColor(color)
    setActiveIndex(getColorImageIndex(product, color))
  }

  function handleImageChange(index: number) {
    setActiveIndex(index)
    const color = getColorForImageIndex(product, index)
    if (color) setSelectedColor(color)
  }

  const desc = product.description ?? ""
  const material = desc ? extractMaterial(desc) : null
  const displayName = getDisplayName(product)
  const subtitle = getSubtitle(product)

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-16">

      {/* ── LEFT: Gallery ─────────────────────────────────────── */}
      <ProductGallery
        images={galleryImages}
        title={displayName}
        activeIndex={activeIndex}
        onActiveChange={handleImageChange}
      />

      {/* ── RIGHT: Info + actions ─────────────────────────────── */}
      <div className="space-y-5">

        {/* Eyebrow — capítulo curado, solo si existe (no se inventa) */}
        {product.chapter && (
          <p
            className="text-[11px] uppercase tracking-[0.1em]"
            style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
          >
            {product.chapter}
          </p>
        )}

        {/* Nombre + descriptor */}
        <div>
          <h1
            className="text-2xl md:text-3xl leading-tight"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            {displayName}
          </h1>
          {subtitle && (
            <p
              className="text-[13px] mt-1"
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Precio */}
        <p
          className="text-2xl"
          style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--ink)" }}
        >
          ${Number(product.sale_price).toLocaleString("es-MX")} MXN
        </p>

        <div style={{ height: "1px", background: "var(--border)" }} />

        {/* Color → Talla → CTA */}
        <AddToCartButton
          product={product}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
        />

        <div style={{ height: "1px", background: "var(--border)" }} />

        {/* Entrega */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <Truck size={16} strokeWidth={1.5} style={{ color: "var(--text-secondary)", marginTop: "1px", flexShrink: 0 }} />
            <div>
              <p
                className="text-[12px]"
                style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--ink)" }}
              >
                Envío estándar · 7–9 días hábiles
              </p>
              <p
                className="text-[12px]"
                style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
              >
                A toda la República Mexicana · seguimiento incluido
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} strokeWidth={1.5} style={{ color: "var(--text-secondary)", marginTop: "1px", flexShrink: 0 }} />
            <p
              className="text-[12px]"
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
            >
              Pago seguro con MercadoPago
            </p>
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border)" }} />

        {/* Historia — solo si fue curada */}
        {product.story && (
          <Accordion title="La pieza">
            <p className="text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}>
              {product.story}
            </p>
          </Accordion>
        )}

        {/* Especificaciones + materiales (de la descripción real) */}
        {desc && (
          <Accordion title="Especificaciones">
            <p className="text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}>
              {desc}
            </p>
          </Accordion>
        )}

        {material && (
          <Accordion title="Materiales">
            <p className="text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}>
              {material}
            </p>
          </Accordion>
        )}

        {/* Guía de tallas */}
        <Accordion title="Guía de tallas">
          <div className="overflow-x-auto">
            <table
              className="w-full text-[12px]"
              style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Talla", "Busto", "Cintura", "Cadera"].map((h) => (
                    <th
                      key={h}
                      className="py-2 pr-4 text-left font-normal"
                      style={{ color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map(({ talla, busto, cintura, cadera }) => (
                  <tr key={talla} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-2 pr-4" style={{ fontWeight: 500 }}>{talla}</td>
                    <td className="py-2 pr-4" style={{ color: "var(--text-secondary)" }}>{busto} cm</td>
                    <td className="py-2 pr-4" style={{ color: "var(--text-secondary)" }}>{cintura} cm</td>
                    <td className="py-2 pr-4" style={{ color: "var(--text-secondary)" }}>{cadera} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              className="mt-3 text-[11px]"
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
            >
              Medidas orientativas. Ante dudas, consulta por WhatsApp.
            </p>
          </div>
        </Accordion>

        {/* Cuidados */}
        <Accordion title="Cuidados">
          <p className="text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}>
            Lavar a máquina con agua fría, del revés. No usar blanqueador. Secar a la
            sombra o a baja temperatura. Planchar a temperatura media si es necesario.
          </p>
        </Accordion>

        {/* Envíos y devoluciones */}
        <Accordion title="Envíos y devoluciones">
          <div
            className="space-y-2 text-[13px] leading-relaxed"
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
          >
            <p>Cada prenda se produce bajo demanda especialmente para tu pedido.</p>
            <p>Aceptamos cambios dentro de los 7 días posteriores a la recepción, con la prenda sin uso y en su empaque original.</p>
            <p>
              Para iniciar un cambio escríbenos a{" "}
              <a href={CONTACT_EMAIL_URL} style={{ color: "var(--accent-2)" }}>
                {CONTACT_EMAIL}
              </a>{" "}
              o por{" "}
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-2)" }}>
                WhatsApp · {WHATSAPP_DISPLAY}
              </a>{" "}
              con tu número de pedido.
            </p>
          </div>
        </Accordion>

      </div>
    </div>
  )
}
