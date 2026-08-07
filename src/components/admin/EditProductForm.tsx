"use client"

import { useMemo, useState } from "react"
import { updateProduct, updateProductPresentation } from "@/app/(admin)/admin/productos/actions"
import type { Product } from "@/types"

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "out_of_stock", label: "Sin stock" },
] as const

const fieldClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"

function PresentationForm({ product }: { product: Product }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setPending(true)
    const result = await updateProductPresentation(product.id, new FormData(event.currentTarget))
    setPending(false)
    if (result.error) return setError(result.error)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div>
        <h2 className="font-semibold text-gray-900">Presentación editorial</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          Estos datos viven en Supabase y tienen prioridad sobre la información visual del proveedor.
          Una sincronización de Printful no debe modificarlos.
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre comercial" name="display_name" defaultValue={product.display_name ?? ""} />
        <Field label="Descriptor" name="subtitle" defaultValue={product.subtitle ?? ""} />
      </div>
      <Field label="Capítulo" name="chapter" defaultValue={product.chapter ?? ""} />
      <label className="block text-sm font-medium text-gray-700">
        Historia
        <textarea name="story" rows={4} defaultValue={product.story ?? ""} className={`${fieldClass} mt-1 resize-y`} />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Imágenes editoriales
        <span className="ml-1 font-normal text-gray-400">una URL HTTPS por línea, en orden de aparición</span>
        <textarea
          name="editorial_images"
          rows={6}
          defaultValue={(product.editorial_images ?? []).join("\n")}
          placeholder="https://…"
          className={`${fieldClass} mt-1 resize-y font-mono text-xs`}
        />
      </label>

      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50">
          {pending ? "Guardando…" : "Guardar presentación"}
        </button>
        {saved && <span className="text-xs font-medium text-green-700">Guardado</span>}
      </div>
    </form>
  )
}

export default function EditProductForm({ product }: { product: Product }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalPrice, setOriginalPrice] = useState(String(product.original_price))
  const [salePrice, setSalePrice] = useState(String(product.sale_price))

  const discount = useMemo(() => {
    const original = Number(originalPrice)
    const sale = Number(salePrice)
    if (!Number.isFinite(original) || !Number.isFinite(sale) || original <= 0 || sale >= original) return null
    return Math.round(((original - sale) / original) * 100)
  }, [originalPrice, salePrice])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const result = await updateProduct(product.id, new FormData(event.currentTarget))
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }
    window.location.href = "/admin/productos"
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h2 className="font-semibold text-gray-900">Información comercial</h2>
            <p className="mt-1 text-xs text-gray-500">La edición guarda únicamente campos comerciales; IDs, variantes e imágenes de Printful quedan intactos.</p>
          </div>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <Field label="Título interno" name="title" required defaultValue={product.title} />
          <label className="block text-sm font-medium text-gray-700">
            Descripción
            <textarea name="description" rows={4} defaultValue={product.description ?? ""} className={`${fieldClass} mt-1 resize-y`} />
          </label>
          <Field label="Categoría" name="category" defaultValue={product.category} />

          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="Costo interno" name="cost_price" defaultValue={product.cost_price} />
            <NumberField label="Precio normal" name="original_price" value={originalPrice} onChange={setOriginalPrice} />
            <NumberField label="Precio de venta" name="sale_price" value={salePrice} onChange={setSalePrice} />
          </div>
          <div className={`rounded-lg px-3 py-2 text-xs ${discount ? "bg-green-50 text-green-800" : Number(salePrice) > Number(originalPrice) ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-500"}`}>
            {discount ? `Rebaja visible calculada: ${discount}% OFF` : Number(salePrice) > Number(originalPrice) ? "El precio de venta es mayor que el precio normal." : "Sin rebaja visible."}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Estado
              <select name="status" defaultValue={product.status} className={`${fieldClass} mt-1`}>
                {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <NumberField label="Orden" name="sort_order" required={false} defaultValue={product.sort_order ?? ""} step="1" />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
            <input type="checkbox" name="featured" defaultChecked={product.featured ?? false} className="mt-0.5 h-4 w-4 accent-black" />
            <span><span className="block text-sm font-medium text-gray-800">Producto destacado</span><span className="block text-xs text-gray-500">La tienda podrá priorizarlo en espacios editoriales.</span></span>
          </label>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="font-semibold text-gray-900">Proveedor</h2>
          <p className="mt-1 text-xs text-gray-500">Solo lectura para proteger sincronización y fulfillment.</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Origen" value={product.source ?? "manual"} />
            <Info label="Printful product ID" value={product.printful_product_id} />
            <Info label="Variantes mapeadas" value={Object.keys(product.printful_variant_map ?? {}).length} />
            <Info label="Imágenes de proveedor" value={product.images?.length ?? 0} />
          </dl>
        </section>

        <div className="flex flex-wrap gap-3">
          <button disabled={pending} className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{pending ? "Guardando…" : "Guardar producto"}</button>
          <a href="/admin/productos" className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancelar</a>
        </div>
      </form>

      <PresentationForm product={product} />
    </div>
  )
}

function Field({ label, name, defaultValue, required = false, help }: { label: string; name: string; defaultValue: string; required?: boolean; help?: string }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input name={name} required={required} defaultValue={defaultValue} className={`${fieldClass} mt-1`} />{help && <span className="mt-1 block text-xs font-normal text-gray-400">{help}</span>}</label>
}

function NumberField({ label, name, defaultValue, value, onChange, required = true, step = "0.01" }: { label: string; name: string; defaultValue?: string | number; value?: string; onChange?: (value: string) => void; required?: boolean; step?: string }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input name={name} type="number" min="0" step={step} required={required} defaultValue={value === undefined ? defaultValue : undefined} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className={`${fieldClass} mt-1`} /></label>
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div><dt className="text-xs text-gray-500">{label}</dt><dd className="mt-0.5 break-all text-gray-800">{value == null || value === "" ? "—" : String(value)}</dd></div>
}
