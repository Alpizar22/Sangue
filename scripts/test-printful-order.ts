import assert from "node:assert/strict"
import {
  buildPrintfulFailureEventUpdate,
  buildPrintfulOrderInput,
  PrintfulApiError,
  resolvePrintfulSyncItems,
  type PrintfulSyncProductDetail,
} from "../src/lib/printful.ts"

const SYNC_PRODUCT: PrintfulSyncProductDetail = {
  sync_product: {
    id: 453828047,
    external_id: "product-external-id",
    name: "Essential Garment Tee.",
    variants: 2,
    synced: 1,
    thumbnail_url: null,
  },
  sync_variants: [
    {
      id: 5424423576,
      external_id: null,
      sync_product_id: 453828047,
      name: "Essential Garment Tee. / L",
      synced: true,
      variant_id: 15126,
      retail_price: "390.00",
      currency: "MXN",
      size: "L",
      color: "White",
      files: [],
      product: { variant_id: 15126, product_id: 0, image: "", name: "Tee" },
    },
    {
      id: 5424423577,
      external_id: null,
      sync_product_id: 453828047,
      name: "Essential Garment Tee. / XL",
      synced: false,
      variant_id: 15127,
      retail_price: "390.00",
      currency: "MXN",
      size: "XL",
      color: "White",
      files: [],
      product: { variant_id: 15127, product_id: 0, image: "", name: "Tee" },
    },
  ],
}

const candidate = (catalogVariantId: number) => ({
  product_id: "product-1",
  printful_product_id: 453828047,
  catalog_variant_id: catalogVariantId,
  quantity: 1,
  unit_price: 390,
})

let passed = 0
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    passed++
    console.log(`  ok  — ${name}`)
  } catch (error) {
    console.error(`FAIL — ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

async function main() {
await check("producto sincronizado válido usa el sync_variant_id correspondiente", async () => {
  const result = await resolvePrintfulSyncItems([candidate(15126)], async () => SYNC_PRODUCT)
  assert.deepEqual(result, {
    ok: true,
    items: [{ sync_variant_id: 5424423576, quantity: 1, unit_price: 390 }],
  })
})

await check("sync_variant_id inexistente bloquea todos los items", async () => {
  const result = await resolvePrintfulSyncItems([candidate(99999)], async () => SYNC_PRODUCT)
  assert.equal(result.ok, false)
  assert.deepEqual(result.items, [])
  if (result.ok) return
  assert.equal(result.errors[0].reason, "sync_variant_not_found")
})

await check("variante no sincronizada queda bloqueada", async () => {
  const result = await resolvePrintfulSyncItems([candidate(15127)], async () => SYNC_PRODUCT)
  assert.equal(result.ok, false)
  assert.deepEqual(result.items, [])
  if (result.ok) return
  assert.equal(result.errors[0].reason, "sync_variant_not_synced")
})

await check("body usa sync_variant_id y omite variant_id y retail_costs.total", () => {
  const body = buildPrintfulOrderInput({
    externalId: "38899c8abaff4528a97b818b9d4bc3a5",
    customerName: "Cliente",
    customerEmail: "cliente@example.com",
    customerPhone: "3312345678",
    shippingAddress: {
      street: "Cerrada del sol",
      number: "299",
      colonia: "Cortijo San Agustín",
      city: "Tlajomulco de Zúñiga",
      municipality: "Tlajomulco de Zúñiga",
      province: "JAL",
      postal_code: "45645",
      country: "MX",
    },
    items: [{ sync_variant_id: 5424423576, quantity: 1, unit_price: 390 }],
    subtotal: 390,
    shippingCost: 155,
  })
  assert.ok(body)
  assert.equal(body.external_id, "38899c8abaff4528a97b818b9d4bc3a5")
  assert.deepEqual(body.items, [
    { sync_variant_id: 5424423576, quantity: 1, retail_price: "390.00" },
  ])
  assert.equal("variant_id" in body.items[0], false)
  assert.equal("total" in (body.retail_costs ?? {}), false)
})

await check("error HTTP 400 de Printful produce detalle persistible y sanitizado", () => {
  const update = buildPrintfulFailureEventUpdate(
    new PrintfulApiError(
      "Printful POST /orders?confirm=1 error 400: Item 0: Item can't be submitted without any print files",
      400
    ),
    "38899c8abaff4528a97b818b9d4bc3a5"
  )
  assert.deepEqual(update, {
    status: "printful_failed",
    detail: {
      external_id: "38899c8abaff4528a97b818b9d4bc3a5",
      http_status: 400,
      message: "Printful POST /orders?confirm=1 error 400: Item 0: Item can't be submitted without any print files",
    },
  })
  assert.doesNotMatch(JSON.stringify(update), /authorization|bearer|api[_-]?key/i)
})

console.log(`\n${passed} pruebas OK` + (process.exitCode ? " — HAY FALLAS ARRIBA" : ""))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
