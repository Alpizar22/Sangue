import type { Metadata } from "next"
import Header from "@/components/store/Header"
import Footer from "@/components/store/Footer"

export const metadata: Metadata = {
  title: "Theia — Moda",
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
