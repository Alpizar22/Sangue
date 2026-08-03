import styles from "@/components/store/Catalog.module.css"

export default function ProductsLoading() {
  return (
    <main className={styles.catalogLoading} aria-busy="true" aria-label="Cargando colección">
      <span className={styles.srOnly} role="status">Cargando colección…</span>
      <div className={styles.loadingHeader} aria-hidden="true">
        <span />
        <span />
      </div>
      <div className={styles.loadingControls} aria-hidden="true" />
      <div className={styles.loadingGrid} aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.loadingCard}>
            <div />
            <span />
            <span />
          </div>
        ))}
      </div>
    </main>
  )
}
