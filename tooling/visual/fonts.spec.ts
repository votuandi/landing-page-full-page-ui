import { expect, test } from "@playwright/test";

test("theme t15 preload đúng 3 font và render glyph tiếng Việt", async ({ page, request }) => {
  const requested: string[] = [];
  const errors: string[] = [];
  page.on("request", (resource) => {
    const path = new URL(resource.url()).pathname;
    if (path.endsWith(".woff2")) requested.push(path);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const preloads = page.locator('link[rel="preload"][as="font"]');
  await expect(preloads).toHaveCount(3);
  const hrefs = await preloads.evaluateAll((links) => links.map((link) => link.getAttribute("href")!).sort());
  for (const [index, weight] of [400, 600, 800].entries()) {
    expect(hrefs[index]).toMatch(new RegExp(`^/fonts/be-vietnam-pro-${weight}\\.[0-9a-f]{8}\\.woff2$`));
  }
  for (const link of await preloads.all()) {
    await expect(link).toHaveAttribute("type", "font/woff2");
    // React serializes anonymous CORS as the equivalent empty HTML attribute.
    await expect(link).toHaveAttribute("crossorigin", /^(anonymous)?$/);
  }
  expect(requested.length).toBeGreaterThan(0);
  expect(requested.length).toBeLessThanOrEqual(4);
  expect(requested.every((path) => hrefs.includes(path))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('800 16px "Be Vietnam Pro"', "Tiết kiệm điện"))).toBe(true);
  expect(await page.evaluate(() => Array.from(document.fonts).some((font) =>
    font.family.replaceAll('"', "") === "Be Vietnam Pro" && font.weight === "800" && font.status === "loaded"))).toBe(true);
  expect(errors).toEqual([]);
  for (const href of hrefs) {
    const font = await request.get(href);
    expect(font.status()).toBe(200);
    expect(font.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  }
});
