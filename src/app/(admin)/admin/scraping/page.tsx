import DropiImportButton from "@/components/admin/DropiImportButton"

export const metadata = { title: "Importar Dropi" }

export default function ScrapingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Importar productos</h1>
      <p className="text-sm text-gray-500 mb-6">Proveedor activo: Dropi México</p>
      <DropiImportButton />
    </div>
  )
}
