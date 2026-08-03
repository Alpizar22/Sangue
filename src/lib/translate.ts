export interface TranslateResult {
  titles: string[]
  error?: string
  hasApiKey: boolean
}

export async function translateTitles(titles: string[]): Promise<TranslateResult> {
  if (!titles.length) return { titles, hasApiKey: false }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      titles,
      hasApiKey: false,
      error: "ANTHROPIC_API_KEY no configurada en variables de entorno",
    }
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Traduce estos títulos de productos de inglés a español. Reglas:
- Máximo 40 caracteres cada uno
- Estilo minimalista/aesthetic: omitir "casual", "comfort", "women's", "solid color", "ladies", marcas
- Mantener solo las características esenciales (prenda, corte, detalle principal)
- Devuelve ÚNICAMENTE un array JSON con los títulos traducidos, sin texto extra ni markdown

Ejemplos:
"Casual Loose Lapels Mid-sleeve Large Swing Dress" → "Vestido swing manga media"
"Women's Solid Color Casual Loose Long Sleeve V-neck Shirt" → "Blusa cuello V manga larga"
"Comfort And Casual Long Sleeve Striped Button Top" → "Top a rayas con botones"

Títulos:
${JSON.stringify(titles)}`,
      }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      const err = `Claude no devolvió JSON array válido. Respuesta: ${text.slice(0, 200)}`
      console.error("[translateTitles]", err)
      return { titles, hasApiKey: true, error: err }
    }

    const translated = JSON.parse(match[0]) as string[]
    if (!Array.isArray(translated) || translated.length !== titles.length) {
      const err = `Array devuelto tiene longitud incorrecta: ${translated.length} vs ${titles.length}`
      console.error("[translateTitles]", err)
      return { titles, hasApiKey: true, error: err }
    }

    return { titles: translated, hasApiKey: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[translateTitles] Error completo:", err)
    return { titles, hasApiKey: true, error: message }
  }
}
