export function Eyebrow({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p
      id={id}
      className="text-[11px] uppercase tracking-[0.09em]"
      style={{ fontFamily: "var(--font-inter)", fontWeight: 500, color: "var(--text-secondary)" }}
    >
      {children}
    </p>
  )
}

export function Divider() {
  return <div style={{ height: "1px", background: "var(--border)" }} />
}
