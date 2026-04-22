"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ScrapingForm() {
  const [urlsText, setUrlsText] = useState("")
  const [maxProducts, setMaxProducts] = useState(20)
  const [markup, setMarkup] = useState(80)
  const [enrichDetails, setEnrichDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string; jobIds?: string[] } | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    const res = await fetch("/api/scraping/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls, maxProducts, markupPercentage: markup, enrichDetails }),
    })

    const data = await res.json()
    setResult(data)
    setLoading(false)

    if (res.ok) {
      setTimeout(() => router.refresh(), 2000)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-5">
      <h2 className="font-semibold mb-4">Importar productos desde Shein</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            URLs de Shein (una por línea — categoría o producto)
          </label>
          <textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            required
            rows={4}
            placeholder={"https://www.shein.com/Women-Dresses-c-2030.html\nhttps://www.shein.com/Women-Tops-c-1735.html"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Pegá múltiples URLs para importar varias categorías a la vez.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Máx. productos por URL
            </label>
            <input
              type="number"
              value={maxProducts}
              onChange={(e) => setMaxProducts(Number(e.target.value))}
              min={1}
              max={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Markup % (ganancia sobre costo)
            </label>
            <input
              type="number"
              value={markup}
              onChange={(e) => setMarkup(Number(e.target.value))}
              min={0}
              max={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-gray-400 mt-1">
              Ej: costo $1000 con 80% → venta $1800
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <input
            type="checkbox"
            checked={enrichDetails}
            onChange={(e) => setEnrichDetails(e.target.checked)}
            className="mt-0.5 rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium block">Scraping detallado</span>
            <p className="text-xs text-gray-400 mt-0.5">
              Visita cada página de producto para obtener imágenes completas y tallas.
              Mucho más lento (1–3 min por producto) — usar solo con pocas URLs.
            </p>
          </div>
        </label>

        {result && (
          <div
            className={`p-3 rounded-lg text-sm ${
              result.jobIds?.length ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Iniciando scraping..." : "Iniciar scraping"}
        </button>
      </form>
    </div>
  )
}
