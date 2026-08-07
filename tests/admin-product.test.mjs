import assert from "node:assert/strict"
import test from "node:test"
import { parseAdminProductForm, parseEditorialImages } from "../src/lib/adminProduct.ts"

function validForm(overrides = {}) {
  const values = {
    title: "Playera esencial",
    description: "Algodón",
    category: "Tops",
    cost_price: "200",
    original_price: "600",
    sale_price: "500",
    status: "active",
    sort_order: "3",
    featured: "on",
    ...overrides,
  }
  const form = new FormData()
  for (const [key, value] of Object.entries(values)) form.set(key, value)
  return form
}

test("normaliza un producto administrativo válido", () => {
  const result = parseAdminProductForm(validForm())
  assert.deepEqual(result, {
    ok: true,
    value: {
      title: "Playera esencial",
      description: "Algodón",
      category: "Tops",
      cost_price: 200,
      original_price: 600,
      sale_price: 500,
      status: "active",
      sort_order: 3,
      featured: true,
    },
  })
})

test("rechaza estados y órdenes fuera del dominio", () => {
  assert.equal(parseAdminProductForm(validForm({ status: "published" })).ok, false)
  assert.equal(parseAdminProductForm(validForm({ sort_order: "-1" })).ok, false)
  assert.equal(parseAdminProductForm(validForm({ sort_order: "1.5" })).ok, false)
})

test("rechaza precios inválidos", () => {
  assert.equal(parseAdminProductForm(validForm({ cost_price: "NaN" })).ok, false)
  assert.equal(parseAdminProductForm(validForm({ original_price: "0" })).ok, false)
  assert.equal(parseAdminProductForm(validForm({ sale_price: "-10" })).ok, false)
})

test("acepta, deduplica y limita imágenes editoriales HTTPS", () => {
  assert.deepEqual(
    parseEditorialImages("https://example.com/a.jpg\nhttps://example.com/a.jpg\nhttps://example.com/b.webp"),
    ["https://example.com/a.jpg", "https://example.com/b.webp"],
  )
  assert.throws(() => parseEditorialImages("http://example.com/a.jpg"), /HTTPS/)
  assert.throws(() => parseEditorialImages("no-es-url"), /inválida/)
  assert.throws(
    () => parseEditorialImages(Array.from({ length: 21 }, (_, index) => `https://example.com/${index}.jpg`).join("\n")),
    /hasta 20/,
  )
})
