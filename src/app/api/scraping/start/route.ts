import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { scrapSheinCategory, scrapSheinProduct, toTheiaProduct } from "@/lib/scraper/shein"

export async function POST(req: NextRequest) {
  try {
    const {
      url,
      urls,
      maxProducts = 20,
      markupPercentage = 80,
      enrichDetails = false,
    } = await req.json()

    const multiplier = 1 + markupPercentage / 100

    // Accept single url or array of urls
    const urlList: string[] = Array.isArray(urls) && urls.length
      ? urls
      : url
      ? [url]
      : []

    if (urlList.length === 0 || urlList.some((u: string) => !u.includes("shein"))) {
      return NextResponse.json({ message: "URL de Shein inválida" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const jobIds: string[] = []

    for (const u of urlList) {
      const { data: job, error: jobError } = await supabase
        .from("scraping_jobs")
        .insert({ source_url: u, status: "running", products_found: 0, products_imported: 0 })
        .select()
        .single()

      if (jobError || !job) continue
      jobIds.push(job.id)

      // Ejecutar en background (no await)
      runScrapingJob(job.id, u, maxProducts, multiplier, enrichDetails, supabase)
    }

    if (jobIds.length === 0) {
      return NextResponse.json({ message: "Error al crear jobs" }, { status: 500 })
    }

    return NextResponse.json({
      message: `${jobIds.length} job(s) iniciado(s)`,
      jobIds,
      jobId: jobIds[0],
    })
  } catch (error) {
    console.error("[api/scraping/start]", error)
    return NextResponse.json({ message: "Error interno" }, { status: 500 })
  }
}

async function runScrapingJob(
  jobId: string,
  url: string,
  maxProducts: number,
  multiplier: number,
  enrichDetails: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  try {
    const isCategory = !url.includes("-p-")
    const scraperResult = isCategory
      ? await scrapSheinCategory(url, maxProducts)
      : await scrapSheinProduct(url)

    if (!scraperResult.ok) {
      await supabase
        .from("scraping_jobs")
        .update({ status: "failed", error: `${scraperResult.reason}: ${scraperResult.message}` })
        .eq("id", jobId)
      return
    }

    let rawList = Array.isArray(scraperResult.data) ? scraperResult.data : [scraperResult.data]

    await supabase
      .from("scraping_jobs")
      .update({ products_found: rawList.length })
      .eq("id", jobId)

    // Optional: enrich category results with full product details (images + sizes)
    if (enrichDetails && isCategory) {
      const enriched = []
      for (const raw of rawList) {
        if (raw.shein_url) {
          const detail = await scrapSheinProduct(raw.shein_url)
          enriched.push(detail.ok ? { ...detail.data, category: raw.category || detail.data.category } : raw)
        } else {
          enriched.push(raw)
        }
      }
      rawList = enriched
    }

    let imported = 0
    for (const raw of rawList) {
      const product = toTheiaProduct(raw, multiplier)
      const { error } = await supabase
        .from("products")
        .upsert({ ...product, status: "active" }, { onConflict: "shein_product_id" })
      if (!error) imported++
    }

    await supabase
      .from("scraping_jobs")
      .update({ status: "completed", products_imported: imported, completed_at: new Date().toISOString() })
      .eq("id", jobId)
  } catch (error) {
    console.error("[scraping-job]", error)
    await supabase
      .from("scraping_jobs")
      .update({ status: "failed", error: String(error) })
      .eq("id", jobId)
  }
}
