import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

process.env.REVALIDATE_SECRET ??= "turnstile-e2e-revalidate-secret-0123456789";
process.env.TENANT_PUBLIC_PORT = "3213";
process.env.STORAGE_DRIVER ??= "local";
process.env.STORAGE_LOCAL_ROOT ??= resolve(__dirname, "test-results/turnstile/media");
// The tenant fixture script validates storage config; images are not served in this suite.
process.env.MEDIA_PUBLIC_BASE ??= "http://localhost:3212/media";

// Run sequentially after tenant: both suites use apps/web/.next.
export default defineConfig({
  testDir: ".", testMatch: "turnstile.spec.ts", workers: 1, retries: process.env.CI ? 1 : 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/turnstile", expect: { timeout: 20_000 },
  use: { browserName: "chromium", viewport: { width: 1440, height: 900 }, locale: "vi-VN", trace: "retain-on-failure", screenshot: "only-on-failure",
    contextOptions: { reducedMotion: "reduce" }, launchOptions: { args: ["--host-resolver-rules=MAP *.localhost 127.0.0.1"] } },
  webServer: {
    command: "pnpm --filter web dev --port 3213", cwd: resolve(__dirname, "../.."), url: "http://localhost:3213/favicon.svg", reuseExistingServer: false, timeout: 120_000,
    env: { MULTI_TENANT: "1", TENANT_PUBLIC_PORT: "3213", TURNSTILE_SITE_KEY: "1x00000000000000000000AA", TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET, PLATFORM_DATABASE_URL: "", MIGRATION_DATABASE_URL: "", TEST_OWNER_DATABASE_URL: "", SEED_PASSWORD: "" },
  },
});
