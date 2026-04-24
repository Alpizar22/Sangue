import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Preguntas Frecuentes — Theia",
  description: "Respuestas a las preguntas más comunes sobre Theia: envíos, pagos, tallas y más.",
}

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "¿Cuánto tarda en llegar mi pedido?",
    a: (
      <>
        El tiempo total estimado es de <strong>16 a 28 días hábiles</strong>: 1–3 días de
        procesamiento + 15–25 días de tránsito con CJPacket MX Ordinary. Si prefieres más
        rapidez, contáctanos para cotizar envío exprés (8–15 días con YunExpress).
      </>
    ),
  },
  {
    q: "¿Puedo rastrear mi pedido?",
    a: (
      <>
        Sí. Una vez despachado recibirás un número de guía por email. Puedes usarlo en{" "}
        <a
          href="https://t.17track.net/es"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-2)", textDecoration: "underline" }}
        >
          17track.net
        </a>{" "}
        o en nuestra página de{" "}
        <Link href="/ayuda/seguimiento" style={{ color: "var(--accent-2)", textDecoration: "underline" }}>
          seguimiento
        </Link>
        .
      </>
    ),
  },
  {
    q: "¿Qué hago si mi pedido no llegó?",
    a: (
      <>
        Si pasaron más de 45 días desde el despacho sin que tu pedido llegue, te emitimos un
        reembolso completo. Escríbenos por{" "}
        <a
          href="https://wa.me/5213312345678"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-2)", textDecoration: "underline" }}
        >
          WhatsApp
        </a>{" "}
        con tu número de orden.
      </>
    ),
  },
  {
    q: "¿Puedo cambiar la talla después de comprar?",
    a: (
      <>
        No es posible hacer cambios de talla una vez que el pedido fue enviado al proveedor.
        Te recomendamos revisar nuestra{" "}
        <Link href="/ayuda/devoluciones" style={{ color: "var(--accent-2)", textDecoration: "underline" }}>
          guía de tallas
        </Link>{" "}
        antes de comprar y escribirnos si tienes dudas — con gusto te asesoramos.
      </>
    ),
  },
  {
    q: "¿Los productos son de buena calidad?",
    a: "Trabajamos con CJ Dropshipping, uno de los proveedores más grandes y consolidados del mundo. La mayoría de nuestros productos tienen buenas reseñas y los seleccionamos cuidadosamente. Si algún producto llegara defectuoso, lo resolvemos sin costo adicional para ti.",
  },
  {
    q: "¿Hacen envíos a toda la República?",
    a: "Sí, entregamos a toda la República Mexicana: ciudades principales, municipios y zonas rurales. Si tienes duda sobre tu código postal, escríbenos.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos todos los métodos disponibles en MercadoPago: tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencia bancaria (SPEI), depósito en efectivo (OXXO, 7-Eleven y más) y pago en cuotas sin intereses.",
  },
  {
    q: "¿Es seguro comprar en Theia?",
    a: "Totalmente. Los pagos se procesan a través de MercadoPago, la plataforma líder en Latinoamérica con encriptación SSL y protección al comprador. Theia nunca tiene acceso directo a los datos de tu tarjeta.",
  },
  {
    q: "¿Los precios incluyen envío?",
    a: "El costo de envío se calcula y muestra al momento del checkout. En la mayoría de los pedidos el envío estándar tiene un costo fijo. Si el total de tu compra supera cierto monto, podemos ofrecerte envío gratuito — actívalo con el código que publicamos en redes.",
  },
  {
    q: "¿Cómo sé qué talla elegir?",
    a: (
      <>
        En cada página de producto encontrarás nuestra guía de tallas con medidas en centímetros
        (busto, cintura, cadera). Si sigues con dudas, escríbenos por{" "}
        <a
          href="https://wa.me/5213312345678"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-2)", textDecoration: "underline" }}
        >
          WhatsApp
        </a>
        {" "}con tus medidas y te recomendamos la talla ideal.
      </>
    ),
  },
]

export default function FAQPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "60vh" }}>
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">

        <h1
          className="text-3xl italic mb-2"
          style={{ fontFamily: "var(--font-instrument)", color: "var(--ink)" }}
        >
          Preguntas Frecuentes
        </h1>
        <p
          className="text-[11px] uppercase tracking-[0.2em] mb-12"
          style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.35 }}
        >
          {FAQS.length} preguntas respondidas
        </p>

        <div className="space-y-0">
          {FAQS.map(({ q, a }, i) => (
            <details
              key={i}
              className="group"
              style={{ borderBottom: "1px solid rgba(26,26,26,0.08)" }}
            >
              <summary
                className="py-5 cursor-pointer flex items-start justify-between gap-4 select-none list-none"
                style={{ fontFamily: "var(--font-space-mono)" }}
              >
                <span
                  className="text-[13px] leading-snug"
                  style={{ color: "var(--ink)", fontWeight: 500 }}
                >
                  {q}
                </span>
                <span
                  className="flex-shrink-0 text-lg leading-none mt-0.5 transition-transform duration-200 group-open:rotate-45"
                  style={{ color: "var(--ink)", opacity: 0.4 }}
                >
                  +
                </span>
              </summary>
              <div
                className="pb-5 text-[12px] leading-relaxed"
                style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.65 }}
              >
                {a}
              </div>
            </details>
          ))}
        </div>

        <div
          className="mt-12 p-5 space-y-2"
          style={{ background: "var(--paper)", border: "1px solid rgba(26,26,26,0.08)" }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-space-mono)", color: "var(--ink)", opacity: 0.4 }}
          >
            ¿No encontraste lo que buscabas?
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
