"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const PRESET_IDS = [36642, 6749, 16268, 25413, 21765]

interface ImportResult {
  ok?: boolean
  error?: string
  product?: { id: number; title: string; price: number }
}

export default function DropiImportButton() {
  const [inputId, setInputId] = useState("")
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [results, setResults] = useState<Array<{ id: number; result: ImportResult }>>([])
  const [cleanLoading, setCleanLoading] = useState(false)
  const [cleanResult, setCleanResult] = useState<string | null>(null)
  const router = useRouter()

  async function importOne(id: number): Promise<ImportResult> {
    const res = await fetch("/api/dropi/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    return res.json()
  }

  async function handleSingle() {
    const id = parseInt(inputId.trim())
    if (!id) return
    setLoading(true)
    try {
      const result = await importOne(id)
      setResults((prev) => [{ id, result }, ...prev])
      if (result.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleBulk() {
    setBulkLoading(true)
    setResults([])
    try {
      for (const id of PRESET_IDS) {
        const result = await importOne(id)
        setResults((prev) => [...prev, { id, result }])
        await new Promise((r) => setTimeout(r, 400))
      }
      router.refresh()
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleCleanCJ() {
    if (!confirm("¿Eliminar TODOS los productos de CJ Dropshipping? Esta acción no se puede deshacer.")) return
    setCleanLoading(true)
    setCleanResult(null)
    try {
      const res = await fetch("/api/admin/clean-cj", { method: "POST" })
      const data = await res.json()
      setCleanResult(data.error ? `Error: ${data.error}` : `${data.deleted} productos CJ eliminados`)
      router.refresh()
    } finally {
      setCleanLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Import section */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Importar desde Dropi México</h2>
          <p className="text-xs text-gray-500 mt-0.5">Introduce un ID de producto Dropi para importarlo</p>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="ID de producto (ej: 36642)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            onClick={handleSingle}
            disabled={loading || !inputId}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Importando…" : "Importar"}
          </button>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 mb-2">
            Productos iniciales Dropi ({PRESET_IDS.join(", ")}):
          </p>
          <button
            onClick={handleBulk}
            disabled={bulkLoading}
            className="border border-black text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {bulkLoading ? "Importando todos…" : `Importar ${PRESET_IDS.length} productos iniciales`}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-1.5 border-t pt-3">
            {results.map(({ id, result }) => (
              <div
                key={id}
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

      {/* Clean CJ section */}
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <h2 className="font-semibold text-red-700 mb-1">Limpiar productos CJ</h2>
        <p className="text-xs text-gray-500 mb-3">
          Elimina todos los productos donde source = &apos;cj&apos;. Irreversible.
        </p>
        <button
          onClick={handleCleanCJ}
          disabled={cleanLoading}
          className="border border-red-400 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          {cleanLoading ? "Eliminando…" : "Eliminar productos CJ"}
        </button>
        {cleanResult && (
          <p className={`text-sm mt-2 ${cleanResult.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
            {cleanResult}
          </p>
        )}
      </div>
    </div>
  )
}
