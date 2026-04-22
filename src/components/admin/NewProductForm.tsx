"use client"

import { useState } from "react"
import { createProduct } from "@/app/(admin)/admin/productos/actions"

const CATEGORIES = ["Tops", "Jerseys", "Vestidos", "Pantalones", "Faldas", "Shorts", "Accesorios"]
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const MARKUP = 2.5

export default function NewProductForm() {
  const [salePrice, setSalePrice] = useState("")
  const [previews, setPreviews] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleCostChange(val: string) {
    const n = parseFloat(val)
    setSalePrice(isNaN(n) || n <= 0 ? "" : String(Math.ceil((n * MARKUP) / 100) * 100))
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error: serverError } = await createProduct(new FormData(e.currentTarget))
    if (serverError) {
      setError(serverError)
      setPending(false)
      return
    }
    setPending(false)
    window.location.href = "/admin/productos"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl text-gray-900">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
        <input
          name="title"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Ej: Blusa floral manga corta"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          name="description"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
          placeholder="Descripción del producto..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio costo (MXN) *</label>
          <input
            name="cost_price"
            type="number"
            min="1"
            step="0.01"
            required
            onChange={(e) => handleCostChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio venta (MXN)
            <span className="ml-1 text-gray-400 font-normal">×2.5 auto</span>
          </label>
          <input
            name="sale_price"
            type="number"
            min="1"
            step="1"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
        <select
          name="category"
          required
          defaultValue=""
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="" disabled>Seleccionar...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tallas disponibles</label>
        <div className="flex gap-4 flex-wrap">
          {SIZES.map((s) => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name={`size_${s}`}
                className="w-4 h-4 rounded border-gray-300 accent-black"
              />
              <span className="text-sm">{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL origen (opcional)</label>
        <input
          name="shein_url"
          type="url"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="https://www.shein.com.mx/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imágenes
          <span className="ml-1 text-gray-400 font-normal">hasta 5</span>
        </label>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImages}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:bg-white hover:file:bg-gray-50 cursor-pointer"
        />
        {previews.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar producto"}
        </button>
        <a
          href="/admin/productos"
          className="px-6 py-2.5 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
