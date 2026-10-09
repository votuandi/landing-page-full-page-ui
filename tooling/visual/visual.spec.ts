import { expect, test } from "@playwright/test";
import { routes } from "./routes";

for (const route of routes) {
  test(route, async ({ page, colorScheme }) => {
    const theme = colorScheme === "dark" ? "dark" : "light";
    await page.addInitScript((value) => {
      localStorage.setItem("t15-theme", value);
      localStorage.setItem("t15-lang", "vi");
      // Scrolling must not open the timed consultation dialog.
      sessionStorage.setItem("t15-consult-shown", "1");
    }, theme);

    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status(), `Route ${route} must exist with the baseline environment`).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    // The site's content-visibility optimization otherwise leaves offscreen sections unpainted.
    // Harness only: preserve the app's colors, typography and layout.
    await page.addStyleTag({
      content: "main > section:not(:first-child), footer { content-visibility: visible !important; }",
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((done) => setTimeout(done, 50));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
    await page.evaluate(() => Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => {}))));
    await page.mouse.move(-1, -1);
    expect(errors, "No browser runtime errors").toEqual([]);

    const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "__");
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      mask: [
        page.locator(".t15-marquee"),
        page.locator("iframe, video"),
        // Existing stable selectors cover counters without hiding their labels or entire sections.
        page.locator("[data-hero] dd.tabular-nums"),
        page.locator('section[aria-label="Số liệu nổi bật"] dd'),
        page.locator("#du-an dd, #dai-ly dd, #mang-xa-hoi .tabular-nums"),
        page.locator("#du-toan .tabular-nums"),
      ],
    });
  });
}
