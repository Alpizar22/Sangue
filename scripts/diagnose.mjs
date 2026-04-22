// Diagnóstico de productos en Supabase
const URL_BASE = "https://rlbgwrxcmvftlmgbmhlh.supabase.co"

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
}

async function query(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

const all = await query("products?select=id,title,category,images,sizes,colors,shein_url&order=created_at.asc")

const oneImage   = all.filter(p => (p.images?.length ?? 0) <= 1)
const noSizes    = all.filter(p => (p.sizes?.length ?? 0) === 0)
const noColors   = all.filter(p => (p.colors?.length ?? 0) === 0)
const noUrl      = all.filter(p => !p.shein_url || p.shein_url === "")
const cjUrls     = all.filter(p => p.shein_url?.includes("cjdropshipping"))
const sheinUrls  = all.filter(p => p.shein_url?.includes("shein"))
const enrichable = all.filter(p =>
  p.shein_url?.includes("shein") &&
  ((p.images?.length ?? 0) <= 1 || (p.sizes?.length ?? 0) === 0)
)

console.log(`\n${"=".repeat(62)}`)
console.log(`DIAGNÓSTICO — Supabase products (${new Date().toLocaleString("es-MX")})`)
console.log(`${"=".repeat(62)}`)
console.log(`Total productos      : ${all.length}`)
console.log(`Con ≤1 imagen        : ${oneImage.length}`)
console.log(`Sin tallas           : ${noSizes.length}`)
console.log(`Sin colores          : ${noColors.length}`)
console.log(`Sin URL              : ${noUrl.length}`)
console.log(`URL de CJDropshipping: ${cjUrls.length}`)
console.log(`URL de Shein         : ${sheinUrls.length}`)
console.log(`Enrichables (Shein + incompletos): ${enrichable.length}`)

console.log(`\n── Primeros 5 productos ────────────────────────────────────`)
all.slice(0, 5).forEach((p, i) => {
  const imgs   = p.images?.length ?? 0
  const sizes  = p.sizes?.length ?? 0
  const colors = p.colors?.length ?? 0
  const src    = p.shein_url?.includes("cjdropshipping") ? "CJ" :
                 p.shein_url?.includes("shein")          ? "Shein" : "—"
  console.log(`\n  [${i + 1}] ${p.title?.slice(0, 58)}`)
  console.log(`      category : ${p.category || "—"}`)
  console.log(`      source   : ${src}`)
  console.log(`      images: ${imgs}  sizes: ${sizes}  colors: ${colors}`)
})

console.log(`\n── 5 productos con URL de Shein ────────────────────────────`)
sheinUrls.slice(0, 5).forEach((p, i) => {
  console.log(`  [${i+1}] ${p.title?.slice(0,55)} | imgs:${p.images?.length ?? 0} sizes:${p.sizes?.length ?? 0}`)
  console.log(`       ${p.shein_url?.slice(0, 70)}`)
})
console.log(`${"=".repeat(62)}\n`)
