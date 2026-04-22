import Link from "next/link"

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(26,26,26,0.1)", background: "var(--paper)" }}>
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 gap-8">
        <div>
          <p
            className="text-2xl italic mb-1"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            Theia
          </p>
          <p
            className="text-[11px]"
            style={{ fontFamily: "var(--font-caveat)", color: "var(--pink)", fontSize: "1rem" }}
          >
            moda que habla por vos
          </p>
        </div>
        <div className="space-y-2 text-[11px]" style={{ fontFamily: "var(--font-space-mono)" }}>
          <Link
            href="/productos"
            className="block transition-opacity hover:opacity-100"
            style={{ color: "var(--ink)", opacity: 0.45 }}
          >
            Todos los productos
          </Link>
          <Link
            href="/pedidos"
            className="block transition-opacity hover:opacity-100"
            style={{ color: "var(--ink)", opacity: 0.45 }}
          >
            Seguir pedido
          </Link>
          <a
            href="mailto:hola@theia.mx"
            className="block transition-opacity hover:opacity-100"
            style={{ color: "var(--ink)", opacity: 0.45 }}
          >
            Contacto
          </a>
        </div>
      </div>
      <div
        className="text-center py-3 text-[10px]"
        style={{
          borderTop: "1px solid rgba(26,26,26,0.06)",
          fontFamily: "var(--font-space-mono)",
          color: "var(--ink)",
          opacity: 0.25,
        }}
      >
        © {new Date().getFullYear()} Theia
      </div>
    </footer>
  )
}
