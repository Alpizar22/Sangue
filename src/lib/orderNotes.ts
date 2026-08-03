export type OperationalNoteType =
  | "MERCADOPAGO_PREFERENCE_FAILED"
  | "PAYMENT_VALIDATION_FAILED"
  | "PRINTFUL_API_FAILED"
  | "PRINTFUL_RECONCILIATION_REQUIRED"

export function formatOperationalNote(
  type: OperationalNoteType,
  details: Record<string, unknown>
): string {
  return `[${type}] ${JSON.stringify(details)}`
}

export function appendUniqueOrderNote(existingNotes: string | null, note: string): string {
  const current = existingNotes?.trim()
  if (current?.includes(note)) return current
  return current ? `${current}\n${note}` : note
}

export interface ParsedOperationalNote {
  type: string
  details: Record<string, unknown> | null
  raw: string
}

export function parseOperationalNotes(notes: string | null): ParsedOperationalNote[] {
  if (!notes?.trim()) return []
  return notes.split("\n").filter(Boolean).map((line) => {
    const match = line.match(/^\[([A-Z0-9_]+)\]\s*(.*)$/)
    if (!match) return { type: "NOTE", details: null, raw: line }
    try {
      return { type: match[1], details: JSON.parse(match[2]) as Record<string, unknown>, raw: line }
    } catch {
      return { type: match[1], details: null, raw: line }
    }
  })
}
