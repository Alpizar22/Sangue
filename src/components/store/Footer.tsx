import Link from "next/link"
import { Mail, MessageCircle } from "lucide-react"
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/contact"

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--paper)" }}>
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">

        {/* Col 1: Marca */}
        <div>
          <p
            className="text-2xl mb-2"
            style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
          >
            Theia
          </p>
          <p
            className="mb-4 text-[13px]"
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
          >
            Esenciales diseñados para permanecer.
          </p>
          <p
            className="text-[11px] leading-relaxed mb-5"
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
          >
            Diseño esencial. Producción bajo demanda. Envíos en México.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] transition-opacity hover:opacity-100"
              style={{ color: "var(--ink)", opacity: 0.4 }}
              aria-label="Instagram de Theia, abre en una nueva pestaña"
            >
              <InstagramIcon />
              {INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>

        {/* Col 2: Ayuda */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.12em] mb-4"
            style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
          >
            Ayuda
          </p>
          <div
            className="space-y-2.5 text-[13px]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {[
              { href: "/ayuda/seguimiento", label: "Seguimiento de pedido" },
              { href: "/ayuda/envios", label: "Política de envíos" },
              { href: "/ayuda/devoluciones", label: "Devoluciones y cambios" },
              { href: "/ayuda/preguntas-frecuentes", label: "Preguntas frecuentes" },
              { href: "/la-casa", label: "La Casa" },
              { href: "/filosofia", label: "Filosofía" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block transition-colors hover:text-[var(--ink)]"
                style={{ color: "var(--text-secondary)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Col 3: Contacto */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.12em] mb-4"
            style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
          >
            Contacto
          </p>
          <div
            className="space-y-3 text-[13px]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <a
              href={CONTACT_EMAIL_URL}
              className="flex items-center gap-2 transition-colors hover:text-[var(--ink)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <Mail size={14} strokeWidth={1.5} />
              {CONTACT_EMAIL}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-[var(--ink)]"
              style={{ color: "var(--text-secondary)" }}
            >
              <MessageCircle size={14} strokeWidth={1.5} />
              {WHATSAPP_DISPLAY}
            </a>
            <p className="text-[12px]" style={{ color: "var(--text-secondary)", opacity: 0.7 }}>
              Lun–Vie · 10:00–18:00 hrs
            </p>
          </div>
        </div>

      </div>

      <div
        className="text-center py-3 text-[10px]"
        style={{
          borderTop: "1px solid var(--border)",
          fontFamily: "var(--font-inter)",
          color: "var(--text-secondary)",
          opacity: 0.7,
        }}
      >
        © {new Date().getFullYear()} Theia · Todos los derechos reservados
      </div>
    </footer>
  )
}
