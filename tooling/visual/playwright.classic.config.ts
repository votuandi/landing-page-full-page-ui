import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: ".", testMatch: "classic.spec.ts", workers: 1, retries: 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/classic",
  use: {
    baseURL: "http://localhost:3001", browserName: "chromium", locale: "vi-VN",
    viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: "reduce" },
  },
  expect: { timeout: 15_000 },
  webServer: {
    command: "pnpm --filter web dev --webpack --port 3001", cwd: resolve(__dirname, "../.."),
    url: "http://localhost:3001", reuseExistingServer: !process.env.CI, timeout: 120_000,
    env: { LAB_ENABLED: "true" },
  },
});
