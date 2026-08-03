export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] uppercase tracking-[0.16em]"
      style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
    >
      {children}
    </p>
  )
}

export function Divider() {
  return <div style={{ height: "1px", background: "var(--border)" }} />
}
