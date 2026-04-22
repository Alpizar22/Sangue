import type { Metadata } from "next"
import { Instrument_Serif, Space_Mono, Caveat } from "next/font/google"
import "./globals.css"

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
})

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
})

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Theia",
    template: "%s | Theia",
  },
  description: "Ropa y accesorios. Envíos a todo México.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${instrumentSerif.variable} ${spaceMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
