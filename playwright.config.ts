import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-playwright-server.mjs",
    env: {
      PORT: "3100",
      HOSTNAME: "127.0.0.1",
      ADMIN_PASSWORD: "playwright-test-only-password",
    },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
