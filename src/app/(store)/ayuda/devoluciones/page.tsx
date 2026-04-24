import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Devoluciones y Cambios — Theia",
  description: "Política de devoluciones y cambios de Theia. Cómo reportar un problema con tu pedido.",
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
        style={{
          background: "var(--ink)",
          color: "var(--bg)",
          fontFamily: "var(--font-space-mono)",
          marginTop: "2px",
        }}
      >
        {n}
      </div>
      <div className="space-y-1">
        <p
          className="text-[12px] font-medium"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
        >
          {title}
        </p>
        <div
          className="text-[12px] leading-relaxed"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.6 }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function PolicyRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="flex gap-4 p-4"
      style={{ border: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
    >
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div>
        <p
          className="text-[12px] font-medium mb-0.5"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
        >
          {title}
        </p>
        <p
          className="text-[11px] leading-relaxed"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.55 }}
        >
          {desc}
        </p>
      </div>
    </div>
  )
}

export default function DevolucionesPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">

        <h1
          className="text-3xl italic mb-2"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Devoluciones y Cambios
        </h1>
        <p
          className="text-[11px] uppercase tracking-[0.2em] mb-12"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Nuestra política es honesta y basada en lo que realmente podemos hacer
        </p>

        <div className="space-y-10">

          {/* Política en tarjetas */}
          <div className="space-y-3">
            <PolicyRow
              icon="✅"
              title="Producto dañado o con defecto"
              desc="Acepta reporte dentro de los 7 días de recibido. Envíanos foto del problema por WhatsApp con tu número de orden. Gestionamos con el proveedor: reenvío del producto o reembolso completo."
            />
            <PolicyRow
              icon="📦"
              title="Pedido no entregado en 45 días"
              desc="Si tu pedido no llega en 45 días corridos desde el despacho, te emitimos un reembolso completo. Aplica en ausencia de retención aduanal activa."
            />
            <PolicyRow
              icon="❌"
              title="Cambio por talla u otro motivo"
              desc="No aceptamos devoluciones físicas por cambio de opinión o talla incorrecta. Nuestro proveedor CJ no acepta retornos físicos de México. Por eso incluimos guía de tallas detallada y atendemos dudas antes de la compra."
            />
          </div>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          {/* Proceso */}
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.25em] mb-6"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Cómo reportar un problema
            </p>
            <div className="space-y-5">
              <Step n={1} title="Contáctanos dentro de los 7 días de recibido">
                <p>Por WhatsApp al número que aparece en el footer o escríbenos a hola@theia.lat.</p>
              </Step>
              <Step n={2} title="Incluye tu número de orden y foto del problema">
                <p>
                  Una foto clara del producto y el empaque ayuda a gestionar más rápido con
                  el proveedor. Tu número de orden llegó en el email de confirmación.
                </p>
              </Step>
              <Step n={3} title="Esperamos respuesta del proveedor (2–5 días hábiles)">
                <p>
                  Abrimos un caso con CJ Dropshipping. Una vez aprobado, coordinamos el
                  reenvío o el reembolso según lo acordado.
                </p>
              </Step>
              <Step n={4} title="Reenvío o reembolso">
                <p>
                  El reembolso se procesa por MercadoPago en 5–10 días hábiles según tu banco.
                  Los reenvíos tienen el mismo tiempo de entrega que el pedido original.
                </p>
              </Step>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          <div
            className="p-5"
            style={{ background: "var(--paper)", border: "1px solid rgba(26,26,26,0.08)" }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.2em] mb-3"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Contacto para reportes
            </p>
            <div className="space-y-2">
              <a
                href="https://wa.me/5213312345678?text=Hola%2C+tengo+un+problema+con+mi+pedido"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px] transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
              >
                <span>💬</span>
                WhatsApp (respuesta más rápida)
              </a>
              <a
                href="mailto:hola@theia.lat?subject=Reporte%20pedido"
                className="flex items-center gap-2 text-[12px] transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)" }}
              >
                <span>✉</span>
                hola@theia.lat
              </a>
            </div>
          </div>

        </div>

        <div className="mt-10">
          <Link
            href="/coleccion"
            className="text-[10px] uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
          >
            ← Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
