"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ImportResult {
  ok?: boolean
  error?: string
  product?: { id: number; title: string; price: number }
}

export default function PrintfulImportButton() {
  const [inputId, setInputId] = useState("")
  const [margin, setMargin] = useState("2.75")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<{ id: string; result: ImportResult }>>([])
  const router = useRouter()

  async function handleImport() {
    const id = parseInt(inputId.trim())
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch("/api/printful/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, margin: parseFloat(margin) || undefined }),
      })
      const result: ImportResult = await res.json()
      setResults((prev) => [{ id: inputId, result }, ...prev])
      if (result.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Importar de Printful</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          ID de producto sincronizado en tu tienda Printful (Store products)
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          placeholder="ID de producto Printful"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          type="number"
          step="0.25"
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          title="Multiplicador de margen (ej: 2.75 = costo x 2.75)"
          className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          onClick={handleImport}
          disabled={loading || !inputId}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Importando…" : "Importar"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5 border-t pt-3">
          {results.map(({ id, result }, i) => (
            <div
              key={`${id}-${i}`}
              className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${
                result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              <span className="font-mono text-xs">#{id}</span>
              <span className="text-xs">
                {result.ok
                  ? `✓ ${result.product?.title?.slice(0, 40) ?? "importado"} — $${result.product?.price}`
                  : `Error: ${result.error}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
