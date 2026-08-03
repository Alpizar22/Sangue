import type { Metadata } from "next"
import { Eyebrow, Divider } from "@/components/store/Editorial"
import { CONTACT_EMAIL, CONTACT_EMAIL_URL } from "@/lib/contact"

export const metadata: Metadata = { title: "Filosofía — Theia" }
export const dynamic = "force-static"

const PRINCIPLES = [
  {
    title: "Forma sobre adorno",
    text: "Diseñamos alrededor del corte y la proporción antes que del estampado o el logo. El producto debe sostenerse solo.",
  },
  {
    title: "Producción bajo demanda",
    text: "Cada pieza se fabrica después de que se pide, no antes. Es un modelo más lento, pero evita producir de más.",
  },
  {
    title: "Catálogo reducido",
    text: "Preferimos pocas piezas bien resueltas a un catálogo amplio de productos intercambiables.",
  },
  {
    title: "Permanencia",
    text: "Buscamos prendas que se puedan usar en varias temporadas, no solo en una.",
  },
]

export default function FilosofiaPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">

        <Eyebrow>FILOSOFÍA</Eyebrow>
        <h1
          className="text-4xl md:text-5xl mt-4 mb-10"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Diseño esencial
        </h1>

        <p
          className="text-[15px] leading-relaxed mb-14"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
        >
          No buscamos llamar la atención con logos grandes. Nos interesa que el
          producto, el corte y la tela hablen primero.
        </p>

        <div className="space-y-10">
          {PRINCIPLES.map((p) => (
            <div key={p.title}>
              <p
                className="text-lg mb-2"
                style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
              >
                {p.title}
              </p>
              <p
                className="text-[14px] leading-relaxed"
                style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
              >
                {p.text}
              </p>
            </div>
          ))}
        </div>

        <div className="my-14"><Divider /></div>

        <p
          className="text-[13px] leading-relaxed"
          style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}
        >
          ¿Preguntas sobre una pieza en particular? Escríbenos a{" "}
          <a href={CONTACT_EMAIL_URL} style={{ color: "var(--accent-2)" }}>{CONTACT_EMAIL}</a>.
        </p>

      </div>
    </div>
  )
}
