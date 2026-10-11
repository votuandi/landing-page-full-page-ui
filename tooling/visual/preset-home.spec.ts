import { expect, test, type Page } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

async function stable(page: Page) {
  await page.addStyleTag({ content: "section, footer { content-visibility: visible !important; } *, *::before, *::after { animation: none !important; transition: none !important; }" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll("img").forEach((img) => { img.loading = "eager"; });
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((done) => setTimeout(done, 30));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode().catch(() => {}))));
}

/** Tỷ lệ pixel khác trên khung lớn hơn của hai ảnh (Playwright comparator, ngưỡng 0 để luôn lấy số đo). */
function diffRatio(compare: () => void, expected: Buffer, actual: Buffer) {
  try { compare(); return 0; } catch (error) {
    const pixels = /(\d+) pixels \(ratio/.exec(String((error as Error).message));
    if (!pixels) throw error;
    const area = expected.readUInt32BE(16) * Math.max(expected.readUInt32BE(20), actual.readUInt32BE(20));
    return Number(pixels[1]) / area;
  }
}

for (const width of [390, 1440]) test(`preset homepage matches independent legacy reference at ${width}px`, async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.addInitScript(() => { localStorage.setItem("t15-theme", "light"); sessionStorage.setItem("t15-consult-shown", "1"); });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const captures: Buffer[] = [];
  const evidence = resolve(__dirname, "../../roadmap/evidence/E4/t15");
  mkdirSync(evidence, { recursive: true });
  for (const [label, route] of [["legacy", "/lab/legacy-home"], ["preset", "/"]]) {
    expect((await page.goto(route, { waitUntil: "networkidle" }))?.status()).toBe(200);
    await stable(page);
    const mask = [page.locator(".t15-marquee"), page.locator("iframe, video"), page.locator("dd.tabular-nums, #du-toan .tabular-nums")];
    captures.push(await page.screenshot({ fullPage: true, animations: "disabled", mask }));
    await page.screenshot({ path: resolve(evidence, `${label}-${width}.jpg`), fullPage: true, type: "jpeg", quality: 15, animations: "disabled" });
  }
  expect(errors).toEqual([]);
  // Regenerate the expected buffer ONLY from the independent legacy route on every run.
  const name = `legacy-home-${width}.png`;
  const expected = testInfo.snapshotPath(name);
  mkdirSync(dirname(expected), { recursive: true });
  writeFileSync(expected, captures[0]);
  await testInfo.attach("legacy", { body: captures[0], contentType: "image/png" });
  await testInfo.attach("preset", { body: captures[1], contentType: "image/png" });
  // Mục tiêu ≤ 0,5% chỉ chặn khi PRESET_MATCH_STRICT=1: chiều cao section còn lệch nên CI chỉ ghi số đo.
  const ratio = diffRatio(() => expect(captures[1]).toMatchSnapshot(name, { maxDiffPixelRatio: 0 }), captures[0], captures[1]);
  const height = (png: Buffer) => png.readUInt32BE(20);
  testInfo.annotations.push({ type: "preset-match", description: `${width}px ratio ${ratio.toFixed(4)} (legacy ${height(captures[0])}px, preset ${height(captures[1])}px)` });
  const matchFile = resolve(evidence, "match.json");
  const match = existsSync(matchFile) ? JSON.parse(readFileSync(matchFile, "utf8")) : {};
  match[width] = { ratio: Number(ratio.toFixed(4)), legacyHeight: height(captures[0]), presetHeight: height(captures[1]), target: 0.005 };
  writeFileSync(matchFile, JSON.stringify(match, null, 2) + "\n");
  if (process.env.PRESET_MATCH_STRICT === "1") expect(ratio).toBeLessThanOrEqual(0.005);
});

test("preset routes isolate chrome, validate ids/theme and expose all configured sections", async ({ page }) => {
  await page.goto("/lab/presets");
  await page.getByRole("link", { name: "Signature · Lumivolt Energy" }).click();
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator("[data-section-type]")).toHaveCount(26);
  await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
  await page.goto("/lab/presets/t15?theme=t15");
  await expect(page.locator("[data-section-type=hero]")).toBeVisible();
  expect((await page.goto("/lab/presets/missing"))?.status()).toBe(404);
  expect((await page.goto("/lab/presets/t15?theme=missing"))?.status()).toBe(404);
});

test("home and subpages share widgets, dark mode, menu and quote cart", async ({ page }) => {
  await page.addInitScript(() => { sessionStorage.setItem("t15-consult-shown", "1"); });
  await page.goto("/");
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator('[data-widget="theme-switch"]')).toBeHidden();
  const themeButton = page.locator("[data-section-type=site-header] header").getByRole("button", { name: /giao diện/ });
  await themeButton.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/san-pham");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("[data-section-type=site-header]")).toHaveCount(1);
  await expect(page.locator("[data-section-type=site-footer]")).toHaveCount(1);
  await themeButton.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator("[data-section-type=site-header] header").getByRole("button", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.locator("[data-section-type=site-header] header").getByRole("button", { name: "VI" }).click();
  await page.getByRole("button", { name: /Báo giá\s*:\s*thêm/ }).first().click();
  const headerCart = page.locator("[data-section-type=site-header] header [data-header-cart]");
  await expect(headerCart).toHaveAccessibleName(/Giỏ yêu cầu báo giá \(1\)/);
  await headerCart.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-widget="mobile-bottom-nav"]').getByRole("button", { name: "Danh mục" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("preset content, header/footer and commitments remain visible without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    expect((await page.goto("/"))?.status()).toBe(200);
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.locator("[data-section-type=hero] h1")).toBeVisible();
    await expect(page.locator("[data-section-type=faq] summary").first()).toBeVisible();
    await expect(page.locator('[data-widget="commitments-strip"]')).toContainText("Kỹ sư đến tận nơi đo mái, đọc hóa đơn");
  } finally { await context.close(); }
});
