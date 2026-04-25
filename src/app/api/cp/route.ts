import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface SepomexResponse {
  zip_codes: {
    d_asenta: string
    D_mnpio: string
    d_estado: string
    d_ciudad: string
  }[]
}

export async function GET(req: NextRequest) {
  const cp = req.nextUrl.searchParams.get("cp")?.trim()
  if (!cp || !/^\d{5}$/.test(cp)) {
    return NextResponse.json({ error: "CP debe tener 5 dígitos" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) {
      return NextResponse.json({ error: "CP no encontrado" }, { status: 404 })
    }
    const data: SepomexResponse = await res.json()
    if (!data.zip_codes?.length) {
      return NextResponse.json({ error: "CP no encontrado" }, { status: 404 })
    }
    const first = data.zip_codes[0]
    const colonias = [...new Set(data.zip_codes.map(z => z.d_asenta))].sort()
    return NextResponse.json({
      municipio: first.D_mnpio,
      estado: first.d_estado,
      ciudad: first.d_ciudad || first.D_mnpio,
      colonias,
    })
  } catch {
    return NextResponse.json({ error: "Error al consultar CP" }, { status: 500 })
  }
}
