import { cookies } from "next/headers"
import { isValidAdminSession } from "@/lib/adminSession"

export async function hasValidAdminSession(): Promise<boolean> {
  const value = (await cookies()).get("admin_session")?.value
  return isValidAdminSession(value, process.env.ADMIN_PASSWORD)
}

export async function requireValidAdminSession(): Promise<void> {
  if (!(await hasValidAdminSession())) {
    throw new Error("No autorizado")
  }
}
