import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAccessToken } from "@/lib/cj/client"

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1"

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface CJVariant {
  vid: string
  variantKey: string       // "Pink-S", "Light Blue-XL", etc.
  variantSellPrice: number
  variantImage: string
  variantSku: string
  variantStock?: number    // stock per variant (may be absent in some responses)
}

interface CJDetailRaw {
  pid: string
  productNameEn: string
  bigImage: string
  productImage: string       // JSON string of image array
  productImageSet: string[]  // already-parsed array
  description: string | null
  sellPrice: string
  variants: CJVariant[]
}

/** Split "Pink-S" → { color: "Pink", size: "S" } using last "-" as delimiter */
function parseVariantKey(key: string): { color: string; size: string } {
  const idx = key.lastIndexOf("-")
  if (idx === -1) return { color: "", size: key }
  return { color: key.slice(0, idx).trim(), size: key.slice(idx + 1).trim() }
}

/**
 * Fetch from CJ with exponential backoff on 429.
 * Waits: 5s → 10s → 20s (max 3 attempts).
 */
async function fetchCJ(
  pid: string,
  token: string,
  maxRetries = 3
): Promise<Response> {
  let delay = 5000
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${CJ_BASE}/product/query?pid=${pid}`, {
      headers: { "CJ-Access-Token": token },
    })
    if (res.status !== 429) return res
    console.warn(`[cj/enrich] 429 on pid=${pid}, attempt ${attempt}/${maxRetries}, waiting ${delay}ms`)
    if (attempt < maxRetries) await new Promise((r) => setTimeout(r, delay))
    delay *= 2
  }
  throw new Error("429 Too Many Requests — max retries exceeded")
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  // Optional ?ids=uuid1,uuid2,... to retry only specific products
  const idsParam = req.nextUrl.searchParams.get("ids")
  const filterIds = idsParam ? idsParam.split(",").map((s) => s.trim()).filter(Boolean) : null

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        const supabase = adminSupabase()

        let query = supabase
          .from("products")
          .select("id, title, shein_url")
          .like("shein_url", "%cjdropshipping%")
          .order("created_at", { ascending: true })

        if (filterIds?.length) {
          query = query.in("id", filterIds)
        }

        const { data: products, error: fetchErr } = await query

        if (fetchErr || !products) {
          send({ type: "error", message: `Supabase fetch error: ${fetchErr?.message}` })
          controller.close()
          return
        }

        send({ type: "start", total: products.length })

        const token = await getAccessToken()
        let done = 0
        let updated = 0
        let failed = 0

        for (const product of products) {
          const pid = product.shein_url
            ? new URL(product.shein_url).searchParams.get("id")
            : null

          if (!pid) {
            done++
            failed++
            send({
              type: "progress",
              id: product.id,
              done,
              total: products.length,
              updated,
              failed,
              current: product.title,
              status: "skip",
              reason: "no CJ id in URL",
            })
            continue
          }

          try {
            const res = await fetchCJ(pid, token)
            const json = await res.json()

            if (!json.result || !json.data) {
              throw new Error(json.message ?? "CJ API returned no data")
            }

            const d: CJDetailRaw = json.data

            // ── Parse variants → color→image map ──────────────────────────
            const variantList: CJVariant[] = Array.isArray(d.variants) ? d.variants : []

            // colorImageMap preserves insertion order (first variant per color wins)
            const colorImageMap = new Map<string, string>()
            const sizesSet = new Set<string>()
            // color_sizes: which sizes are available per color
            const colorSizesMap = new Map<string, string[]>()
            // sizeStock: aggregate stock across all colors per size
            const sizeStockMap = new Map<string, number>()
            const hasVariantStock = variantList.some((v) => v.variantStock != null)

            for (const v of variantList) {
              if (!v.variantKey) continue
              const { color, size } = parseVariantKey(v.variantKey)
              if (size) {
                sizesSet.add(size)
                if (hasVariantStock && v.variantStock != null) {
                  sizeStockMap.set(size, (sizeStockMap.get(size) ?? 0) + v.variantStock)
                }
              }
              if (color) {
                if (!colorImageMap.has(color)) {
                  colorImageMap.set(color, v.variantImage || d.bigImage || "")
                }
                if (size) {
                  const existing = colorSizesMap.get(color) ?? []
                  if (!existing.includes(size)) existing.push(size)
                  colorSizesMap.set(color, existing)
                }
              }
            }

            const colors = [...colorImageMap.keys()]
            const colorImages = [...colorImageMap.values()].filter(Boolean)
            const sizes = [...sizesSet]
            const color_sizes = colorSizesMap.size > 0 ? Object.fromEntries(colorSizesMap) : null
            const size_stock = hasVariantStock && sizeStockMap.size > 0
              ? Object.fromEntries(sizeStockMap)
              : null

            // ── All product images ─────────────────────────────────────────
            let allImages: string[] = d.productImageSet ?? []
            if (!allImages.length && d.productImage) {
              try { allImages = JSON.parse(d.productImage) } catch { /* ignore */ }
            }
            if (!allImages.length && d.bigImage) allImages = [d.bigImage]

            // Color images first (so images[i] ↔ colors[i]) then remaining
            const colorImagesSet = new Set(colorImages)
            const remainingImages = allImages.filter((img) => !colorImagesSet.has(img))
            const images = [...colorImages, ...remainingImages]

            // ── Persist ────────────────────────────────────────────────────
            const updatePayload: Record<string, unknown> = { images, sizes, colors }
            if (color_sizes !== null) updatePayload.color_sizes = color_sizes
            if (size_stock !== null) updatePayload.size_stock = size_stock

            const { error: updateErr } = await supabase
              .from("products")
              .update(updatePayload)
              .eq("id", product.id)

            if (updateErr) throw new Error(updateErr.message)

            done++
            updated++
            send({
              type: "progress",
              id: product.id,
              done,
              total: products.length,
              updated,
              failed,
              current: product.title,
              status: "ok",
              images: images.length,
              sizes,
              colors,
            })
          } catch (err) {
            done++
            failed++
            send({
              type: "progress",
              id: product.id,
              done,
              total: products.length,
              updated,
              failed,
              current: product.title,
              status: "error",
              reason: err instanceof Error ? err.message : String(err),
            })
          }

          // 1s delay between products to stay within CJ rate limits
          await new Promise((r) => setTimeout(r, 1000))
        }

        send({ type: "done", total: products.length, updated, failed })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
