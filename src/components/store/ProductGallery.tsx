"use client"

import { useState } from "react"
import Image from "next/image"

interface Props {
  images: string[]
  title: string
  /** Controlled: if provided, the parent owns the active index */
  activeIndex?: number
  onActiveChange?: (index: number) => void
}

export default function ProductGallery({ images, title, activeIndex, onActiveChange }: Props) {
  const [internalActive, setInternalActive] = useState(0)

  // Controlled mode if activeIndex prop is passed
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

  return (
    <div className="space-y-3">
      {/* Main image with zoom on hover */}
      <div
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden cursor-zoom-in"
        style={{ background: "var(--paper)" }}
      >
        <Image
          src={images[active] ?? images[0]}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-out hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails — only when more than one image */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-full aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                active === i ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              {active === i && (
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
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
