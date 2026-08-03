import assert from "node:assert/strict"
import {
  buildAuthoritativeCart,
  MAX_ITEM_QUANTITY,
  parseCheckoutBody,
  SHIPPING_COST_MXN,
  type AuthoritativeProduct,
} from "../src/lib/checkout.ts"

const ID_A = "11111111-1111-4111-8111-111111111111"
const ID_B = "22222222-2222-4222-8222-222222222222"

const products: AuthoritativeProduct[] = [
  {
    id: ID_A,
    title: "Nombre real",
    display_name: "Luz I",
    sale_price: 600,
    cost_price: 250,
    status: "active",
    source: "printful",
    stock: 99,
    colors: ["White"],
    sizes: ["S", "M"],
    color_sizes: { White: ["S", "M"] },
    printful_variant_map: { "White|S": 10, "White|M": 11 },
  },
  {
    id: ID_B,
    title: "Segunda pieza",
    sale_price: 400,
    cost_price: 180,
    status: "active",
    source: "printful",
    stock: 99,
    colors: ["Black"],
    sizes: ["L"],
    color_sizes: { Black: ["L"] },
    printful_variant_map: { "Black|L": 20 },
  },
]

function body(items: unknown[]) {
  return {
    items,
    customer: { name: "Ada Lovelace", email: "ada@example.com", phone: "5512345678" },
    shipping_address: {
      street: "Avenida Reforma",
      number: "100",
      floor: "2B",
      colonia: "Centro",
      municipality: "Cuauhtémoc",
      city: "Ciudad de México",
      province: "Ciudad de México",
      postal_code: "06000",
      country: "MX",
    },
  }
}

function validItem(product_id = ID_A, quantity = 1, color = "White", size = "S") {
  return { product_id, quantity, color, size, product: { sale_price: 1, title: "Manipulado" } }
}

let passed = 0
function check(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ok — ${name}`)
  } catch (error) {
    console.error(`FAIL — ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

check("producto válido usa precio y nombre autoritativos", () => {
  const parsed = parseCheckoutBody(body([validItem()]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const result = buildAuthoritativeCart(parsed.value.items, products)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.items[0].unit_price, 600)
  assert.equal(result.items[0].title, "Luz I")
})

check("precio y nombre manipulados del navegador se ignoran", () => {
  const parsed = parseCheckoutBody(body([{ ...validItem(), product: { sale_price: 0.01, title: "Gratis" } }]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const result = buildAuthoritativeCart(parsed.value.items, products)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.subtotal, 600)
  assert.equal(result.items[0].title, "Luz I")
})

for (const [name, quantity] of [
  ["cantidad cero", 0],
  ["cantidad negativa", -1],
  ["cantidad decimal", 1.5],
  ["cantidad excesiva", MAX_ITEM_QUANTITY + 1],
] as const) {
  check(`${name} se rechaza`, () => assert.equal(parseCheckoutBody(body([validItem(ID_A, quantity)])).ok, false))
}

check("producto inexistente se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem("33333333-3333-4333-8333-333333333333")]))
  assert.equal(parsed.ok, true)
  if (parsed.ok) assert.equal(buildAuthoritativeCart(parsed.value.items, products).ok, false)
})

check("producto inactivo se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem()]))
  assert.equal(parsed.ok, true)
  if (parsed.ok) assert.equal(buildAuthoritativeCart(parsed.value.items, [{ ...products[0], status: "inactive" }]).ok, false)
})

check("producto sin disponibilidad se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem()]))
  assert.equal(parsed.ok, true)
  if (parsed.ok) assert.equal(buildAuthoritativeCart(parsed.value.items, [{ ...products[0], stock: 0 }]).ok, false)
})

check("talla sin disponibilidad se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem()]))
  assert.equal(parsed.ok, true)
  if (parsed.ok) assert.equal(buildAuthoritativeCart(parsed.value.items, [{ ...products[0], size_stock: { S: 0 } }]).ok, false)
})

check("sale_price cero se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem()]))
  assert.equal(parsed.ok, true)
  if (parsed.ok) assert.equal(buildAuthoritativeCart(parsed.value.items, [{ ...products[0], sale_price: 0 }]).ok, false)
})

check("color inválido se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 1, "Red", "S")]))
  assert.equal(parsed.ok, true)
  if (parsed.ok) assert.equal(buildAuthoritativeCart(parsed.value.items, products).ok, false)
})

check("talla inválida se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 1, "White", "XL")]))
  assert.equal(parsed.ok, true)
  if (parsed.ok) assert.equal(buildAuthoritativeCart(parsed.value.items, products).ok, false)
})

check("combinación color+talla fuera del mapa se rechaza", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 1, "White", "M")]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const altered = [{ ...products[0], printful_variant_map: { "White|S": 10 } }]
  assert.equal(buildAuthoritativeCart(parsed.value.items, altered).ok, false)
})

check("subtotal, envío y total se calculan en servidor", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 2), validItem(ID_B, 1, "Black", "L")]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const result = buildAuthoritativeCart(parsed.value.items, products)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.items.length, 2)
  assert.equal(result.subtotal, 1600)
  assert.equal(result.shippingCost, SHIPPING_COST_MXN)
  assert.equal(result.total, 1755)
})

check("dos líneas iguales válidas se agregan en una sola variante", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 2), validItem(ID_A, 3)]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const result = buildAuthoritativeCart(parsed.value.items, products)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].quantity, 5)
  assert.equal(result.subtotal, 3000)
})

check("dos líneas iguales que juntas exceden stock se rechazan", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 3), validItem(ID_A, 3)]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.equal(buildAuthoritativeCart(parsed.value.items, [{ ...products[0], stock: 5 }]).ok, false)
})

check("dos líneas iguales que juntas exceden size_stock se rechazan", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 2), validItem(ID_A, 2)]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.equal(buildAuthoritativeCart(parsed.value.items, [{ ...products[0], size_stock: { S: 3, M: 99 } }]).ok, false)
})

check("dos líneas iguales que juntas exceden el límite por variante se rechazan", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 6), validItem(ID_A, 5)]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.equal(buildAuthoritativeCart(parsed.value.items, products).ok, false)
})

check("el mismo producto con distinta talla conserva dos variantes", () => {
  const parsed = parseCheckoutBody(body([validItem(ID_A, 2, "White", "S"), validItem(ID_A, 3, "White", "M")]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const result = buildAuthoritativeCart(parsed.value.items, products)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.items.length, 2)
  assert.deepEqual(result.items.map((item) => item.size), ["S", "M"])
})

check("el mismo producto con distinto color conserva dos variantes", () => {
  const productWithColors: AuthoritativeProduct = {
    ...products[0],
    colors: ["White", "Black"],
    color_sizes: { White: ["S", "M"], Black: ["S", "M"] },
    printful_variant_map: { "White|S": 10, "White|M": 11, "Black|S": 12, "Black|M": 13 },
  }
  const parsed = parseCheckoutBody(body([validItem(ID_A, 1, "White", "S"), validItem(ID_A, 1, "Black", "S")]))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  const result = buildAuthoritativeCart(parsed.value.items, [productWithColors])
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.items.length, 2)
  assert.deepEqual(result.items.map((item) => item.color), ["White", "Black"])
})

console.log(`\n${passed} pruebas OK` + (process.exitCode ? " — HAY FALLAS ARRIBA" : ""))
