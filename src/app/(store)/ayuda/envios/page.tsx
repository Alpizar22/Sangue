import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Envíos — Theia",
  description: "Información sobre tiempos y costos de envío a toda la República Mexicana.",
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
          Todo lo que necesitas saber sobre la entrega de tu pedido
        </p>

        <div className="space-y-10">

          {/* Resumen visual */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { num: "1–3",    unit: "días hábiles", label: "Procesamiento" },
              { num: "10–17",  unit: "días hábiles", label: "Entrega estimada" },
              { num: "$155",   unit: "MXN",          label: "Costo de envío" },
            ].map(({ num, unit, label }) => (
              <div
                key={label}
                className="p-4 text-center"
                style={{ border: "1px solid rgba(26,26,26,0.08)", background: "var(--paper)" }}
              >
                <p
                  className="text-2xl italic mb-0.5"
                  style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
                >
                  {num}
                </p>
                <p
                  className="text-[9px] uppercase tracking-[0.15em]"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
                >
                  {unit}
                </p>
                <p
                  className="text-[9px] mt-2 uppercase tracking-[0.1em]"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.3 }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          {/* Cómo funciona */}
          <div className="space-y-4">
            <p
              className="text-[10px] uppercase tracking-[0.25em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Cómo funciona
            </p>
            <div
              className="space-y-3 text-[13px] leading-relaxed"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.7 }}
            >
              <p>
                Todos los pedidos se procesan en <strong style={{ opacity: 1 }}>1 a 3 días hábiles</strong> a partir de
                la confirmación de pago.
              </p>
              <p>
                El tiempo de entrega estimado es de <strong style={{ opacity: 1 }}>10 a 17 días hábiles</strong> a
                cualquier punto de la República Mexicana.
              </p>
              <p>
                El costo de envío es de <strong style={{ opacity: 1 }}>$155 MXN por pedido</strong>, sin importar
                la cantidad de artículos que incluya.
              </p>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          {/* Rastreo */}
          <div className="space-y-3">
            <p
              className="text-[10px] uppercase tracking-[0.25em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Rastreo de tu pedido
            </p>
            <p
              className="text-[13px] leading-relaxed"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.7 }}
            >
              Una vez despachado, recibirás un número de guía por email. Puedes usarlo en nuestra
              página de{" "}
              <Link href="/ayuda/seguimiento" style={{ color: "var(--accent-2)", textDecoration: "underline" }}>
                seguimiento de pedido
              </Link>
              .
            </p>
          </div>

          <div style={{ height: "1px", background: "rgba(26,26,26,0.08)" }} />

          {/* Posibles retrasos */}
          <div className="space-y-3">
            <p
              className="text-[10px] uppercase tracking-[0.25em]"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
            >
              Posibles retrasos
            </p>
            <div
              className="space-y-2 text-[13px] leading-relaxed"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.7 }}
            >
              <p>
                Durante temporadas de alta demanda (Buen Fin, Navidad, San Valentín) los tiempos
                pueden extenderse algunos días adicionales.
              </p>
              <p>
                En casos excepcionales, los paquetes pueden ser retenidos en aduana. Si esto ocurre,
                te contactamos de inmediato para orientarte.
              </p>
            </div>
          </div>

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
              . Respondemos Lun–Vie · 10:00–18:00 hrs.
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
