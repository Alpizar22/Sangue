// Validación reproducible de src/lib/printfulVariant.ts — resolución del
// variant_id de Printful exacto por color+talla, con foco en el caso real
// en producción (Men's heavyweight long sleeve t-shirt, color White).
//
// Correr con:  node scripts/test-printful-variant.ts
// (Node 24+ ejecuta TypeScript nativo, sin build ni dependencias nuevas.)

import assert from "node:assert/strict"
import { resolvePrintfulVariant } from "../src/lib/printfulVariant.ts"

let passed = 0
function check(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ok  — ${name}`)
  } catch (err) {
    console.error(`FAIL — ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

// Mapa real tomado de Supabase para el producto en producción
// (printful_product_id 453792223 — Men's heavyweight long sleeve t-shirt).
const REAL_VARIANT_MAP: Record<string, number> = {
  "White|S": 24432,
  "White|M": 24427,
  "White|L": 24437,
  "White|XL": 24442,
  "White|2XL": 24447,
  "White|3XL": 24452,
}
const REAL_VARIANT_ID_FALLBACK = 24432 // el valor guardado hoy como printful_variant_id (S)

console.log("== Casos requeridos: White + S / M / L ==")

check("White + S resuelve por mapa exacto → 24432", () => {
  const r = resolvePrintfulVariant({
    color: "White",
    size: "S",
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.deepEqual(r, { ok: true, variantId: 24432, resolvedBy: "map" })
})

check("White + M resuelve por mapa exacto → 24427", () => {
  const r = resolvePrintfulVariant({
    color: "White",
    size: "M",
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.deepEqual(r, { ok: true, variantId: 24427, resolvedBy: "map" })
})

check("White + L resuelve por mapa exacto → 24437", () => {
  const r = resolvePrintfulVariant({
    color: "White",
    size: "L",
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.deepEqual(r, { ok: true, variantId: 24437, resolvedBy: "map" })
})

console.log("== Normalización (espacios / mayúsculas) ==")

check('"  white " + " s " (espacios/mayúsculas) sigue resolviendo a 24432 vía normalización', () => {
  const r = resolvePrintfulVariant({
    color: "  white ",
    size: " s ",
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.equal(r.ok, true)
  assert.equal((r as { variantId: number }).variantId, 24432)
  assert.equal((r as { resolvedBy: string }).resolvedBy, "map")
})

check("los valores originales del mapa no se alteran al normalizar", () => {
  const mapCopy = { ...REAL_VARIANT_MAP }
  resolvePrintfulVariant({
    color: "WHITE",
    size: "s",
    printfulVariantMap: mapCopy,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.deepEqual(mapCopy, REAL_VARIANT_MAP)
})

console.log("== 1) Mapa existente + combinación inválida → error duro (SIN fallback) ==")

check("talla fuera del mapa (5XL) con mapa poblado → ok:false, NO usa printful_variant_id", () => {
  const r = resolvePrintfulVariant({
    color: "White",
    size: "5XL", // no existe en REAL_VARIANT_MAP
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.equal(r.ok, false)
  assert.ok((r as { error?: string }).error, "debe incluir un error explícito")
  assert.equal((r as { variantId?: number }).variantId, undefined, "no debe incluir variantId cuando falla")
})

check("color fuera del mapa (Negro, mapa solo tiene White) → ok:false, NO usa printful_variant_id", () => {
  const r = resolvePrintfulVariant({
    color: "Negro",
    size: "M",
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.equal(r.ok, false)
})

check("item sin color/talla pero con mapa poblado → ok:false, NO usa printful_variant_id", () => {
  const r = resolvePrintfulVariant({
    color: null,
    size: null,
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: REAL_VARIANT_ID_FALLBACK,
  })
  assert.equal(r.ok, false)
})

check("combinación fuera del mapa y además sin printful_variant_id → ok:false igual", () => {
  const r = resolvePrintfulVariant({
    color: "White",
    size: "5XL",
    printfulVariantMap: REAL_VARIANT_MAP,
    printfulVariantId: null,
  })
  assert.equal(r.ok, false)
})

console.log("== 2) Mapa inexistente + printful_variant_id válido → fallback correcto ==")

check("printful_variant_map ausente (undefined) usa printful_variant_id como fallback", () => {
  const r = resolvePrintfulVariant({
    color: "Negro",
    size: "M",
    printfulVariantMap: undefined,
    printfulVariantId: 999,
  })
  assert.deepEqual(r, { ok: true, variantId: 999, resolvedBy: "fallback-no-map" })
})

check("printful_variant_map null usa printful_variant_id como fallback", () => {
  const r = resolvePrintfulVariant({
    color: "Negro",
    size: "M",
    printfulVariantMap: null,
    printfulVariantId: 999,
  })
  assert.deepEqual(r, { ok: true, variantId: 999, resolvedBy: "fallback-no-map" })
})

console.log("== 3) Mapa vacío ({}) + printful_variant_id válido → fallback correcto ==")

check("printful_variant_map = {} se trata igual que ausente y usa el fallback", () => {
  const r = resolvePrintfulVariant({
    color: "Negro",
    size: "M",
    printfulVariantMap: {},
    printfulVariantId: 999,
  })
  assert.deepEqual(r, { ok: true, variantId: 999, resolvedBy: "fallback-no-map" })
})

console.log("== Falla dura sin ninguna fuente ==")

check("sin mapa y sin printful_variant_id → ok:false", () => {
  const r = resolvePrintfulVariant({
    color: "Negro",
    size: "M",
    printfulVariantMap: null,
    printfulVariantId: null,
  })
  assert.equal(r.ok, false)
})

console.log(`\n${passed} pruebas OK` + (process.exitCode ? " — HAY FALLAS ARRIBA" : ""))
