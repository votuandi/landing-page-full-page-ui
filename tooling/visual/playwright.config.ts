import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: ".",
  testMatch: ["visual.spec.ts", "lab.spec.ts"],
  fullyParallel: true,
  // Keep Playwright's default; allow constrained local machines to limit browser processes.
  workers: process.env.VISUAL_WORKERS ? Number(process.env.VISUAL_WORKERS) : undefined,
  retries: 0,
  timeout: 60_000,
  // Comparison never creates or replaces a baseline; the CLI update flag overrides this.
  updateSnapshots: "none",
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}",
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],
  expect: {
    timeout: 15_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
      scale: "css",
    },
  },
  use: {
    browserName: "chromium",
    baseURL: "http://localhost:3210",
    contextOptions: { reducedMotion: "reduce" },
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
  },
  projects: [390, 1440].flatMap((width) =>
    (["light", "dark"] as const).map((theme) => ({
      name: `${width === 390 ? "mobile-390" : "desktop-1440"}-${theme}`,
      use: { viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme },
    })),
  ),
  webServer: {
    command: "pnpm --filter web start --port 3210",
    // CI's first run uses this harness against merge-base, where tooling/visual may not exist yet.
    cwd: process.env.VISUAL_WEB_ROOT || resolve(__dirname, "../.."),
    url: "http://localhost:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
