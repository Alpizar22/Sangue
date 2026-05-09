export const dynamic = "force-static"
export const revalidate = false

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f0e8",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-instrument), Georgia, serif",
          fontSize: "clamp(4rem, 15vw, 9rem)",
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1,
          color: "#1a1a1a",
          marginBottom: "1.5rem",
          letterSpacing: "-0.01em",
        }}
      >
        Theia
      </h1>

      <p
        style={{
          fontFamily: "var(--font-instrument), Georgia, serif",
          fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
          fontStyle: "italic",
          fontWeight: 400,
          color: "#1a1a1a",
          marginBottom: "1rem",
          opacity: 0.85,
        }}
      >
        Próximamente
      </p>

      <p
        style={{
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#1a1a1a",
          opacity: 0.4,
          maxWidth: "280px",
        }}
      >
        Estamos trabajando en algo especial
      </p>
    </main>
  )
}
