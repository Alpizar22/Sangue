import PrintfulImportButton from "@/components/admin/PrintfulImportButton"

export const metadata = { title: "Importar productos" }

export default function ScrapingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Importar productos</h1>
      <p className="text-sm text-gray-500 mb-6">Proveedor activo: Printful</p>
      <PrintfulImportButton />
    </div>
  )
}
