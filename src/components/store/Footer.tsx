import Link from "next/link"

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.69a8.18 8.18 0 004.77 1.52V6.74a4.85 4.85 0 01-1-.05z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(26,26,26,0.1)", background: "var(--paper)" }}>
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">

        {/* Col 1: Marca */}
        <div>
          <p
            className="text-2xl italic mb-1"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            Theia
          </p>
          <p
            className="mb-4"
            style={{ fontFamily: "var(--font-caveat)", color: "var(--pink)", fontSize: "1rem" }}
          >
            moda que habla por ti
          </p>
          <p
            className="text-[11px] leading-relaxed mb-5"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.45 }}
          >
            Ropa con estilo y envíos a toda la República Mexicana. Pago seguro con MercadoPago.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/theia.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-100"
              style={{ color: "var(--ink)", opacity: 0.4 }}
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://tiktok.com/@theia.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-100"
              style={{ color: "var(--ink)", opacity: 0.4 }}
              aria-label="TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>

        {/* Col 2: Ayuda */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-4"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            Ayuda
          </p>
          <div
            className="space-y-2.5 text-[11px]"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            {[
              { href: "/ayuda/seguimiento", label: "Seguimiento de pedido" },
              { href: "/ayuda/envios", label: "Política de envíos" },
              { href: "/ayuda/devoluciones", label: "Devoluciones y cambios" },
              { href: "/ayuda/preguntas-frecuentes", label: "Preguntas frecuentes" },
              { href: "/coleccion", label: "Ver toda la colección" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block transition-opacity hover:opacity-100"
                style={{ color: "var(--ink)", opacity: 0.45 }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Col 3: Contacto */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-4"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            Contacto
          </p>
          <div
            className="space-y-3 text-[11px]"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            <a
              href="mailto:hola@theia.lat"
              className="flex items-center gap-2 transition-opacity hover:opacity-100"
              style={{ color: "var(--ink)", opacity: 0.45 }}
            >
              <span>✉</span>
              hola@theia.lat
            </a>
            <a
              href="https://wa.me/5213312345678?text=Hola%2C+tengo+una+pregunta+sobre+mi+pedido+en+Theia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-opacity hover:opacity-100"
              style={{ color: "var(--ink)", opacity: 0.45 }}
            >
              <span>💬</span>
              WhatsApp
            </a>
            <p style={{ color: "var(--ink)", opacity: 0.3 }}>
              Lun–Vie · 10:00–18:00 hrs
            </p>
          </div>
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
        © {new Date().getFullYear()} Theia · Todos los derechos reservados
      </div>
    </footer>
  )
}
