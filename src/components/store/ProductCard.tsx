import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/productos/${product.id}`} className="group block">
      <div
        className="relative overflow-hidden aspect-[3/4]"
        style={{ background: "var(--paper)" }}
      >
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs"
            style={{ color: "var(--ink)", opacity: 0.3 }}
          >
            Sin imagen
          </div>
        )}
      </div>
      <div className="pt-2 pb-3 px-0.5">
        {product.category && (
          <p
            className="text-[9px] uppercase tracking-[0.2em] mb-1"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            {product.category}
          </p>
        )}
        <p
          className="text-[12px] leading-tight line-clamp-2 mb-1"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
        >
          {product.title}
        </p>
        <p
          className="text-[12px] font-medium"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--accent-2)" }}
        >
          ${Number(product.sale_price).toLocaleString("es-MX")}
        </p>
      </div>
    </Link>
  )
}
