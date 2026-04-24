"use client"

import { useState, useRef } from "react"
import Image from "next/image"

interface Props {
  images: string[]
  title: string
  activeIndex?: number
  onActiveChange?: (index: number) => void
}

export default function ProductGallery({ images, title, activeIndex, onActiveChange }: Props) {
  const [internalActive, setInternalActive] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const controlled = activeIndex !== undefined
  const active = controlled ? activeIndex : internalActive
  const clampedActive = images?.length ? Math.min(active, images.length - 1) : 0

  function setActive(i: number) {
    const clamped = Math.max(0, Math.min(i, images.length - 1))
    if (controlled) onActiveChange?.(clamped)
    else setInternalActive(clamped)
  }

  if (!images?.length) {
    return (
      <div
        className="w-full aspect-[3/4] rounded-xl flex items-center justify-center text-sm"
        style={{ background: "var(--paper)", color: "var(--ink)", opacity: 0.3 }}
      >
        Sin imagen
      </div>
    )
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    if (dx < 0) setActive(clampedActive + 1)
    else setActive(clampedActive - 1)
  }

  return (
    <div className="space-y-3">

      {/* ── MOBILE: button prev/next carousel ───────────────────── */}
      <div className="lg:hidden space-y-2">
        <div
          className="relative w-full overflow-hidden rounded-xl"
          style={{ aspectRatio: "3/4" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                opacity: i === clampedActive ? 1 : 0,
                transition: "opacity 300ms ease",
                pointerEvents: i === clampedActive ? "auto" : "none",
              }}
            >
              <Image
                src={img}
                alt={`${title} ${i + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </div>
          ))}

          {/* Prev button */}
          {clampedActive > 0 && (
            <button
              onClick={() => setActive(clampedActive - 1)}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(255,255,255,0.75)", border: "none",
                color: "var(--ink)", fontSize: "18px", cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              ‹
            </button>
          )}

          {/* Next button */}
          {clampedActive < images.length - 1 && (
            <button
              onClick={() => setActive(clampedActive + 1)}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(255,255,255,0.75)", border: "none",
                color: "var(--ink)", fontSize: "18px", cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              ›
            </button>
          )}
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Imagen ${i + 1}`}
                style={{
                  width: clampedActive === i ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: "var(--ink)",
                  opacity: clampedActive === i ? 0.9 : 0.2,
                  transition: "width 200ms, opacity 200ms",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: main image + thumbnail grid ─────────────────── */}
      <div className="hidden lg:block space-y-3">
        <div
          className="relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-zoom-in"
          style={{ background: "var(--paper)" }}
        >
          <Image
            src={images[clampedActive]}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 ease-out hover:scale-110"
            sizes="50vw"
            priority
          />
        </div>

        {images.length > 1 && (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}
          >
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="relative w-full aspect-square rounded-lg overflow-hidden transition-all duration-200"
                style={{ opacity: clampedActive === i ? 1 : 0.45 }}
                aria-label={`Ver imagen ${i + 1}`}
              >
                {clampedActive === i && (
                  <span
                    className="absolute inset-0 rounded-lg pointer-events-none z-10"
                    style={{ boxShadow: `inset 0 0 0 2px var(--ink)` }}
                  />
                )}
                <Image
                  src={img}
                  alt={`${title} vista ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
