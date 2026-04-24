import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Envíos — Theia",
  description: "Información sobre tiempos de envío, transportistas y cobertura de entregas Theia.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2
        className="text-[10px] uppercase tracking-[0.25em]"
        style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
      >
        {title}
      </h2>
      <div
        className="space-y-2 text-[13px] leading-relaxed"
        style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.7 }}
      >
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-3"
      style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}
    >
      <span style={{ opacity: 0.55, flexShrink: 0, fontFamily: "var(--font-space-mono)", fontSize: "12px", color: "var(--ink)" }}>
        {label}
      </span>
      <span style={{ textAlign: "right", fontFamily: "var(--font-space-mono)", fontSize: "12px", color: "var(--ink)" }}>
        {value}
      </span>
    </div>
  )
}

export default function EnviosPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">

        <h1
          className="text-3xl italic mb-2"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Política de Envíos
        </h1>
        <p
          className="text-[11px] uppercase tracking-[0.2em] mb-12"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          Todo lo que necesitas saber sobre el envío de tu pedido
        </p>

        <div className="space-y-10">

          <Section title="Cobertura">
            <p>Por el momento realizamos envíos únicamente a toda la República Mexicana.</p>
            <p style={{ opacity: 0.5, fontSize: "12px" }}>Envíos internacionales: próximamente.</p>
          </Section>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          <Section title="Tiempos estimados">
            <div>
              <Row label="Procesamiento del pedido"   value="1–3 días hábiles" />
              <Row label="CJPacket MX Ordinary"       value="15–25 días hábiles" />
              <Row label="YunExpress Ordinary"        value="8–15 días hábiles (costo adicional)" />
              <Row label="Total estimado (estándar)"  value="16–28 días hábiles" />
            </div>
            <p style={{ fontSize: "11px", opacity: 0.45, marginTop: "8px" }}>
              Los días hábiles no incluyen sábados, domingos ni días festivos oficiales en México.
            </p>
          </Section>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          <Section title="Número de rastreo">
            <p>
              Una vez que tu pedido sea despachado, recibirás un correo electrónico con tu número
              de guía. Puedes rastrear tu envío en{" "}
              <a
                href="https://t.17track.net/es"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-2)", textDecoration: "underline" }}
              >
                17track.net
              </a>
              {" "}o desde nuestra página de{" "}
              <Link
                href="/ayuda/seguimiento"
                style={{ color: "var(--accent-2)", textDecoration: "underline" }}
              >
                seguimiento
              </Link>
              .
            </p>
          </Section>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          <Section title="Posibles retrasos">
            <p>
              Durante temporadas de alta demanda (Buen Fin, Navidad, San Valentín) los tiempos
              de envío pueden extenderse 5–10 días adicionales. Te avisaremos si hay algún
              retraso relevante en tu pedido.
            </p>
          </Section>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          <Section title="Aduana">
            <p>
              En casos raros, los paquetes pueden ser retenidos temporalmente en aduana. Theia
              no se hace responsable de cargos adicionales generados por revisiones aduanales.
              En caso de retención, te notificaremos de inmediato para orientarte en el proceso.
            </p>
          </Section>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          <div
            className="p-5 space-y-2"
            style={{ background: "var(--paper)", border: "1px solid rgba(26,26,26,0.08)" }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              ¿Tienes dudas?
            </p>
            <p
              className="text-[12px]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.65 }}
            >
              Escríbenos por{" "}
              <a
                href="https://wa.me/5213312345678"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-2)", textDecoration: "underline" }}
              >
                WhatsApp
              </a>
              {" "}o a{" "}
              <a href="mailto:hola@theia.lat" style={{ color: "var(--accent-2)", textDecoration: "underline" }}>
                hola@theia.lat
              </a>
              . Respondemos en horario Lun–Vie · 10:00–18:00 hrs.
            </p>
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
