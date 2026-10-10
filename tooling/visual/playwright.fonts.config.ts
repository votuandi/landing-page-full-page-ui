import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig(config, {
  testMatch: "fonts.spec.ts",
  reporter: [["list"]],
  outputDir: "test-results/fonts",
});
