import type { Metadata } from "next"
import { Eyebrow, Divider } from "@/components/store/Editorial"

export const metadata: Metadata = { title: "La Casa — Theia" }
export const dynamic = "force-static"

export default function LaCasaPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">

        <Eyebrow>LA CASA</Eyebrow>
        <h1
          className="text-4xl md:text-5xl mt-4 mb-10"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Theia
        </h1>

        <div className="space-y-6 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}>
          <p>
            Theia es una casa de diseño mexicana. Trabajamos con un catálogo reducido
            de básicos pensados para durar más de una temporada, no para seguirla.
          </p>
          <p>
            No tenemos bodega de inventario especulativo: cada pieza se produce bajo
            demanda, después de que la pides, no antes. Elegimos ese modelo porque nos
            permite sostener un catálogo pequeño sin sobreproducir.
          </p>
          <p>
            El diseño y la dirección de marca se hacen desde México. La confección se
            realiza a través de una red de talleres de impresión y producción bajo
            demanda, pieza por pieza.
          </p>
        </div>

        <div className="my-14"><Divider /></div>

        <div className="space-y-6 text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "var(--text-secondary)" }}>
          <p style={{ color: "var(--ink)" }}>Lo que nos guía</p>
          <p>Menos productos, mejor presentados.</p>
          <p>El corte, la tela y la prenda antes que el logo.</p>
          <p>Piezas atemporales, no tendencias de temporada.</p>
        </div>

      </div>
    </div>
  )
}
