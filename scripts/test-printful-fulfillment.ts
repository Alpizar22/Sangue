import assert from "node:assert/strict"
import {
  buildBlockedFulfillmentUpdate,
  preparePrintfulFulfillment,
  type PrintfulProductInfo,
  type StoredFulfillmentItem,
} from "../src/lib/printfulVariant.ts"

const PRODUCT_MAP: Record<string, PrintfulProductInfo> = {
  shirt: {
    printful_variant_id: 101,
    printful_variant_map: { "White|S": 101, "White|M": 102 },
  },
  hoodie: {
    printful_variant_id: 201,
    printful_variant_map: { "Black|L": 203 },
  },
}

function item(
  product_id: string,
  color: string,
  size: string,
  quantity = 1
): StoredFulfillmentItem {
  return { product_id, color, size, quantity, unit_price: 500 }
}

let passed = 0
function check(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ok  — ${name}`)
  } catch (error) {
    console.error(`FAIL — ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

check("pedido de un artículo válido prepara ese artículo para Printful", () => {
  const result = preparePrintfulFulfillment([item("shirt", "White", "S")], PRODUCT_MAP)
  assert.deepEqual(result, {
    ok: true,
    items: [{ printful_variant_id: 101, quantity: 1, unit_price: 500 }],
  })
})

check("pedido de varios artículos válidos prepara todos", () => {
  const result = preparePrintfulFulfillment(
    [item("shirt", "White", "M", 2), item("hoodie", "Black", "L")],
    PRODUCT_MAP
  )
  assert.equal(result.ok, true)
  assert.deepEqual(result.items, [
    { printful_variant_id: 102, quantity: 2, unit_price: 500 },
    { printful_variant_id: 203, quantity: 1, unit_price: 500 },
  ])
})

check("pedido mixto se bloquea y no prepara ningún artículo", () => {
  const result = preparePrintfulFulfillment(
    [item("shirt", "White", "S"), item("hoodie", "Black", "XL")],
    PRODUCT_MAP
  )
  assert.equal(result.ok, false)
  assert.deepEqual(result.items, [])
  if (result.ok) return
  assert.equal(result.errors.length, 1)
  assert.equal(result.errors[0].product, "hoodie")
})

check("pedido con todos los artículos inválidos se bloquea por completo", () => {
  const result = preparePrintfulFulfillment(
    [item("shirt", "Red", "S"), item("missing", "Black", "L")],
    PRODUCT_MAP
  )
  assert.equal(result.ok, false)
  assert.deepEqual(result.items, [])
  if (result.ok) return
  assert.equal(result.errors.length, 2)
})

check("notes registra producto, color, talla y motivo de cada fallo", () => {
  const result = preparePrintfulFulfillment(
    [item("shirt", "Red", "S"), item("missing", "Black", "L")],
    PRODUCT_MAP
  )
  assert.equal(result.ok, false)
  if (result.ok) return

  assert.match(result.notes, /^\[PRINTFUL_FULFILLMENT_BLOCKED\] /)
  const payload = JSON.parse(result.notes.replace(/^\[PRINTFUL_FULFILLMENT_BLOCKED\] /, ""))
  assert.deepEqual(
    payload.errors.map((error: { product: string; color: string; size: string }) => ({
      product: error.product,
      color: error.color,
      size: error.size,
    })),
    [
      { product: "shirt", color: "Red", size: "S" },
      { product: "missing", color: "Black", size: "L" },
    ]
  )
  assert.ok(payload.errors.every((error: { reason?: string }) => error.reason))
})

check("bloqueo conserva processing, vacía supplier_order_id y añade notes", () => {
  const preparation = preparePrintfulFulfillment(
    [item("shirt", "White", "S"), item("hoodie", "Black", "XL")],
    PRODUCT_MAP
  )
  assert.equal(preparation.ok, false)
  if (preparation.ok) return

  const update = buildBlockedFulfillmentUpdate("Nota original", preparation)
  assert.equal(update.status, "processing")
  assert.equal(update.supplier_order_id, null)
  assert.match(update.notes, /^Nota original\n\[PRINTFUL_FULFILLMENT_BLOCKED\] /)
})

check("un reintento del webhook no duplica el mismo bloque en notes", () => {
  const preparation = preparePrintfulFulfillment(
    [item("shirt", "White", "S"), item("hoodie", "Black", "XL")],
    PRODUCT_MAP
  )
  assert.equal(preparation.ok, false)
  if (preparation.ok) return

  const firstUpdate = buildBlockedFulfillmentUpdate("Nota original", preparation)
  const retryUpdate = buildBlockedFulfillmentUpdate(firstUpdate.notes, preparation)
  assert.equal(retryUpdate.notes, firstUpdate.notes)
  assert.equal(
    retryUpdate.notes.match(/\[PRINTFUL_FULFILLMENT_BLOCKED\]/g)?.length,
    1
  )
})

console.log(`\n${passed} pruebas OK` + (process.exitCode ? " — HAY FALLAS ARRIBA" : ""))
