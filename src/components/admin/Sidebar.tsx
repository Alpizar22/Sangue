"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Search,
  Tag,
  LogOut,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/scraping", label: "Importar productos", icon: Search },
  { href: "/admin/precios", label: "Precios", icon: Tag },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <aside className="flex min-h-screen w-16 flex-shrink-0 flex-col border-r bg-white sm:w-60">
      <div className="hidden border-b p-5 sm:block">
        <p className="font-bold text-lg tracking-widest">THEIA</p>
        <p className="text-xs text-gray-400 mt-0.5">Panel Admin</p>
      </div>

      <nav className="flex-1 space-y-1 p-2 sm:p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex min-h-11 items-center justify-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors sm:justify-start ${
                active
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={17} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-2 sm:p-3">
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex min-h-11 w-full items-center justify-center gap-0 px-3 py-2.5 text-[0px] text-red-600 hover:bg-red-50 sm:justify-start sm:gap-3 sm:text-sm"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
