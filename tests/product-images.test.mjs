import assert from "node:assert/strict"
import test from "node:test"
import { getDisplayImages, mergeImageUrls } from "../src/lib/presentation.ts"

test("prioriza editoriales y conserva después las imágenes del producto", () => {
  assert.deepEqual(
    getDisplayImages({
      editorial_images: ["https://example.com/editorial-1.jpg", "https://example.com/editorial-2.jpg"],
      images: ["https://example.com/printful-1.jpg", "https://example.com/printful-2.jpg"],
    }),
    [
      "https://example.com/editorial-1.jpg",
      "https://example.com/editorial-2.jpg",
      "https://example.com/printful-1.jpg",
      "https://example.com/printful-2.jpg",
    ],
  )
})

test("deduplica URLs entre fuentes y descarta valores vacíos", () => {
  assert.deepEqual(
    getDisplayImages({
      editorial_images: [" https://example.com/main.jpg ", ""],
      images: ["https://example.com/main.jpg", "https://example.com/detail.jpg"],
    }),
    ["https://example.com/main.jpg", "https://example.com/detail.jpg"],
  )
})

test("usa las imágenes del producto como fallback", () => {
  assert.deepEqual(
    getDisplayImages({ editorial_images: null, images: ["https://example.com/product.jpg"] }),
    ["https://example.com/product.jpg"],
  )
  assert.deepEqual(getDisplayImages({ editorial_images: null, images: [] }), [])
})

test("ordena thumbnail_url antes de product.image", () => {
  assert.deepEqual(
    mergeImageUrls(
      ["https://printful.example/mockup.jpg"],
      ["https://printful.example/catalog.jpg", "https://printful.example/mockup.jpg"],
    ),
    ["https://printful.example/mockup.jpg", "https://printful.example/catalog.jpg"],
  )
})
