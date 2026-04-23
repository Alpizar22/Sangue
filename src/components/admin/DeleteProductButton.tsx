"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteProduct } from "@/app/(admin)/admin/productos/actions"

export default function DeleteProductButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    const { error } = await deleteProduct(id)
    if (error) {
      alert(`Error: ${error}`)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-700 text-xs disabled:opacity-40"
    >
      {loading ? "…" : "Eliminar"}
    </button>
  )
}
