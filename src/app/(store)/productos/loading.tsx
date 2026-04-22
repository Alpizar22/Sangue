export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div
        className="h-9 w-52 rounded mb-8 animate-pulse"
        style={{ background: "rgba(26,26,26,0.08)" }}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div
              className="aspect-[3/4] rounded animate-pulse"
              style={{ background: "rgba(26,26,26,0.07)" }}
            />
            <div
              className="h-3 w-4/5 rounded animate-pulse"
              style={{ background: "rgba(26,26,26,0.05)" }}
            />
            <div
              className="h-3 w-2/5 rounded animate-pulse"
              style={{ background: "rgba(26,26,26,0.05)" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
