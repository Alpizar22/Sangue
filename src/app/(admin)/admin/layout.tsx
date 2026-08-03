import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/Sidebar"
import type { Metadata } from "next"
import { isValidAdminSession } from "@/lib/adminSession"

export const metadata: Metadata = {
  title: { default: "Admin — Theia", template: "%s | Admin Theia" },
  robots: "noindex,nofollow",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>
  }

  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!(await isValidAdminSession(session?.value, process.env.ADMIN_PASSWORD))) redirect("/admin/login")

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-6">{children}</main>
    </div>
  )
}
