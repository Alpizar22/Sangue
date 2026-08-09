import assert from "node:assert/strict"
import test from "node:test"
import {
  getColorImageIndex,
  getDisplayImages,
  getProductGalleryImages,
  mergeImageUrls,
} from "../src/lib/presentation.ts"
import { buildPrintfulColorImages } from "../src/lib/productImages.ts"

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

test("deduplica el thumbnail principal de Printful aunque cambien sus parámetros", () => {
  assert.deepEqual(
    mergeImageUrls(
      ["https://files.cdn.printful.com/mockup/main.png?width=1000"],
      ["https://files.cdn.printful.com/mockup/main.png?width=300"],
    ),
    ["https://files.cdn.printful.com/mockup/main.png?width=1000"],
  )
})

test("agrupa por color y prefiere preview comercial sobre product.image", () => {
  assert.deepEqual(
    buildPrintfulColorImages([
      {
        color: "Moss",
        files: [
          { type: "sleeve_left", preview_url: "https://example.com/technical.png" },
          { type: "preview", preview_url: "https://example.com/moss-mockup.png" },
        ],
        product: { image: "https://example.com/moss-product.jpg" },
      },
      {
        color: "Grey",
        files: [{ type: "label_inside", preview_url: "https://example.com/label.png" }],
        product: { image: "https://example.com/grey-product.jpg" },
      },
    ]),
    {
      Moss: "https://example.com/moss-mockup.png",
      Grey: "https://example.com/grey-product.jpg",
    },
  )
})

test("selecciona la imagen explícita del color y usa fallback si falta", () => {
  const product = {
    editorial_images: ["https://example.com/editorial.jpg"],
    images: ["https://example.com/main.jpg"],
    color_images: { Moss: "https://example.com/moss.jpg" },
  }

  assert.equal(getColorImageIndex(product, "Moss"), 2)
  assert.equal(getColorImageIndex(product, "Ivory"), 0)
})

test("la galería mantiene editoriales primero y deduplica imágenes de color", () => {
  assert.deepEqual(
    getProductGalleryImages({
      editorial_images: ["https://example.com/editorial.jpg"],
      images: ["https://example.com/main.jpg", "https://example.com/editorial.jpg"],
      color_images: {
        White: "https://example.com/main.jpg",
        Moss: "https://example.com/moss.jpg",
      },
    }),
    [
      "https://example.com/editorial.jpg",
      "https://example.com/main.jpg",
      "https://example.com/moss.jpg",
    ],
  )
})
