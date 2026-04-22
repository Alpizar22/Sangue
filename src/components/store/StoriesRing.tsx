"use client"

import Link from "next/link"

const STORIES = [
  { id: "novedades", title: "Novedades", seed: "st1", isNew: true },
  { id: "vestidos", title: "Vestidos", seed: "st2", isNew: true },
  { id: "tops", title: "Tops", seed: "st3", isNew: false },
  { id: "pantalones", title: "Pants", seed: "st4", isNew: false },
  { id: "faldas", title: "Faldas", seed: "st5", isNew: true },
  { id: "outerwear", title: "Outerwear", seed: "st6", isNew: false },
  { id: "sets", title: "Co-ords", seed: "st7", isNew: false },
]

export default function StoriesRing() {
  return (
    <div className="w-full border-b border-[#1a1a1a] py-4">
      <div className="flex gap-5 px-4 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {STORIES.map((story) => (
          <Link
            key={story.id}
            href={`/productos?categoria=${story.id}`}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div
              className={`w-[66px] h-[66px] rounded-full p-[2.5px] ${
                story.isNew
                  ? "bg-gradient-to-tr from-[#c0392b] via-[#e74c3c] to-[#ff6b6b]"
                  : "bg-[#2a2a2a]"
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#111] border-[2.5px] border-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${story.seed}/120/120`}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <span className="text-[10px] text-[#777] tracking-wide group-hover:text-white transition-colors">
              {story.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
