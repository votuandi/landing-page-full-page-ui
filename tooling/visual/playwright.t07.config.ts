import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: ".", testMatch: "t07.spec.ts", workers: 1, retries: 0, timeout: 120_000,
  reporter: "list", outputDir: "test-results/t07",
  use: { baseURL: "http://localhost:3007", browserName: "chromium", contextOptions: { reducedMotion: "reduce" }, locale: "vi-VN" },
  expect: { timeout: 20_000 },
  webServer: {
    command: "pnpm --filter web dev --port 3007 --webpack", cwd: resolve(__dirname, "../.."),
    url: "http://localhost:3007", reuseExistingServer: !process.env.CI, timeout: 120_000,
    env: { LAB_ENABLED: "true" },
  },
});
