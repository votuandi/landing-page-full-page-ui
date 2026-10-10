import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

const webServer = config.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error("sections dùng một webServer từ config chính");

export default defineConfig({
  ...config,
  testMatch: ["sections-bundle.spec.ts", "fields.spec.ts", "renderer.spec.ts", "conversion.spec.ts", "content.spec.ts", "premium.spec.ts", "widgets.spec.ts"],
  projects: [{ name: "desktop-1440-light", use: { viewport: { width: 1440, height: 900 }, colorScheme: "light" } }],
  webServer: { ...webServer, env: { ...webServer.env, LAB_ENABLED: "true" } },
  outputDir: "test-results/sections",
});
