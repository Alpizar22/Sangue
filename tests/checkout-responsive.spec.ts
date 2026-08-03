import { test, expect } from "@playwright/test"

const product = {
  id: "11111111-1111-4111-8111-111111111111",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  shein_product_id: "printful_test",
  shein_url: "https://example.invalid",
  title: "Pieza de prueba visual",
  description: null,
  images: [],
  original_price: 600,
  sale_price: 600,
  cost_price: 250,
  stock: 99,
  category: "theia",
  tags: ["printful"],
  sizes: ["S"],
  colors: ["White"],
  status: "active",
  shein_sku: null,
  markup_percentage: 100,
  source: "printful",
  color_sizes: { White: ["S"] },
  printful_variant_map: { "White|S": 10 },
}

async function seedCart(page: import("@playwright/test").Page) {
  await page.goto("/carrito")
  await page.evaluate((fixture) => {
    localStorage.setItem("theia-cart", JSON.stringify({
      state: {
        items: [{ product_id: fixture.id, product: fixture, quantity: 1, size: "S", color: "White" }],
      },
      version: 0,
    }))
  }, product)
}

for (const width of [320, 375, 390, 430, 1440]) {
  test(`checkout sin overflow a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await seedCart(page)
    await page.route("**/api/cp?cp=06000", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          municipio: "Cuauhtémoc",
          estado: "Ciudad de México",
          ciudad: "Ciudad de México",
          colonias: ["Centro", "Alameda", "Centro"],
        }),
      })
    })
    await page.goto("/checkout")
    await expect(page.getByRole("heading", { name: "Finalizar compra" })).toBeVisible()
    await page.getByLabel(/Código Postal/i).fill("06000")
    await expect(page.getByText(/Código postal encontrado/i)).toBeVisible()
    await expect(page.getByLabel(/Municipio o alcaldía/i)).toHaveValue("Cuauhtémoc")
    await expect(page.locator("select[name=colonia] option")).toHaveCount(4)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    if (width < 640) {
      const first = await page.getByLabel(/^Nombre/i).boundingBox()
      const last = await page.getByLabel(/^Apellido/i).boundingBox()
      expect(first?.y).not.toBe(last?.y)
    }
    await page.screenshot({ path: `.next/visual-review/checkout-${width}.png`, fullPage: true })
  })
}

test("una respuesta postal anterior no sobrescribe el CP nuevo", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await seedCart(page)
  await page.route("**/api/cp?cp=06000", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900))
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ municipio: "Viejo", estado: "Viejo", ciudad: "Viejo", colonias: ["Vieja"] }) })
  })
  await page.route("**/api/cp?cp=44100", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ municipio: "Guadalajara", estado: "Jalisco", ciudad: "Guadalajara", colonias: ["Centro"] }) })
  })
  await page.goto("/checkout")
  const postalCode = page.getByLabel(/Código Postal/i)
  await postalCode.fill("06000")
  await page.waitForTimeout(500)
  await postalCode.fill("44100")
  await expect(page.getByLabel(/Municipio o alcaldía/i)).toHaveValue("Guadalajara")
  await page.waitForTimeout(1000)
  await expect(page.getByLabel(/Municipio o alcaldía/i)).toHaveValue("Guadalajara")
})

test("CP sin ciudad usa municipio y permite una colonia", async ({ page }) => {
  await seedCart(page)
  await page.route("**/api/cp?cp=01000", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ municipio: "Álvaro Obregón", estado: "Ciudad de México", ciudad: "", colonias: ["San Ángel"] }),
  }))
  await page.goto("/checkout")
  await page.getByLabel(/Código Postal/i).fill("01000")
  await expect(page.getByLabel(/^Ciudad/i)).toHaveValue("Álvaro Obregón")
  await expect(page.locator("select[name=colonia] option")).toHaveCount(3)
})

test("CP no encontrado mantiene captura manual", async ({ page }) => {
  await seedCart(page)
  await page.route("**/api/cp?cp=99999", (route) => route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "postal_code_not_found" } }) }))
  await page.goto("/checkout")
  await page.getByLabel(/Código Postal/i).fill("99999")
  await expect(page.getByText(/No encontramos el CP/i)).toBeVisible()
  await page.getByLabel(/^Ciudad/i).fill("Ciudad manual")
  await page.locator("input[name=colonia]").fill("Colonia manual")
})

test("proveedor postal caído no bloquea captura manual", async ({ page }) => {
  await seedCart(page)
  await page.route("**/api/cp?cp=88888", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "postal_provider_unavailable" } }) }))
  await page.goto("/checkout")
  await page.getByLabel(/Código Postal/i).fill("88888")
  await expect(page.getByText(/servicio postal no está disponible/i)).toBeVisible()
  await page.getByLabel(/Municipio o alcaldía/i).fill("Municipio manual")
  await expect(page.getByLabel(/Municipio o alcaldía/i)).toHaveValue("Municipio manual")
})

test("seguimiento apila controles y conserva foco visible en móvil", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  const response = await page.goto("/ayuda/seguimiento")
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer")
  const input = page.getByLabel("Referencia segura")
  const button = page.getByRole("button", { name: "Consultar" })
  const inputBox = await input.boundingBox()
  const buttonBox = await button.boundingBox()
  expect(buttonBox!.y).toBeGreaterThan(inputBox!.y)
  for (let index = 0; index < 12 && !(await input.evaluate((element) => element === document.activeElement)); index++) {
    await page.keyboard.press("Tab")
  }
  await expect(input).toBeFocused()
  const outlineStyle = await input.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outlineStyle).not.toBe("none")
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
})

test("la página pública de pedido no propaga el token como referrer", async ({ request }) => {
  const response = await request.get(
    "/pedidos/11111111-1111-4111-8111-111111111111?token=invalid-test-token"
  )
  expect(response.headers()["referrer-policy"]).toBe("no-referrer")
})

test("login administrativo limita intentos y emite una cookie segura", async ({ request }) => {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await request.post("/api/admin/auth", {
      headers: { "x-forwarded-for": "203.0.113.20" },
      data: { password: "incorrecta" },
    })
    expect(response.status()).toBe(401)
  }
  const limited = await request.post("/api/admin/auth", {
    headers: { "x-forwarded-for": "203.0.113.20" },
    data: { password: "incorrecta" },
  })
  expect(limited.status()).toBe(429)
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0)

  const successful = await request.post("/api/admin/auth", {
    headers: { "x-forwarded-for": "203.0.113.21" },
    data: { password: "playwright-test-only-password" },
  })
  expect(successful.status()).toBe(200)
  const cookie = successful.headers()["set-cookie"] ?? ""
  expect(cookie).toMatch(/admin_session=/)
  expect(cookie).toMatch(/HttpOnly/i)
  expect(cookie).toMatch(/Secure/i)
  expect(cookie).toMatch(/SameSite=Lax/i)
  expect(cookie).toMatch(/Max-Age=604800/i)
})

test("scraping exige sesión válida antes de usar privilegios administrativos", async ({ request }) => {
  const withoutSession = await request.post("/api/scraping/start", {
    data: { url: "invalid" },
  })
  expect(withoutSession.status()).toBe(401)

  const invalidSession = await request.post("/api/scraping/start", {
    headers: { Cookie: "admin_session=invalid" },
    data: { url: "invalid" },
  })
  expect(invalidSession.status()).toBe(401)

  const login = await request.post("/api/admin/auth", {
    headers: { "x-forwarded-for": "203.0.113.22" },
    data: { password: "playwright-test-only-password" },
  })
  const cookie = (login.headers()["set-cookie"] ?? "").split(";", 1)[0]
  expect(cookie).toMatch(/^admin_session=/)
  const authorized = await request.post("/api/scraping/start", {
    headers: { Cookie: cookie },
    data: { url: "invalid" },
  })
  expect(authorized.status()).toBe(400)
})
