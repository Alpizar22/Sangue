/**
 * Shein Scraper — usa Playwright para extraer productos del catálogo.
 * Solo ejecutar desde rutas API o scripts de servidor, nunca en el cliente.
 *
 * REQUISITO DE RED: Shein bloquea IPs de datacenter en la capa de red.
 * Configurar SCRAPER_PROXY_URL=http://user:pass@host:port en .env.local
 * con un proxy residencial (Brightdata, Oxylabs, Smartproxy, etc.).
 *
 * Opcional: exportar cookies reales de Shein en un browser y guardarlas en
 * SCRAPER_COOKIES_PATH para que el scraper arranque con sesión válida.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright"
import * as fs from "fs"
import type { Product } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SheinRawProduct {
  shein_product_id: string
  shein_url: string
  title: string
  description: string | null
  images: string[]
  original_price: number
  sizes: string[]
  colors: string[]
  category: string
  shein_sku: string | null
}

export type ScraperResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "blocked" | "timeout" | "empty" | "error"; message: string }

// ─── User-agents reales de Chrome ────────────────────────────────────────────

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
]

// ─── Singleton de navegador ───────────────────────────────────────────────────

let browser: Browser | null = null
let context: BrowserContext | null = null

async function getBrowserContext(): Promise<BrowserContext> {
  if (!browser?.isConnected()) {
    const proxyUrl = process.env.SCRAPER_PROXY_URL
    let proxyConfig: { server: string; username?: string; password?: string } | undefined
    if (proxyUrl) {
      try {
        const u = new URL(proxyUrl)
        proxyConfig = {
          server: `${u.protocol}//${u.hostname}:${u.port}`,
          username: u.username ? decodeURIComponent(u.username) : undefined,
          password: u.password ? decodeURIComponent(u.password) : undefined,
        }
        console.log(`[shein-scraper] Proxy server: ${proxyConfig.server}, user: ${proxyConfig.username}`)
      } catch {
        proxyConfig = { server: proxyUrl }
      }
    }
    browser = await chromium.launch({
      headless: true,
      proxy: proxyConfig,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-dev-shm-usage",
        "--disable-infobars",
        "--disable-extensions",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--ignore-certificate-errors",
        "--window-size=1440,900",
      ],
    })
    // Reset context when browser restarts
    context = null
  }

  if (!context) {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

    context = await browser!.newContext({
      userAgent: ua,
      locale: "es-MX",
      timezoneId: "America/Mexico_City",
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "accept-language": "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1",
      },
    })

    // Eliminar huellas de automatización antes de que cargue cualquier JS
    await context.addInitScript(() => {
      // Borrar navigator.webdriver
      Object.defineProperty(navigator, "webdriver", { get: () => undefined })

      // Simular plugins reales de Chrome
      Object.defineProperty(navigator, "plugins", {
        get: () => {
          const plugins = [
            { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
            { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
            { name: "Native Client", filename: "internal-nacl-plugin", description: "" },
          ]
          Object.setPrototypeOf(plugins, PluginArray.prototype)
          return plugins
        },
      })

      // Idiomas reales
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-MX", "es", "en-US", "en"],
      })

      // Parchar permissions para evitar detección por consulta de notificaciones
      const origQuery = window.navigator.permissions.query.bind(navigator.permissions)
      window.navigator.permissions.query = (params: PermissionDescriptor) =>
        params.name === "notifications"
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : origQuery(params)

      // Borrar propiedades que delatan Chrome controlado
      // @ts-expect-error chromium leak
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array
      // @ts-expect-error chromium leak
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise
      // @ts-expect-error chromium leak
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol
    })

    // Cargar cookies de sesión exportadas si existen
    const cookiesPath = process.env.SCRAPER_COOKIES_PATH
    if (cookiesPath && fs.existsSync(cookiesPath)) {
      try {
        const raw = fs.readFileSync(cookiesPath, "utf8")
        const rawCookies: Array<Record<string, unknown>> = JSON.parse(raw)
        // Playwright solo acepta sameSite: Strict | Lax | None
        const sameSiteMap: Record<string, "Strict" | "Lax" | "None"> = {
          strict: "Strict", lax: "Lax", none: "None",
          no_restriction: "None", unspecified: "Lax",
        }
        const cookies = rawCookies.map((c) => ({
          ...c,
          sameSite: sameSiteMap[String(c.sameSite ?? "").toLowerCase()] ?? "Lax",
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await context.addCookies(cookies as any)
        console.log(`[shein-scraper] Loaded ${cookies.length} saved cookies`)
      } catch (e) {
        console.warn("[shein-scraper] Failed to load cookies:", e)
      }
    }
  }

  return context!
}

// ─── Helpers de simulación humana ────────────────────────────────────────────

function randomDelay(min = 700, max = 2000): Promise<void> {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)))
}

async function humanScroll(page: Page, steps = 3): Promise<void> {
  for (let i = 0; i < steps; i++) {
    const delta = 250 + Math.random() * 450
    await page.evaluate((d: number) => window.scrollBy({ top: d, behavior: "smooth" }), delta)
    await randomDelay(400, 1000)
  }
}

async function humanMouseWander(page: Page): Promise<void> {
  const x = 300 + Math.random() * 600
  const y = 200 + Math.random() * 400
  await page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 10) })
  await randomDelay(200, 500)
}

async function dismissOverlays(page: Page): Promise<void> {
  const candidates = [
    ".close-btn-wrap .close-icon",
    ".S-popup-close",
    ".S-dialog__normal-close",
    "[data-expose-id='subscribe_popup'] .close",
    ".newsletter-wrap .close",
    ".country-select .close",
    "button[aria-label='Close']",
    ".coupon-recommend .close",
    "[class*='dialog'] [class*='close']",
  ]
  for (const sel of candidates) {
    try {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 600 })) {
        await el.click()
        await randomDelay(300, 700)
      }
    } catch {
      // Overlay no existe — ignorar
    }
  }
}

function isBlocked(url: string): boolean {
  return url.includes("/risk/") || url.includes("captcha") || url.includes("challenge")
}

// ─── Extracción de categoría ──────────────────────────────────────────────────

type GbWindow = Window & typeof globalThis & {
  gbProductListData?: { productList?: GbProduct[] }
  productIntroData?: { detail?: GbDetail }
}

interface GbProduct {
  goods_id?: string | number
  goods_sn?: string
  goods_name?: string
  goods_img?: string
  productRelationID?: string
  retailPrice?: { amount: string }
  salePrice?: { amount: string }
  cat_name?: string
}

interface GbDetail {
  goods_id?: string | number
  goods_sn?: string
  goods_name?: string
  goods_desc?: string
  retailPrice?: { amount: string }
  salePrice?: { amount: string }
  cat_name?: string
  goods_imgs?: {
    detail_image?: Array<{ origin_image?: string; medium_image?: string }>
    main_image?: { origin_image?: string }
  }
  attrValueList?: Array<{ attr_id?: number; attr_value?: string }>
  color_image?: Array<{ color_name?: string }>
}

async function extractCategoryProducts(page: Page): Promise<SheinRawProduct[]> {
  return page.evaluate(() => {
    const win = window as GbWindow
    const base = window.location.origin

    // Estrategia 1: datos expuestos en variable global de Shein
    if (win.gbProductListData?.productList?.length) {
      return win.gbProductListData.productList.map((p) => ({
        shein_product_id: String(p.goods_id ?? ""),
        shein_url: p.productRelationID
          ? `${base}/${p.productRelationID}`
          : base,
        title: p.goods_name ?? "",
        description: null,
        images: p.goods_img ? [p.goods_img.replace(/^\/\//, "https://")] : [],
        original_price: parseFloat(p.retailPrice?.amount ?? p.salePrice?.amount ?? "0"),
        sizes: [],
        colors: [],
        category: p.cat_name ?? "",
        shein_sku: p.goods_sn ?? null,
      }))
    }

    // Estrategia 2: scraping DOM con múltiples selectores de fallback
    const CARD_SELECTORS = [
      ".S-product-item",
      ".product-list__item",
      "[class*='product-item__wrap']",
      ".goods-item",
      "[data-product-id]",
      "[data-goods-id]",
    ].join(", ")

    const cards = Array.from(document.querySelectorAll(CARD_SELECTORS))

    if (cards.length === 0) {
      // Estrategia 3: solo links de producto en la página
      return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href*='-p-']"))
        .map((a) => {
          const idMatch = a.href.match(/-p-(\d+)/)
          const img = a.querySelector("img") as HTMLImageElement | null
          return {
            shein_product_id: idMatch?.[1] ?? "",
            shein_url: a.href,
            title: a.getAttribute("title") ?? img?.alt ?? "",
            description: null,
            images: img ? [img.src || img.getAttribute("data-src") || ""].filter(Boolean) : [],
            original_price: 0,
            sizes: [],
            colors: [],
            category: "",
            shein_sku: null,
          }
        })
        .filter((p, i, arr) => p.shein_product_id !== "" && arr.findIndex((x) => x.shein_product_id === p.shein_product_id) === i)
    }

    return cards
      .map((card) => {
        const link = card.querySelector<HTMLAnchorElement>("a[href*='-p-']")
        if (!link) return null

        const img = card.querySelector<HTMLImageElement>("img")
        const nameEl = card.querySelector(
          ".S-product-item__name, .goods-title-link, [class*='goods-name'], [class*='product-name']"
        )
        const priceEl = card.querySelector(
          ".S-product-item__sale-price, [class*='sale-price'], [class*='normal-price'], [class*='goods-price']"
        )

        const href = link.href
        const idMatch = href.match(/-p-(\d+)/)
        const imgSrc = img?.src || img?.getAttribute("data-src") || img?.getAttribute("data-original") || ""
        const priceText = priceEl?.textContent?.replace(/[^\d.]/g, "") ?? "0"

        return {
          shein_product_id: idMatch?.[1] ?? "",
          shein_url: href.startsWith("http") ? href : base + href,
          title: nameEl?.textContent?.trim() ?? img?.alt ?? "",
          description: null,
          images: imgSrc ? [imgSrc.replace(/^\/\//, "https://")] : [],
          original_price: parseFloat(priceText) || 0,
          sizes: [],
          colors: [],
          category: "",
          shein_sku: null,
        } as SheinRawProduct
      })
      .filter(
        (p): p is SheinRawProduct =>
          p !== null && p.shein_product_id !== "" && p.title !== ""
      )
  }) as Promise<SheinRawProduct[]>
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function scrapSheinCategory(
  categoryUrl: string,
  limit = 20
): Promise<ScraperResult<SheinRawProduct[]>> {
  const ctx = await getBrowserContext()
  const page = await ctx.newPage()
  const seen = new Set<string>()
  const products: SheinRawProduct[] = []

  try {
    // Quick connectivity check via proxy
    const testPage = await ctx.newPage()
    let reqCount = 0
    testPage.on("request", (r) => { reqCount++; console.log(`[shein-scraper] REQ: ${r.url().slice(0, 80)}`) })
    testPage.on("requestfailed", (r) => console.log(`[shein-scraper] REQ FAILED: ${r.url().slice(0, 80)} — ${r.failure()?.errorText}`))
    try {
      await testPage.goto("https://httpbin.org/ip", { waitUntil: "networkidle", timeout: 30000 })
      console.log(`[shein-scraper] Requests made: ${reqCount}`)
      const testContent = await testPage.content()
      console.log(`[shein-scraper] Proxy test (httpbin): ${testContent.slice(0, 300)}`)
    } catch (e) {
      console.log(`[shein-scraper] Proxy test failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      await testPage.close()
    }

    // Intercept Shein's internal product API call — more reliable than DOM scraping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intercepted: { products: any[] | null } = { products: null }
    page.on("response", async (response) => {
      const url = response.url()
      if (!url.includes("shein.com") && !url.includes("sheincorp")) return
      const ct = response.headers()["content-type"] ?? ""
      if (!ct.includes("json")) return
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = await response.json()
        const list =
          json?.info?.products ??
          json?.info?.goods_list ??
          json?.data?.products ??
          json?.data?.goods_list ??
          json?.products ??
          null
        if (Array.isArray(list) && list.length > 0) {
          console.log(`[shein-scraper] Intercepted product API: ${url.slice(0, 100)} (${list.length} items)`)
          if (!intercepted.products) intercepted.products = list
        }
      } catch { /* not JSON or already consumed */ }
    })

    await page.goto(categoryUrl, { waitUntil: "networkidle", timeout: 120000 })

    const landedUrl = page.url()
    console.log(`[shein-scraper] Landed: ${landedUrl}`)

    if (isBlocked(landedUrl)) {
      const msg =
        "Shein bloqueó la request. Necesitás SCRAPER_PROXY_URL con un proxy residencial. " +
        `URL destino: ${categoryUrl}`
      console.error("[shein-scraper]", msg)
      return { ok: false, reason: "blocked", message: msg }
    }

    // Give a moment for late API calls to fire
    await randomDelay(2000, 3000)

    // If we got intercepted API data, map it directly
    if (intercepted.products && intercepted.products.length > 0) {
      console.log(`[shein-scraper] Using intercepted API data (${intercepted.products.length} products)`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = intercepted.products.slice(0, limit).map((p: any): SheinRawProduct => ({
        shein_product_id: String(p.goods_id ?? p.goodsId ?? ""),
        shein_url: p.goods_url_name
          ? `https://www.shein.com.mx/${p.goods_url_name}-p-${p.goods_id}.html`
          : `https://www.shein.com.mx/-p-${p.goods_id}.html`,
        title: p.goods_name ?? p.goodsName ?? "",
        description: null,
        images: p.goods_img ? [String(p.goods_img).replace(/^\/\//, "https://")] : [],
        original_price: parseFloat(p.retailPrice?.amount ?? p.salePrice?.amount ?? p.price ?? "0"),
        sizes: [],
        colors: [],
        category: p.cat_name ?? "",
        shein_sku: p.goods_sn ?? null,
      })).filter((p: SheinRawProduct) => p.shein_product_id !== "")
      if (mapped.length > 0) return { ok: true, data: mapped }
    }

    await dismissOverlays(page)
    await humanMouseWander(page)

    // Scroll para cargar productos lazy
    let stableRounds = 0
    while (products.length < limit && stableRounds < 4) {
      await humanScroll(page, 2 + Math.floor(Math.random() * 3))

      const batch = await extractCategoryProducts(page)
      let added = 0
      for (const p of batch) {
        if (!seen.has(p.shein_product_id) && p.shein_product_id) {
          seen.add(p.shein_product_id)
          products.push(p)
          added++
          if (products.length >= limit) break
        }
      }

      stableRounds = added === 0 ? stableRounds + 1 : 0
    }

    if (products.length === 0) {
      const htmlSnippet = (await page.content()).slice(0, 800)
      console.log(`[shein-scraper] HTML snippet:\n${htmlSnippet}`)
      await page.screenshot({ path: "debug-shein.png", fullPage: false }).catch(() => {})
      console.log("[shein-scraper] Screenshot saved: debug-shein.png")
      return { ok: false, reason: "empty", message: "No se encontraron productos en la página." }
    }

    return { ok: true, data: products.slice(0, limit) }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[shein-scraper] Category error:", message)
    if (message.includes("timeout")) {
      return { ok: false, reason: "timeout", message }
    }
    return { ok: false, reason: "error", message }
  } finally {
    await page.close()
  }
}

export async function scrapSheinProduct(url: string): Promise<ScraperResult<SheinRawProduct>> {
  const ctx = await getBrowserContext()
  const page = await ctx.newPage()

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 120000 })
    await randomDelay(1200, 2500)

    if (isBlocked(page.url())) {
      return {
        ok: false,
        reason: "blocked",
        message: `Shein bloqueó. Configurá SCRAPER_PROXY_URL. URL: ${url}`,
      }
    }

    // Esperar que cargue el título del producto
    await page
      .locator("h1, [class*='product-name'], [class*='product-title']")
      .first()
      .waitFor({ timeout: 12000 })
      .catch(() => {})

    await dismissOverlays(page)
    await humanMouseWander(page)
    await randomDelay(600, 1200)

    const product = await page.evaluate((pageUrl: string): SheinRawProduct => {
      const win = window as GbWindow

      // Estrategia 1: window.productIntroData (Shein expone datos del producto aquí)
      const detail = win.productIntroData?.detail
      if (detail?.goods_id) {
        const images = [
          ...(detail.goods_imgs?.detail_image ?? []).map(
            (i) => i.origin_image || i.medium_image || ""
          ),
          detail.goods_imgs?.main_image?.origin_image ?? "",
        ]
          .filter(Boolean)
          .map((s) => s.replace(/^\/\//, "https://"))

        const sizes = (detail.attrValueList ?? [])
          .filter((a) => a.attr_id === 87)
          .map((a) => a.attr_value ?? "")
          .filter(Boolean)

        const colors = (detail.color_image ?? []).map((c) => c.color_name ?? "").filter(Boolean)

        return {
          shein_product_id: String(detail.goods_id),
          shein_url: pageUrl,
          title: detail.goods_name ?? document.title,
          description: detail.goods_desc ?? null,
          images,
          original_price: parseFloat(
            detail.retailPrice?.amount ?? detail.salePrice?.amount ?? "0"
          ),
          sizes,
          colors,
          category: detail.cat_name ?? "",
          shein_sku: detail.goods_sn ?? null,
        }
      }

      // Estrategia 2: Script de datos SSR (Next.js / Nuxt)
      const sseScript = document.querySelector<HTMLScriptElement>(
        "script#__NEXT_DATA__, script#__NUXT_DATA__, script[type='application/json']"
      )
      if (sseScript?.textContent) {
        try {
          const data = JSON.parse(sseScript.textContent)
          const d =
            data?.props?.pageProps?.detail ??
            data?.props?.pageProps?.goods ??
            data?.data?.detail
          if (d?.goods_id) {
            return {
              shein_product_id: String(d.goods_id),
              shein_url: pageUrl,
              title: d.goods_name ?? "",
              description: d.goods_desc ?? null,
              images: (d.goods_imgs?.detail_image ?? [])
                .map((i: { origin_image?: string }) => i.origin_image ?? "")
                .filter(Boolean),
              original_price: parseFloat(d.retailPrice?.amount ?? "0"),
              sizes: [],
              colors: [],
              category: d.cat_name ?? "",
              shein_sku: d.goods_sn ?? null,
            }
          }
        } catch {
          // fallback al DOM
        }
      }

      // Estrategia 3: DOM directo
      const titleEl = document.querySelector<HTMLElement>(
        "h1.product-intro__head-name, h1[class*='product-name'], .product-title, h1"
      )
      const title = titleEl?.innerText?.trim() ?? document.title

      const priceEl = document.querySelector<HTMLElement>(
        ".product-intro__head-price .from, [class*='sale-price'], [class*='normal-price'], [class*='goods-price']"
      )
      const priceText = priceEl?.innerText?.replace(/[^\d.]/g, "") ?? "0"

      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          ".product-intro__pics img, .crop-image-container img, [class*='product-image'] img, [class*='goods-image'] img"
        )
      )
        .map((i) => (i.src || i.getAttribute("data-src") || "").replace(/^\/\//, "https://"))
        .filter((s) => s && !s.startsWith("data:") && s.startsWith("http"))
        .filter((s, i, a) => a.indexOf(s) === i)

      const sizes = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".product-intro__size-choose__item, [class*='size-item'], [class*='goods-size__item']"
        )
      )
        .map((el) => el.innerText?.trim())
        .filter(Boolean)

      const descriptionEl = document.querySelector<HTMLElement>(
        ".product-intro__description-table, [class*='description-table'], .detail-middle__description, [class*='product-desc']"
      )
      const description = descriptionEl?.innerText?.trim() ?? null

      const idFromUrl = pageUrl.match(/-p-(\d+)/)?.[1] ?? ""

      return {
        shein_product_id: idFromUrl,
        shein_url: pageUrl,
        title,
        description,
        images,
        original_price: parseFloat(priceText) || 0,
        sizes,
        colors: [],
        category: "",
        shein_sku: null,
      }
    }, url)

    if (!product.shein_product_id && !product.title) {
      return { ok: false, reason: "empty", message: "No se pudo extraer datos del producto." }
    }

    return { ok: true, data: product }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[shein-scraper] Product error:", url, message)
    return {
      ok: false,
      reason: message.includes("timeout") ? "timeout" : "error",
      message,
    }
  } finally {
    await page.close()
  }
}

// ─── Markup y transformación ──────────────────────────────────────────────────

/**
 * Calcula el precio de venta redondeado al múltiplo de 100 más cercano.
 * Ejemplo: applyMarkup(1200, 2.5) → 3000
 */
export function applyMarkup(costPrice: number, multiplier = 2.5): number {
  if (costPrice <= 0) return 0
  return Math.ceil((costPrice * multiplier) / 100) * 100
}

/**
 * Convierte un SheinRawProduct en un Product de Theia listo para insertar.
 */
export function toTheiaProduct(
  raw: SheinRawProduct,
  multiplier = 2.5
): Omit<Product, "id" | "created_at" | "updated_at" | "status"> {
  const costPrice = raw.original_price
  return {
    shein_product_id: raw.shein_product_id,
    shein_url: raw.shein_url,
    title: raw.title,
    description: raw.description,
    images: raw.images,
    original_price: costPrice,
    sale_price: applyMarkup(costPrice, multiplier),
    cost_price: costPrice,
    stock: 99,
    category: raw.category,
    tags: [],
    sizes: raw.sizes,
    colors: raw.colors,
    shein_sku: raw.shein_sku,
    markup_percentage: Math.round((multiplier - 1) * 100),
  }
}

// ─── Gestión del navegador ────────────────────────────────────────────────────

/** Guarda las cookies actuales para reutilizarlas en próximas sesiones. */
export async function saveCookies(path: string): Promise<void> {
  if (!context) return
  const cookies = await context.cookies()
  fs.writeFileSync(path, JSON.stringify(cookies, null, 2))
  console.log(`[shein-scraper] Guardadas ${cookies.length} cookies en ${path}`)
}

export async function closeBrowser(): Promise<void> {
  await context?.close().catch(() => {})
  await browser?.close().catch(() => {})
  context = null
  browser = null
}
