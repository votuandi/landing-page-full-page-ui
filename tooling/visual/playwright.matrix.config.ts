import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

const webServer = config.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error("matrix dùng một webServer từ config chính");

export default defineConfig({
  ...config,
  testMatch: ["matrix.spec.ts", "matrix-setup.spec.ts"],
  fullyParallel: true,
  updateSnapshots: "none",
  projects: [
    { name: "matrix-setup", testMatch: "matrix-setup.spec.ts" },
    ...config.projects!.map((project) => ({ ...project, name: `matrix-${project.name}`,
      testMatch: "matrix.spec.ts", dependencies: ["matrix-setup"] })),
  ],
  webServer: { ...webServer, env: { ...webServer.env, LAB_ENABLED: "true" } },
  outputDir: "test-results/matrix",
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }], ["list"],
    ["json", { outputFile: "test-results/matrix-run.json" }],
  ],
});
