/**
 * Importa productos de Dropi a Supabase.
 * Uso: node scripts/seed-dropi.mjs
 *
 * NOTA: Si la API Dropi devuelve HTML en vez de JSON, el token
 * proporcionado es de tipo WOOCOMMERCE y necesita el endpoint
 * correcto del backend PHP de Dropi (no la SPA Angular).
 * Contactar soporte Dropi para obtener la URL del API backend.
 *
 * Alternativa: importar productos manualmente desde el admin
 * de Theia en /admin/scraping → botón "Importar desde Dropi".
 */
import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"

// Parse .env.local
const env = {}
try {
  const raw = readFileSync(".env.local", "utf8")
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "")
  }
} catch {
  console.error("No se pudo leer .env.local")
  process.exit(1)
}

const DROPI_TOKEN = env["DROPI_TOKEN"]
const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"]
const SUPABASE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"]

if (!DROPI_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan variables: DROPI_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const PRODUCT_IDS = [36642, 6749, 16268, 25413, 21765]

async function fetchProduct(id) {
  const res = await fetch(`https://app.dropi.mx/api/v1/products/${id}`, {
    headers: {
      Authorization: `Bearer ${DROPI_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  })
  const text = await res.text()
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      `La API de Dropi devolvió HTML en lugar de JSON para el producto ${id}.\n` +
      `  Este token es de tipo WOOCOMMERCE/INTEGRATIONS. Posibles soluciones:\n` +
      `  1. Contactar soporte Dropi para obtener la URL correcta del API backend\n` +
      `  2. Usar el panel admin de Theia (/admin/scraping) para importar manualmente\n` +
      `  3. Obtener un token de tipo API (no WooCommerce) desde app.dropi.mx → Integraciones`
    )
  }
  try {
    const json = JSON.parse(text)
    return json.results?.id ? json.results :
           json.data?.id ? json.data :
           json.producto?.id ? json.producto :
           json
  } catch {
    throw new Error(`Respuesta no es JSON válido para producto ${id}: ${text.slice(0, 200)}`)
  }
}

function extractImages(raw) {
  const arr = raw.imagenes ?? raw.images ?? []
  const imgs = arr.map(img =>
    typeof img === "string" ? img : img.imagen ?? img.image ?? img.url ?? ""
  ).filter(Boolean)
  if (imgs.length === 0 && raw.foto) imgs.push(raw.foto)
  return imgs
}

function extractPrice(raw) {
  return raw.precio_sugerido ?? raw.suggested_price ?? raw.precio_dropshipper ?? raw.precio ?? raw.price ?? 0
}

async function importProduct(id) {
  console.log(`\nImportando producto ${id}...`)
  try {
    const raw = await fetchProduct(id)
    const title = raw.nombre ?? raw.name ?? `Producto ${id}`
    const price = extractPrice(raw)
    const images = extractImages(raw)
    const variations = (raw.variaciones ?? raw.variations ?? []).map(v => ({
      id: v.id,
      name: v.nombre ?? v.name ?? String(v.id),
    }))

    console.log(`  → ${title} | $${price} | ${images.length} imgs | ${variations.length} vars`)

    const row = {
      shein_product_id: `dropi_${id}`,
      shein_url: `https://app.dropi.mx/productos/${id}`,
      dropi_product_id: id,
      title,
      description: raw.descripcion ?? raw.description ?? null,
      images,
      original_price: price,
      cost_price: price,
      sale_price: price,
      markup_percentage: 0,
      category: raw.categoria ?? raw.category ?? "General",
      tags: ["dropi"],
      sizes: variations.map(v => v.name),
      colors: [],
      status: "active",
      source: "dropi",
      seccion: "general",
      stock: 99,
    }

    const { error } = await supabase
      .from("products")
      .upsert(row, { onConflict: "shein_product_id" })

    if (error) {
      if (error.message?.includes("dropi_product_id")) {
        const { dropi_product_id: _, source: _s, ...rowWithout } = row
        const { error: err2 } = await supabase
          .from("products")
          .upsert(rowWithout, { onConflict: "shein_product_id" })
        if (err2) throw err2
        console.log(`  ✓ Importado (sin columnas dropi nuevas — ejecutar migración SQL primero)`)
      } else {
        throw error
      }
    } else {
      console.log(`  ✓ ${title}`)
    }
  } catch (err) {
    console.error(`  ✗ Error:`, err.message ?? err)
  }
}

async function main() {
  console.log("=== Seed Dropi → Supabase ===")
  for (const id of PRODUCT_IDS) {
    await importProduct(id)
    await new Promise(r => setTimeout(r, 500))
  }
  console.log("\n=== Listo ===")
}

main().catch(console.error)
