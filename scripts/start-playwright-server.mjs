import { cpSync, existsSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const root = process.cwd()
const standaloneRoot = join(root, ".next", "standalone")

cpSync(join(root, ".next", "static"), join(standaloneRoot, ".next", "static"), {
  recursive: true,
})

if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(standaloneRoot, "public"), { recursive: true })
}

await import(pathToFileURL(join(standaloneRoot, "server.js")).href)
