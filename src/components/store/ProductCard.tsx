import Link from "next/link"
import type { Product } from "@/types"
import { getDisplayName, getSubtitle, getDisplayImages } from "@/lib/presentation"
import { colorToCss } from "@/lib/colors"

export default function ProductCard({ product }: { product: Product }) {
  const images = getDisplayImages(product)
  const subtitle = getSubtitle(product)
  const colors = (product.colors ?? []).filter((c) => colorToCss(c))

  return (
    <Link href={`/productos/${product.id}`} className="group block">
      <div
        className="relative overflow-hidden aspect-[3/4]"
        style={{ background: "var(--paper)" }}
      >
        {images[0] ? (
          <img
            src={images[0]}
            alt={getDisplayName(product)}
            loading="lazy"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Sin imagen
          </div>
        )}
      </div>

      <div className="pt-3 pb-1 px-0.5">
        <p
          className="text-[14px] leading-snug"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          {getDisplayName(product)}
        </p>
        {subtitle && (
          <p
            className="text-[12px] mt-0.5"
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
          >
            {subtitle}
          </p>
        )}
        <p
          className="text-[13px] mt-1"
          style={{ fontFamily: "var(--font-inter)", color: "var(--ink)" }}
        >
          ${Number(product.sale_price).toLocaleString("es-MX")} MXN
        </p>

        {colors.length > 1 && (
          <div className="flex items-center gap-1.5 mt-2">
            {colors.slice(0, 6).map((color) => (
              <span
                key={color}
                title={color}
                className="block rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: colorToCss(color) ?? "transparent",
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
