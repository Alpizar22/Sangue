import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { Product } from "@/types"
import ProductGrid from "@/components/store/ProductGrid"
import { Eyebrow } from "@/components/store/Editorial"
import styles from "@/components/store/Catalog.module.css"

export const revalidate = 60

type SearchParams = Promise<{ categoria?: string; q?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { categoria } = await searchParams
  return { title: categoria ? `${categoria} — Theia` : "Colección — Theia" }
}

export default async function ProductosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const categoria = params.categoria?.trim() || ""
  const search = params.q?.trim() || ""
  const supabase = await createClient()

  const [typesResult, productsResult] = await Promise.all([
    supabase.from("products").select("subcategory").eq("status", "active"),
    (async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (categoria) query = query.ilike("subcategory", `%${categoria}%`)
      // La búsqueda permanece deliberadamente limitada al título fuente.
      if (search) query = query.ilike("title", `%${search}%`)

      return query
    })(),
  ])

  const types = [...new Set(
    (typesResult.data ?? []).map((product) => product.subcategory).filter(Boolean)
  )]
    .map(String)
    .sort((a, b) => a.localeCompare(b, "es"))

  return (
    <CatalogContent
      products={(productsResult.data ?? []) as Product[]}
      types={types}
      categoria={categoria}
      search={search}
      hasError={Boolean(typesResult.error || productsResult.error)}
    />
  )
}

export function CatalogContent({
  products,
  types,
  categoria,
  search,
  hasError = false,
}: {
  products: Product[]
  types: string[]
  categoria: string
  search: string
  hasError?: boolean
}) {
  const hasActiveQuery = Boolean(categoria || search)

  return (
    <main className={styles.catalog}>
      <header className={styles.catalogHeader}>
        <Eyebrow>THEIA · CHAPTER I</Eyebrow>
        <div className={styles.catalogTitleRow}>
          <h1>Colección</h1>
          <p>Esenciales construidos alrededor de la forma, la materia y la permanencia.</p>
        </div>
      </header>

      <CatalogControls types={types} categoria={categoria} search={search} />

      <section className={styles.results} aria-labelledby="catalog-results-title">
        <div className={styles.resultsMeta}>
          <p id="catalog-results-title">
            {hasError
              ? "Colección no disponible"
              : `${products.length} ${products.length === 1 ? "pieza" : "piezas"}`}
          </p>
          {hasActiveQuery && !hasError && (
            <p className={styles.querySummary}>
              {categoria && <span>{categoria}</span>}
              {search && <span>“{search}”</span>}
            </p>
          )}
        </div>

        {hasError ? (
          <CatalogState
            index="—"
            title="No pudimos cargar la colección."
            description="Hubo un problema temporal al consultar las piezas. Intenta de nuevo en unos minutos."
            actionHref="/productos"
            actionLabel="Volver a intentar"
          />
        ) : products.length > 0 ? (
          <ProductGrid key={`${categoria}|${search}`} products={products} />
        ) : hasActiveQuery ? (
          <CatalogState
            index="00"
            title="No encontramos piezas con estos criterios."
            description={search
              ? `La búsqueda actual revisa el nombre fuente del producto y no encontró coincidencias para “${search}”.`
              : `No hay piezas disponibles actualmente en ${categoria}.`}
            actionHref="/productos"
            actionLabel="Ver toda la colección"
          />
        ) : (
          <CatalogState
            index="01"
            title="La colección está tomando forma."
            description="Trabajamos pieza por pieza. Vuelve pronto para descubrir la próxima selección de Theia."
            actionHref="/la-casa"
            actionLabel="Entrar a La Casa"
          />
        )}
      </section>
    </main>
  )
}

function CatalogControls({
  types,
  categoria,
  search,
}: {
  types: string[]
  categoria: string
  search: string
}) {
  return (
    <div className={styles.controls}>
      <nav className={styles.categoryNav} aria-label="Filtrar por tipo de prenda">
        <Link
          href={catalogHref({ search })}
          aria-current={!categoria ? "page" : undefined}
          className={!categoria ? styles.activeCategory : undefined}
        >
          Todo
        </Link>
        {types.map((type) => (
          <Link
            key={type}
            href={catalogHref({ categoria: type, search })}
            aria-current={categoria === type ? "page" : undefined}
            className={categoria === type ? styles.activeCategory : undefined}
          >
            {type}
          </Link>
        ))}
      </nav>

      <form action="/productos" method="get" className={styles.searchForm} role="search">
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        <label htmlFor="catalog-search">Buscar en la colección</label>
        <div className={styles.searchField}>
          <input
            id="catalog-search"
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Buscar por nombre"
            autoComplete="off"
          />
          <button type="submit">Buscar</button>
        </div>
      </form>
    </div>
  )
}

function CatalogState({
  index,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  index: string
  title: string
  description: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className={styles.catalogState}>
      <p className={styles.stateIndex}>{index}</p>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Link href={actionHref} className={styles.textLink}>{actionLabel}</Link>
    </div>
  )
}

function catalogHref({ categoria, search }: { categoria?: string; search?: string }) {
  const params = new URLSearchParams()
  if (categoria) params.set("categoria", categoria)
  if (search) params.set("q", search)
  const query = params.toString()
  return query ? `/productos?${query}` : "/productos"
}
