"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface Props {
  images: string[]
  title: string
  activeIndex?: number
  onActiveChange?: (index: number) => void
}

export default function ProductGallery({ images, title, activeIndex, onActiveChange }: Props) {
  const [internalActive, setInternalActive] = useState(0)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const programmaticScroll = useRef(false)

  const controlled = activeIndex !== undefined
  const active = controlled ? activeIndex : internalActive
  const clampedActive = images?.length ? Math.min(active, images.length - 1) : 0

  function setActive(i: number) {
    if (controlled) onActiveChange?.(i)
    else setInternalActive(i)
  }

  // Sync mobile carousel to active index when parent changes it (e.g. color pick)
  useEffect(() => {
    const el = mobileScrollRef.current
    if (!el || !images?.length) return
    const target = clampedActive * el.clientWidth
    if (Math.abs(el.scrollLeft - target) > 4) {
      programmaticScroll.current = true
      el.scrollTo({ left: target, behavior: "smooth" })
      const timer = setTimeout(() => { programmaticScroll.current = false }, 600)
      return () => clearTimeout(timer)
    }
  }, [clampedActive, images?.length])

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

  function handleMobileScroll(e: React.UIEvent<HTMLDivElement>) {
    if (programmaticScroll.current) return
    const el = e.currentTarget
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (index !== clampedActive && index >= 0 && index < images.length) {
      setActive(index)
    }
  }

  return (
    <div className="space-y-3">

      {/* ── MOBILE: full-width snap carousel ────────────────────── */}
      <div className="lg:hidden space-y-2">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-xl"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-full snap-center relative"
              style={{ aspectRatio: "3/4" }}
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
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActive(i)
                  const el = mobileScrollRef.current
                  if (el) {
                    programmaticScroll.current = true
                    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
                    setTimeout(() => { programmaticScroll.current = false }, 600)
                  }
                }}
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
