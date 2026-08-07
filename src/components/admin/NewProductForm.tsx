"use client"

import { useMemo, useState } from "react"
import { createProduct } from "@/app/(admin)/admin/productos/actions"

const CATEGORIES = ["Tops", "Jerseys", "Vestidos", "Pantalones", "Faldas", "Shorts", "Accesorios"]
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
const STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "out_of_stock", label: "Sin stock" },
] as const
const fieldClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"

export default function NewProductForm() {
  const [originalPrice, setOriginalPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [previews, setPreviews] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discount = useMemo(() => {
    const original = Number(originalPrice)
    const sale = Number(salePrice)
    if (!Number.isFinite(original) || !Number.isFinite(sale) || original <= 0 || sale >= original) return null
    return Math.round(((original - sale) / original) * 100)
  }, [originalPrice, salePrice])

  function handleImages(event: React.ChangeEvent<HTMLInputElement>) {
    previews.forEach(URL.revokeObjectURL)
    const files = Array.from(event.target.files ?? []).slice(0, 5)
    setPreviews(files.map((file) => URL.createObjectURL(file)))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const result = await createProduct(new FormData(event.currentTarget))
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }
    window.location.href = "/admin/productos"
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 text-gray-900">
      <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="font-semibold">Información comercial</h2>
          <p className="mt-1 text-xs text-gray-500">Los datos comerciales pueden ajustarse después sin modificar la información del proveedor.</p>
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Field label="Título" name="title" required />
        <label className="block text-sm font-medium text-gray-700">
          Descripción
          <textarea name="description" rows={4} className={`${fieldClass} mt-1 resize-y`} />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Categoría
          <select name="category" required defaultValue="" className={`${fieldClass} mt-1`}>
            <option value="" disabled>Seleccionar…</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Costo interno" name="cost_price" />
          <NumberField label="Precio normal" name="original_price" value={originalPrice} onChange={setOriginalPrice} />
          <NumberField label="Precio de venta" name="sale_price" value={salePrice} onChange={setSalePrice} />
        </div>
        <div className={`rounded-lg px-3 py-2 text-xs ${discount ? "bg-green-50 text-green-800" : Number(salePrice) > Number(originalPrice) ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-500"}`}>
          {discount ? `Rebaja visible calculada: ${discount}% OFF` : Number(salePrice) > Number(originalPrice) ? "El precio de venta es mayor que el precio normal." : "Sin rebaja visible."}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Estado
            <select name="status" defaultValue="draft" className={`${fieldClass} mt-1`}>
              {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <NumberField label="Orden" name="sort_order" required={false} step="1" />
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
          <input type="checkbox" name="featured" className="mt-0.5 h-4 w-4 accent-black" />
          <span><span className="block text-sm font-medium">Producto destacado</span><span className="block text-xs text-gray-500">Permite priorizarlo en espacios editoriales.</span></span>
        </label>
      </section>

      <section className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <div>
          <h2 className="font-semibold">Inventario manual</h2>
          <p className="mt-1 text-xs text-gray-500">Este flujo es para altas manuales. Los productos de Printful deben importarse desde su sección.</p>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Tallas disponibles</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {SIZES.map((size) => <label key={size} className="flex items-center gap-1.5 text-sm"><input type="checkbox" name={`size_${size}`} className="h-4 w-4 accent-black" />{size}</label>)}
          </div>
        </fieldset>
        <Field label="URL de origen (opcional)" name="shein_url" type="url" />
        <label className="block text-sm font-medium text-gray-700">
          Imágenes <span className="font-normal text-gray-400">hasta 5</span>
          <input name="images" type="file" accept="image/*" multiple onChange={handleImages} className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm hover:file:bg-gray-50" />
        </label>
        {previews.length > 0 && <div className="flex flex-wrap gap-2">{previews.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="Vista previa del producto" className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />
        ))}</div>}
      </section>

      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{pending ? "Guardando…" : "Guardar producto"}</button>
        <a href="/admin/productos" className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancelar</a>
      </div>
    </form>
  )
}

function Field({ label, name, required = false, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input name={name} type={type} required={required} className={`${fieldClass} mt-1`} /></label>
}

function NumberField({ label, name, value, onChange, required = true, step = "0.01" }: { label: string; name: string; value?: string; onChange?: (value: string) => void; required?: boolean; step?: string }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input name={name} type="number" min="0" step={step} required={required} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className={`${fieldClass} mt-1`} /></label>
}
