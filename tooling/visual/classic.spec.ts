import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const ids = ["t01", "t02", "t03", "t04"];

async function stable(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; } section, footer { content-visibility: visible !important; } *, *::before, *::after { animation: none !important; transition: none !important; }" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Scroll to load lazy media without changing attributes owned by React hydration.
    for (const el of document.querySelectorAll<HTMLElement>("div")) {
      const width = el.clientWidth;
      if (!width || !["auto", "scroll"].includes(getComputedStyle(el).overflowX) || el.scrollWidth <= width) continue;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      for (let x = 0; x < el.scrollWidth; x += width) {
        el.scrollTo({ left: x, behavior: "instant" });
        await new Promise((done) => setTimeout(done, 60));
      }
      el.scrollTo({ left: 0, behavior: "instant" });
    }
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((done) => setTimeout(done, 30));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  expect(await page.evaluate(() => [...document.images].filter((img) => img.naturalWidth === 0).map((img) => img.src))).toEqual([]);
}

for (const id of ids) for (const width of [390, 1440]) test(`${id} preset and t15 theme render at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const evidence = resolve(__dirname, `../../roadmap/evidence/E4/${id}`);
  mkdirSync(evidence, { recursive: true });
  for (const override of [false, true]) {
    expect((await page.goto(`/lab/presets/${id}${override ? "?theme=t15" : ""}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
    await stable(page);
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
    await expect(page.locator('[data-section-type="calculator"], [data-section-type="products"], [data-section-type="packages"], [data-section-type="stats"], [data-section-type="faq"], [data-section-type="testimonials"], [data-section-type="lead-form"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(evidence, `after-${override ? "t15-" : ""}${width}.jpg`), fullPage: true, type: "jpeg", quality: 15, animations: "disabled" });
  }
  expect(errors).toEqual([]);
});

test("Classic source order, slider controls, mobile menu and subpage hero", async ({ page }) => {
  await page.goto("/lab/presets/t01");
  const hero = page.locator('[data-section-type="hero"]');
  const track = hero.locator("[tabindex='0']");
  await hero.getByRole("button", { name: "Hiển thị banner 2" }).click();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await hero.getByRole("button", { name: "Tạm dừng" }).click();
  await expect(hero.getByRole("button", { name: "Tiếp tục" })).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("header summary").filter({ hasText: "Danh mục" }).click();
  await expect(page.getByRole("navigation", { name: "Điều hướng di động" })).toBeVisible();
  expect(await page.locator("[data-section-type]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section-type")))).toEqual(["site-header", "hero", "about-story", "brands", "projects", "blog", "site-footer"]);
  await page.goto("/lab/presets/t03?subpage=gioi-thieu&theme=t15");
  await expect(page.locator('[data-section-type="page-hero"] h1')).toHaveText("Giới thiệu");
  await expect(page.locator('[data-section-type="hero"]')).toHaveCount(0);
  expect((await page.goto("/lab/presets/t03?subpage=missing"))?.status()).toBe(404);
  await page.goto("/lab/sections/matrix");
  await expect(page.locator('[data-lab-type="page-hero"]')).toBeVisible();
  for (const id of ids) await expect(page.locator("main")).toContainText(id);
});

test("Classic content and t02 disclosures work without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    for (const id of ids) {
      expect((await page.goto(`/lab/presets/${id}`))?.status()).toBe(200);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    }
    await page.goto("/lab/sections/faq?variant=t02&themes=t02");
    const details = page.locator('[data-section-type="faq"] details').first();
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(details.locator("p")).toBeVisible();
  } finally { await context.close(); }
});

test("all Classic JPEG evidence stays under 3 MB per preset", () => {
  for (const id of ids) {
    const directory = resolve(__dirname, `../../roadmap/evidence/E4/${id}`);
    const files = readdirSync(directory).filter((file) => file.endsWith(".jpg"));
    expect(files).toContain("after-390.jpg");
    expect(files).toContain("after-1440.jpg");
    expect(files.reduce((size, file) => size + statSync(resolve(directory, file)).size, 0)).toBeLessThan(3_000_000);
  }
});
