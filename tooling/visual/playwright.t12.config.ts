import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: ".", testMatch: "t12.spec.ts", workers: 1, retries: 0, timeout: 90_000,
  reporter: "list", outputDir: "test-results/t12",
  use: { baseURL: "http://localhost:3012", browserName: "chromium", viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: "reduce" }, locale: "vi-VN", actionTimeout: 15_000 },
  expect: { timeout: 15_000 },
  webServer: {
    command: "pnpm --filter web dev --port 3012", cwd: resolve(__dirname, "../.."),
    url: "http://localhost:3012", reuseExistingServer: !process.env.CI, timeout: 120_000,
    env: { LAB_ENABLED: "true" },
  },
});
