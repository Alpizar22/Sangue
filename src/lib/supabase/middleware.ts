import { type NextRequest, NextResponse } from "next/server"
import { isValidAdminSession } from "@/lib/adminSession"

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = request.cookies.get("admin_session")?.value
    if (!(await isValidAdminSession(session, process.env.ADMIN_PASSWORD))) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}
