import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

const webServer = config.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error("matrix dùng một webServer từ config chính");

export default defineConfig({
  ...config,
  testMatch: ["matrix.spec.ts"],
  fullyParallel: true,
  // Ô thiếu baseline được spec bỏ qua so ảnh (không fail); chỉ CLI --update-snapshots ghi ảnh.
  updateSnapshots: "none",
  projects: config.projects?.map((project) => ({ ...project, name: `matrix-${project.name}` })),
  webServer: { ...webServer, env: { ...webServer.env, LAB_ENABLED: "true" } },
  outputDir: "test-results/matrix",
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }], ["list"],
    ["json", { outputFile: "test-results/matrix-run.json" }],
  ],
});
