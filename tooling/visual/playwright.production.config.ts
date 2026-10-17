import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

process.env.REVALIDATE_SECRET ??= "production-e5-revalidate-secret-0123456789";
process.env.PREVIEW_SECRET ??= "production-e5-preview-secret-0123456789abcdef";
process.env.E2E_PLATFORM_DOMAIN ??= "solar.example.com";
const root = resolve(__dirname, "../..");
const runtime = { REVALIDATE_SECRET: process.env.REVALIDATE_SECRET, PREVIEW_SECRET: process.env.PREVIEW_SECRET,
  PLATFORM_DOMAIN: process.env.E2E_PLATFORM_DOMAIN, TENANT_PUBLIC_PORT: "3210", PLATFORM_DATABASE_URL: "",
  MIGRATION_DATABASE_URL: "", TEST_OWNER_DATABASE_URL: "", SEED_PASSWORD: "" };

// Build once before this suite (CI db job); only runtime credentials reach either next start process.
export default defineConfig({
  testDir: ".", testMatch: "production.spec.ts", workers: 1, retries: 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/production", expect: { timeout: 20_000 },
  use: { browserName: "chromium", viewport: { width: 1440, height: 900 }, trace: "retain-on-failure", screenshot: "only-on-failure",
    launchOptions: { args: [`--host-resolver-rules=MAP *.${process.env.E2E_PLATFORM_DOMAIN} 127.0.0.1`] } },
  webServer: [
    { command: "pnpm --filter web start --port 3210", cwd: root, url: "http://localhost:3210/favicon.svg", reuseExistingServer: false, timeout: 120_000, env: { ...runtime, MULTI_TENANT: "1" } },
    { command: "pnpm --filter web start --port 3213", cwd: root, url: "http://localhost:3213/favicon.svg", reuseExistingServer: false, timeout: 120_000, env: { ...runtime, MULTI_TENANT: "0" } },
  ],
});
