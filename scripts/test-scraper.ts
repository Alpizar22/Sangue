import { readFileSync } from "fs"
import { resolve } from "path"

// Carga .env.local antes de importar el scraper
const envPath = resolve(process.cwd(), ".env.local")
try {
  const lines = readFileSync(envPath, "utf8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (!(key in process.env)) process.env[key] = val
  }
  console.log("Proxy:", process.env.SCRAPER_PROXY_URL?.replace(/:[^:@]+@/, ":***@") ?? "no configurado")
} catch {
  console.warn(".env.local no encontrado")
}

import { scrapSheinCategory, closeBrowser } from "../src/lib/scraper/shein"

const URL = "https://mx.shein.com/Women-Tops-sc-00010201.html"

async function main() {
  console.log(`\nScrapeando categoría: ${URL}\n`)

  const result = await scrapSheinCategory(URL, 6)

  if (!result.ok) {
    console.error(`Error [${result.reason}]: ${result.message}`)
    return
  }

  const products = result.data
  console.log(`Productos encontrados: ${products.length}\n`)

  for (const p of products) {
    console.log(`─────────────────────────────────────`)
    console.log(`ID:       ${p.shein_product_id}`)
    console.log(`Título:   ${p.title}`)
    console.log(`Precio:   $${p.original_price}`)
    console.log(`SKU:      ${p.shein_sku ?? "-"}`)
    console.log(`Imágenes: ${p.images.length}`)
    console.log(`URL:      ${p.shein_url}`)
  }

  await closeBrowser()
}

main().catch(async (e) => {
  console.error(e)
  await closeBrowser()
  process.exit(1)
})
