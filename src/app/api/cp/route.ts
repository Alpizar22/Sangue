import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface SepomexEntry {
  d_asenta?: unknown
  D_mnpio?: unknown
  d_estado?: unknown
  d_ciudad?: unknown
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""
}

export async function GET(req: NextRequest) {
  const cp = req.nextUrl.searchParams.get("cp")?.trim() ?? ""
  if (!/^\d{5}$/.test(cp)) {
    return NextResponse.json(
      { error: { code: "invalid_postal_code", message: "El código postal debe tener cinco dígitos." } },
      { status: 400 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`, {
      next: { revalidate: 86400 },
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    if (!response.ok) {
      const status = response.status === 404 ? 404 : 503
      return NextResponse.json(
        {
          error: {
            code: status === 404 ? "postal_code_not_found" : "postal_provider_unavailable",
            message: status === 404 ? "Código postal no encontrado." : "El proveedor postal no está disponible.",
          },
        },
        { status }
      )
    }

    const json = await response.json() as { zip_codes?: unknown }
    const entries = Array.isArray(json.zip_codes) ? json.zip_codes as SepomexEntry[] : []
    if (entries.length === 0) {
      return NextResponse.json(
        { error: { code: "postal_code_not_found", message: "Código postal no encontrado." } },
        { status: 404 }
      )
    }

    const first = entries[0]
    const municipio = text(first.D_mnpio)
    const estado = text(first.d_estado)
    const ciudad = text(first.d_ciudad)
    const colonias = [...new Set(entries.map((entry) => text(entry.d_asenta)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es-MX"))

    return NextResponse.json({ municipio, estado, ciudad: ciudad || municipio, colonias })
  } catch (error) {
    console.error("[postal-code] Proveedor no disponible:", (error as Error).name)
    return NextResponse.json(
      { error: { code: "postal_provider_unavailable", message: "El proveedor postal no está disponible." } },
      { status: 503 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
