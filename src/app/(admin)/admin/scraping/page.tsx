import { createClient } from "@/lib/supabase/server"
import ScrapingForm from "@/components/admin/ScrapingForm"
import CJSyncButton from "@/components/admin/CJSyncButton"
import EnrichButton from "@/components/admin/EnrichButton"
import type { ScrapingJob } from "@/types"

export const metadata = { title: "Scraping" }

export default async function ScrapingPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from("scraping_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Importar productos</h1>

      <div className="space-y-4">
        <EnrichButton />
        <ScrapingForm />
        <CJSyncButton />
      </div>

      <div className="mt-8 bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Historial de jobs</h2>
        {jobs && jobs.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">URL</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Encontrados</th>
                <th className="pb-2">Importados</th>
                <th className="pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: ScrapingJob) => (
                <tr key={job.id} className="border-b last:border-0 text-xs">
                  <td className="py-2 max-w-xs truncate">
                    <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {job.source_url}
                    </a>
                  </td>
                  <td className="py-2">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-2 text-center">{job.products_found}</td>
                  <td className="py-2 text-center">{job.products_imported}</td>
                  <td className="py-2">{new Date(job.created_at).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">No hay jobs aún. Inicia tu primer scraping.</p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ScrapingJob["status"] }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800",
    running: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  )
}
