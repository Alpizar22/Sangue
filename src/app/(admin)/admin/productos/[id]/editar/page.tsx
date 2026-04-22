import { notFound } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/server"
import EditProductForm from "@/components/admin/EditProductForm"
import type { Product } from "@/types"

export const metadata = { title: "Editar producto" }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !product) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/productos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Productos
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">Editar producto</h1>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <EditProductForm product={product as Product} />
      </div>
    </div>
  )
}
