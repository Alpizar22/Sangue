import { cjGet } from "./client"

// ─── Category types ───────────────────────────────────────────────────────────

// What getCategory actually returns: 3-level nested tree
interface CJCategoryRaw {
  categoryFirstName: string
  categoryFirstList: Array<{
    categorySecondName: string
    categorySecondList: Array<{
      categoryId: string
      categoryName: string
    }>
  }>
}

// Flattened for our use — only 3rd-level items have a usable categoryId
export interface CJCategory {
  categoryId: string         // UUID — pass this to listV2 for filtering
  categoryName: string       // e.g. "Hoodies & Sweatshirts"
  firstCategoryName: string  // e.g. "Women's Clothing"
  secondCategoryName: string // e.g. "Tops & Sets"
}

export async function getCJCategories(): Promise<CJCategory[]> {
  const data = await cjGet<CJCategoryRaw[]>("/product/getCategory")
  console.log("[CJ raw]", JSON.stringify(data, null, 2))

  if (!Array.isArray(data)) {
    console.error("[CJ categories] unexpected shape:", typeof data)
    return []
  }

  const flat: CJCategory[] = []
  for (const first of data) {
    for (const second of first.categoryFirstList ?? []) {
      for (const third of second.categorySecondList ?? []) {
        flat.push({
          categoryId: third.categoryId,
          categoryName: third.categoryName,
          firstCategoryName: first.categoryFirstName,
          secondCategoryName: second.categorySecondName,
        })
      }
    }
  }
  return flat
}

// ─── Product types (listV2 field names) ──────────────────────────────────────

export interface CJProductV2 {
  id: string              // product ID (UUID)
  nameEn: string          // product English name
  sku: string             // product SPU/SKU
  bigImage: string        // main image URL
  sellPrice: string       // cost price in USD
  categoryId: string      // third-level category ID
  threeCategoryName: string
  twoCategoryId: string
  twoCategoryName: string
  oneCategoryId: string
  oneCategoryName: string
  warehouseInventoryNum: number
  productType: string
}

// Keep a legacy alias so existing imports don't break
export type CJProduct = CJProductV2

interface CJListV2Data {
  totalRecords: number
  totalPages: number
  pageNumber: number
  pageSize: number
  content: Array<{ productList: CJProductV2[] }>
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getCJProducts(
  categoryId: string,
  page = 1,
  limit = 20
): Promise<{ products: CJProductV2[]; total: number }> {
  const data = await cjGet<CJListV2Data>("/product/listV2", {
    categoryId,
    page,
    size: Math.min(limit, 100),
  })

  console.log("[CJ products raw]", JSON.stringify(data, null, 2))

  const products = data.content?.[0]?.productList ?? []
  const total = data.totalRecords ?? 0
  console.log(`[CJ products] categoryId=${categoryId} page=${page} → total=${total}, returned=${products.length}`)

  return { products, total }
}

export async function searchCJProducts(
  keyWord: string,
  page = 1,
  limit = 20
): Promise<{ products: CJProductV2[]; total: number }> {
  const data = await cjGet<CJListV2Data>("/product/listV2", {
    keyWord,
    page,
    size: Math.min(limit, 100),
  })
  return {
    products: data.content?.[0]?.productList ?? [],
    total: data.totalRecords ?? 0,
  }
}

export async function getCJProductDetail(pid: string): Promise<CJProductV2> {
  return cjGet<CJProductV2>("/product/query", { pid })
}
