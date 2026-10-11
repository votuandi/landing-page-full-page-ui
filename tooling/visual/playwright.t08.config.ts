import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: ".", testMatch: "t08.spec.ts", workers: 1, retries: 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/t08",
  use: { baseURL: "http://localhost:3008", browserName: "chromium", contextOptions: { reducedMotion: "reduce" }, locale: "vi-VN", actionTimeout: 15_000 },
  expect: { timeout: 15_000 },
  webServer: {
    command: "pnpm --filter web dev --port 3008", cwd: resolve(__dirname, "../.."),
    url: "http://localhost:3008", reuseExistingServer: !process.env.CI, timeout: 120_000,
    env: { LAB_ENABLED: "true" },
  },
});
