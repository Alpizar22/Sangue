import assert from "node:assert/strict"
import { buildPrintfulAddress2, buildPrintfulOrderInput } from "../src/lib/printful.ts"
import type { ShippingAddress } from "../src/types/index.ts"

const base: ShippingAddress = {
  street: " Avenida   Reforma ",
  number: "100",
  colonia: "Centro",
  municipality: "Cuauhtémoc",
  city: "Ciudad de México",
  province: "Ciudad de México",
  postal_code: "06000",
  country: "MX",
}

let passed = 0
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ok — ${name}`) }
  catch (error) { console.error(`FAIL — ${name}`, error); process.exitCode = 1 }
}

check("dirección sin interior conserva colonia", () => {
  assert.equal(buildPrintfulAddress2(base), "Col. Centro")
})
check("dirección con interior conserva interior y colonia", () => {
  assert.equal(buildPrintfulAddress2({ ...base, floor: " 2B " }), "Interior 2B, Col. Centro")
})
check("dirección sin colonia ni interior omite address2", () => {
  assert.equal(buildPrintfulAddress2({ ...base, colonia: undefined }), undefined)
})
check("Printful recibe colonia e interior", () => {
  const result = buildPrintfulOrderInput({
    externalId: "11111111111141118111111111111111",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    customerPhone: "5512345678",
    shippingAddress: { ...base, floor: "2B" },
    items: [{ printful_variant_id: 10, quantity: 1, unit_price: 600 }],
    subtotal: 600,
    shippingCost: 155,
    total: 755,
  })
  assert.equal(result?.recipient.address2, "Interior 2B, Col. Centro")
  assert.equal(result?.external_id, "11111111111141118111111111111111")
})

console.log(`\n${passed} pruebas OK` + (process.exitCode ? " — HAY FALLAS ARRIBA" : ""))
