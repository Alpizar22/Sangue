"use client"

import { useState } from "react"
import type { Product } from "@/types"
import ProductCard from "./ProductCard"
import styles from "./Catalog.module.css"

const PAGE_SIZE = 12

export default function ProductGrid({ products }: { products: Product[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = products.slice(0, visible)
  const remaining = Math.max(products.length - shown.length, 0)
  const countLayout = Math.min(shown.length, 4)

  return (
    <div>
      <ul className={styles.productGrid} data-count={countLayout} aria-label="Piezas de la colección">
        {shown.map((product, index) => (
          <li key={product.id}>
            <ProductCard product={product} index={index} featured={products.length === 1} />
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <div className={styles.loadMore}>
          <button type="button" onClick={() => setVisible((current) => current + PAGE_SIZE)}>
            Mostrar más
            <span>{remaining} {remaining === 1 ? "pieza restante" : "piezas restantes"}</span>
          </button>
        </div>
      )}
    </div>
  )
}
