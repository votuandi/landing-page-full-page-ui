import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
import { appServer } from "./appServer";

process.env.REVALIDATE_SECRET ??= "preview-e2e-revalidate-secret-0123456789";
process.env.PREVIEW_SECRET ??= "preview-e2e-cookie-secret-0123456789abcdef";
process.env.TENANT_PUBLIC_PORT = "3212";

const platformDomain = process.env.E2E_PLATFORM_DOMAIN ??= "solar.example.com";

export default defineConfig({
  testDir: ".", testMatch: "preview.spec.ts", workers: 1, retries: process.env.CI ? 1 : 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/preview", expect: { timeout: 20_000 },
  use: { viewport: { width: 1440, height: 900 }, locale: "vi-VN", navigationTimeout: 60_000,
    contextOptions: { reducedMotion: "reduce" }, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { browserName: "chromium", launchOptions: { args: [
      `--host-resolver-rules=MAP *.${platformDomain} 127.0.0.1`,
      // LNA permission for the intercepted HTTP parent needs the secure-context trust localhost had.
      `--unsafely-treat-insecure-origin-as-secure=http://preview-e5-t15.admin.${platformDomain}:3212`,
    ] } } },
    { name: "webkit", use: { browserName: "webkit" } },
    { name: "firefox", use: { browserName: "firefox" } },
  ],
  webServer: {
    command: appServer("web", 3212), cwd: resolve(__dirname, "../.."),
    url: "http://localhost:3212/favicon.svg", reuseExistingServer: !process.env.CI, timeout: 120_000,
    // libsoup needs a PSL suffix (com); unknown localhost suffixes fall back to comparing full hosts.
    env: { MULTI_TENANT: "1", PLATFORM_DOMAIN: platformDomain, PREVIEW_SECRET: process.env.PREVIEW_SECRET,
      TENANT_PUBLIC_PORT: "3212", REVALIDATE_SECRET: process.env.REVALIDATE_SECRET, PLATFORM_DATABASE_URL: "",
      MIGRATION_DATABASE_URL: "", TEST_OWNER_DATABASE_URL: "", SEED_PASSWORD: "" },
  },
});
