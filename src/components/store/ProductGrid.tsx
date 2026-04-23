"use client"

import { useState } from "react"
import type { Product } from "@/types"
import ProductCard from "./ProductCard"

const PAGE_SIZE = 12

export default function ProductGrid({ products }: { products: Product[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = products.slice(0, visible)
  const remaining = products.length - visible

  if (products.length === 0) {
    return (
      <p
        className="text-center py-20 text-sm"
        style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
      >
        No hay productos que coincidan con los filtros seleccionados.
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="px-10 py-3.5 text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-[var(--ink)] hover:text-[var(--bg)]"
            style={{
              fontFamily: "var(--font-space-mono)",
              border: "1px solid rgba(26,26,26,0.3)",
              color: "var(--ink)",
            }}
          >
            Ver más · {remaining} restantes
          </button>
        </div>
      )}
    </div>
  )
}
