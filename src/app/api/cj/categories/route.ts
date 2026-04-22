import { NextResponse } from "next/server"
import { getCJCategories } from "@/lib/cj/catalog"
import type { CJCategory } from "@/lib/cj/catalog"

const KEYWORDS = ["women", "dress", "top", "jersey", "soccer", "football", "clothing"]

function matches(c: CJCategory): boolean {
  const text = `${c.firstCategoryName} ${c.secondCategoryName} ${c.categoryName}`.toLowerCase()
  return KEYWORDS.some((k) => text.includes(k))
}

export async function GET() {
  try {
    const all = await getCJCategories()
    const filtered = all.filter(matches)

    console.log(`\n[CJ categories] ${filtered.length} coincidencias de ${all.length} total:`)
    filtered.forEach((c) => {
      console.log(`  [${c.categoryId}]  ${c.firstCategoryName} > ${c.secondCategoryName} > ${c.categoryName}`)
    })

    return NextResponse.json({ total: all.length, found: filtered.length, categories: filtered })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[CJ categories] error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
