import DropiImportButton from "@/components/admin/DropiImportButton"
import PrintfulImportButton from "@/components/admin/PrintfulImportButton"

export const metadata = { title: "Importar productos" }

export default function ScrapingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Importar productos</h1>
        <p className="text-sm text-gray-500 mb-6">Proveedores activos: Dropi México, Printful</p>
        <DropiImportButton />
      </div>
      <div>
        <PrintfulImportButton />
      </div>
    </div>
  )
}
