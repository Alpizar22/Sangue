/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"
import { getDisplayImages, getDisplayName, getSubtitle } from "@/lib/presentation"
import { HERO, INTRO, MANIFESTO, MATERIALS } from "@/lib/editorial"
import NewsletterForm from "@/components/store/NewsletterForm"
import { Eyebrow } from "@/components/store/Editorial"
import styles from "./home.module.css"

export const revalidate = 120

const FEATURED_LIMIT = 4

export default async function HomePage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(FEATURED_LIMIT)

  return <HomeContent featured={(products ?? []) as Product[]} />
}

export function HomeContent({ featured }: { featured: Product[] }) {
  return (
    <div className={styles.home}>
      <Hero />
      <ProductSelection products={featured.slice(0, FEATURED_LIMIT)} />

      <section className={styles.introduction} aria-labelledby="home-intro-title">
        <Eyebrow>{INTRO.eyebrow}</Eyebrow>
        <h2 id="home-intro-title" className={styles.introTitle}>
          Diseñar menos.<br />Elegir mejor.
        </h2>
        <p className={styles.introText}>{INTRO.text}</p>
      </section>

      <section className={styles.manifesto} aria-labelledby="manifesto-title">
        <Eyebrow id="manifesto-title">{MANIFESTO.eyebrow}</Eyebrow>
        <div className={styles.manifestoLines}>
          {MANIFESTO.lines.map((line, index) => (
            <p key={line}>
              <span aria-hidden="true">0{index + 1}</span>
              {line}
            </p>
          ))}
        </div>
      </section>

      <section className={styles.materials} aria-labelledby="materials-title">
        <div className={styles.materialsRule} aria-hidden="true" />
        <div className={styles.materialsCopy}>
          <Eyebrow id="materials-title">{MATERIALS.eyebrow}</Eyebrow>
          <p>{MATERIALS.text}</p>
          <Link href="/filosofia" className={styles.textLink}>
            Conocer nuestra filosofía
          </Link>
        </div>
      </section>

      <section className={styles.newsletter} aria-labelledby="newsletter-title">
        <Eyebrow>NOTAS DE THEIA</Eyebrow>
        <h2 id="newsletter-title">Piezas nuevas, sin ruido.</h2>
        <p>Una carta ocasional sobre materia, proceso y nuevas piezas.</p>
        <NewsletterForm />
      </section>
    </div>
  )
}

function Hero() {
  const hasImage = Boolean(HERO.image)

  return (
    <section
      className={`${styles.hero} ${hasImage ? styles.heroWithImage : ""}`}
      aria-labelledby="hero-title"
    >
      {HERO.image && (
        <img src={HERO.image} alt="" className={styles.heroImage} fetchPriority="high" />
      )}
      {HERO.image && <div className={styles.heroVeil} aria-hidden="true" />}

      <div className={styles.heroHorizon} aria-hidden="true" />
      <p className={styles.heroEyebrow}>{HERO.eyebrow}</p>
      <h1 id="hero-title" className={styles.heroTitle}>{HERO.title}</h1>
      <div className={styles.heroCopy}>
        <p>{HERO.text}</p>
        <Link href={HERO.ctaHref} className={styles.heroCta}>
          {HERO.cta}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <p className={styles.heroEdition} aria-hidden="true">THEIA · 01</p>
    </section>
  )
}

function ProductSelection({ products }: { products: Product[] }) {
  return (
    <section className={styles.selection} aria-labelledby="selection-title">
      <div className={styles.sectionHeading}>
        <div>
          <Eyebrow>COLECCIÓN ACTUAL</Eyebrow>
          <h2 id="selection-title">Una selección esencial</h2>
        </div>
        {products.length > 0 && (
          <Link href="/coleccion" className={styles.textLink}>
            Ver colección
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <EmptySelection />
      ) : products.length === 1 ? (
        <SingleProduct product={products[0]} />
      ) : (
        <div className={styles.productGrid} data-count={products.length}>
          {products.map((product, index) => (
            <ProductTile key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </section>
  )
}

function EmptySelection() {
  return (
    <div className={styles.emptySelection}>
      <p className={styles.emptyIndex}>01</p>
      <div>
        <h3>La próxima selección está tomando forma.</h3>
        <p>Trabajamos pieza por pieza. Vuelve pronto para descubrir lo que sigue.</p>
      </div>
      <Link href="/la-casa" className={styles.textLink}>
        Entrar a La Casa
      </Link>
    </div>
  )
}

function SingleProduct({ product }: { product: Product }) {
  const images = getDisplayImages(product)
  const name = getDisplayName(product)
  const subtitle = getSubtitle(product)

  return (
    <article className={styles.singleProduct}>
      <Link href={`/productos/${product.id}`} className={styles.singleImageLink} aria-label={`Ver ${name}`}>
        <ProductImage src={images[0]} alt={name} priority />
      </Link>
      <div className={styles.singleDetails}>
        <p className={styles.pieceNumber}>PIEZA 01</p>
        <h3>{name}</h3>
        {subtitle && <p className={styles.productSubtitle}>{subtitle}</p>}
        <p className={styles.productPrice}>${Number(product.sale_price).toLocaleString("es-MX")} MXN</p>
        <Link href={`/productos/${product.id}`} className={styles.textLink}>
          Ver pieza
        </Link>
      </div>
    </article>
  )
}

function ProductTile({ product, index }: { product: Product; index: number }) {
  const images = getDisplayImages(product)
  const name = getDisplayName(product)
  const subtitle = getSubtitle(product)

  return (
    <article className={styles.productTile}>
      <Link href={`/productos/${product.id}`} className={styles.productImageLink} aria-label={`Ver ${name}`}>
        <ProductImage src={images[0]} alt={name} />
        <span className={styles.productIndex} aria-hidden="true">0{index + 1}</span>
      </Link>
      <div className={styles.productDetails}>
        <h3><Link href={`/productos/${product.id}`}>{name}</Link></h3>
        {subtitle && <p className={styles.productSubtitle}>{subtitle}</p>}
        <p className={styles.productPrice}>${Number(product.sale_price).toLocaleString("es-MX")} MXN</p>
      </div>
    </article>
  )
}

function ProductImage({ src, alt, priority = false }: { src?: string; alt: string; priority?: boolean }) {
  if (!src) {
    return <span className={styles.imageFallback}>Imagen en preparación</span>
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={styles.productImage}
    />
  )
}
