/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import type { Product } from "@/types"
import { getDisplayImages, getDisplayName, getSubtitle } from "@/lib/presentation"
import { colorToCss } from "@/lib/colors"
import styles from "./Catalog.module.css"

export default function ProductCard({
  product,
  index,
  featured = false,
}: {
  product: Product
  index?: number
  featured?: boolean
}) {
  const images = getDisplayImages(product)
  const name = getDisplayName(product)
  const subtitle = getSubtitle(product)
  const colors = (product.colors ?? []).filter((color) => colorToCss(color))

  return (
    <article className={`${styles.productCard} ${featured ? styles.featuredCard : ""}`}>
      <Link href={`/productos/${product.id}`} className={styles.productImageLink} aria-label={`Ver ${name}`}>
        {images[0] ? (
          <img src={images[0]} alt={name} loading={index === 0 ? "eager" : "lazy"} />
        ) : (
          <span className={styles.imageFallback}>Imagen en preparación</span>
        )}
        {index !== undefined && (
          <span className={styles.cardIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        )}
      </Link>

      <div className={styles.productInfo}>
        {featured && <p className={styles.featuredLabel}>PIEZA DESTACADA</p>}
        <h2><Link href={`/productos/${product.id}`}>{name}</Link></h2>
        {subtitle && <p className={styles.productSubtitle}>{subtitle}</p>}
        <p className={styles.productPrice}>${Number(product.sale_price).toLocaleString("es-MX")} MXN</p>

        {colors.length > 1 && (
          <div className={styles.colorList} aria-label={`Colores disponibles: ${colors.join(", ")}`}>
            {colors.slice(0, 6).map((color) => (
              <span
                key={color}
                title={color}
                aria-hidden="true"
                style={{ background: colorToCss(color) ?? "transparent" }}
              />
            ))}
            {colors.length > 6 && <small aria-hidden="true">+{colors.length - 6}</small>}
          </div>
        )}

        {featured && (
          <Link href={`/productos/${product.id}`} className={styles.textLink}>Ver pieza</Link>
        )}
      </div>
    </article>
  )
}
