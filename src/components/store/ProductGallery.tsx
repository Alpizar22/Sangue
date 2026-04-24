"use client"

import { useState } from "react"
import Image from "next/image"

interface Props {
  images: string[]
  title: string
  activeIndex?: number
  onActiveChange?: (index: number) => void
}

export default function ProductGallery({ images, title, activeIndex, onActiveChange }: Props) {
  const [internalActive, setInternalActive] = useState(0)

  const controlled = activeIndex !== undefined
  const active = controlled ? activeIndex : internalActive

  function setActive(i: number) {
    if (controlled) onActiveChange?.(i)
    else setInternalActive(i)
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

  const clampedActive = Math.min(active, images.length - 1)
  const mobileImages = images.slice(0, 3)
  const desktopImages = images.slice(0, 8)

  function Thumb({ img, i, size }: { img: string; i: number; size: string }) {
    const isActive = clampedActive === i
    return (
      <button
        onClick={() => setActive(i)}
        className={`relative rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${
          isActive ? "opacity-100" : "opacity-50 hover:opacity-80"
        }`}
        style={{ width: size, height: size }}
        aria-label={`Ver imagen ${i + 1}`}
      >
        {isActive && (
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
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-zoom-in"
        style={{ background: "var(--paper)" }}
      >
        <Image
          src={images[clampedActive]}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-out hover:scale-110"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <>
          {/* Mobile: horizontal scroll strip, max 3 thumbs */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {mobileImages.map((img, i) => (
              <Thumb key={i} img={img} i={i} size="72px" />
            ))}
          </div>

          {/* Desktop: 4-col grid, up to 8 thumbs */}
          <div className="hidden lg:grid grid-cols-4 gap-2">
            {desktopImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative w-full aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                  clampedActive === i ? "opacity-100" : "opacity-50 hover:opacity-80"
                }`}
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
                  sizes="12vw"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
