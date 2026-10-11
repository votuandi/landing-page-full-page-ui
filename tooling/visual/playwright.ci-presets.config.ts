import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".", testMatch: "ci-presets.spec.ts", workers: 1,
  timeout: 120_000, reporter: "list", outputDir: "test-results/ci-presets",
  use: {
    baseURL: process.env.CI_PRESETS_URL ?? "http://localhost:3005",
    browserName: "chromium", contextOptions: { reducedMotion: "reduce" }, locale: "vi-VN",
    deviceScaleFactor: 1, trace: "retain-on-failure",
  },
});
