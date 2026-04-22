import NewProductForm from "@/components/admin/NewProductForm"
import Link from "next/link"

export const metadata = { title: "Nuevo producto" }

export default function NuevoProductoPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/productos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Productos
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">Nuevo producto</h1>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <NewProductForm />
      </div>
    </div>
  )
}
