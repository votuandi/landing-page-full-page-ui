import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

// Shared by the dev server and the fixture script (it signs /api/revalidate after editing the DB).
process.env.REVALIDATE_SECRET ??= "tenant-e2e-revalidate-secret-0123456789";

export default defineConfig({
  testDir: ".", testMatch: "tenant.spec.ts", workers: 1, retries: 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/tenant",
  use: { browserName: "chromium", viewport: { width: 1440, height: 900 }, locale: "vi-VN", navigationTimeout: 30_000, contextOptions: { reducedMotion: "reduce" }, trace: "retain-on-failure", screenshot: "only-on-failure",
    launchOptions: { args: ["--host-resolver-rules=MAP *.localhost 127.0.0.1"] } },
  expect: { timeout: 20_000 },
  webServer: {
    command: "pnpm --filter web dev --port 3211", cwd: resolve(__dirname, "../.."),
    url: "http://localhost:3211/favicon.svg", reuseExistingServer: !process.env.CI, timeout: 120_000,
    env: { MULTI_TENANT: "1", TENANT_PUBLIC_PORT: "3211", REVALIDATE_SECRET: process.env.REVALIDATE_SECRET, PLATFORM_DATABASE_URL: "", MIGRATION_DATABASE_URL: "", TEST_OWNER_DATABASE_URL: "", SEED_PASSWORD: "" },
  },
});
