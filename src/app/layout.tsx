import type { Metadata } from "next"
import { Instrument_Serif, Inter } from "next/font/google"
import "./globals.css"

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: {
    default: "Theia",
    template: "%s | Theia",
  },
  description: "Esenciales diseñados para permanecer. Diseño mexicano, producción bajo demanda, envíos en México.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${instrumentSerif.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <span
          className="fixed bottom-3 right-3 z-50 text-xs text-gray-400 opacity-40 pointer-events-none select-none"
          style={{ fontFamily: "monospace" }}
        >
          By Nasus
        </span>
      </body>
    </html>
  )
}
