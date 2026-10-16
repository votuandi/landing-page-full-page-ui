import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

process.env.ADMIN_SESSION_SECRET ??= "admin-e2e-session-secret-0123456789abcdef";

const platformDomain = process.env.E2E_PLATFORM_DOMAIN ??= "solar.example.com";

export default defineConfig({
  testDir: ".", testMatch: "admin.spec.ts", workers: 1, retries: process.env.CI ? 1 : 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/admin", expect: { timeout: 20_000 },
  use: { viewport: { width: 1280, height: 900 }, locale: "vi-VN", navigationTimeout: 90_000,
    contextOptions: { reducedMotion: "reduce" }, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { browserName: "chromium", launchOptions: { args: [`--host-resolver-rules=MAP *.${platformDomain} 127.0.0.1`] } } }],
  webServer: {
    command: "pnpm --filter admin dev", cwd: resolve(__dirname, "../.."),
    url: "http://localhost:3300/fonts/be-vietnam-pro-400.75bc7b1c.woff2", reuseExistingServer: !process.env.CI, timeout: 120_000,
    env: { PLATFORM_DOMAIN: platformDomain, ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
      PLATFORM_DATABASE_URL: "", MIGRATION_DATABASE_URL: "", TEST_OWNER_DATABASE_URL: "", SEED_PASSWORD: "" },
  },
});
