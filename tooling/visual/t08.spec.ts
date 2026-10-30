import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const evidence = resolve(__dirname, "../../roadmap/evidence/E4/t08");
const route = "/lab/presets/t08";

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

for (const width of [390, 1440]) test(`t08 preset and t15 override render at ${width}px and capture after JPEG`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.addInitScript(() => { localStorage.setItem("t15-theme", "light"); });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const primary: string[] = [];
  mkdirSync(evidence, { recursive: true });
  for (const [label, url] of [["after", route], ["theme-t15", route + "?theme=t15"]]) {
    expect((await page.goto(url, { waitUntil: "networkidle" }))?.status()).toBe(200);
    await stable(page);
    await expect(page.locator("[data-section-type]")).toHaveCount(15);
    await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator('[data-section-type="segments"] section')).toHaveCount(4);
    await expect(page.locator('[data-section-type="projects"] h3')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await page.locator("img").evaluateAll((imgs) => imgs.filter((img) => !(img as HTMLImageElement).naturalWidth).map((img) => img.getAttribute("src")))).toEqual([]);
    primary.push(await page.locator('[data-section-type="energy-monitoring"] section').evaluate((el) => getComputedStyle(el).backgroundColor));
    await page.screenshot({ path: resolve(evidence, `${label}-${width}.jpg`), fullPage: true, type: "jpeg", quality: 15, animations: "disabled" });
  }
  expect(primary[0]).not.toBe(primary[1]);
  expect(errors).toEqual([]);
});

test("t08 segment CTA selects its estimator and shared lead form submits its configured source", async ({ page }) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const segment = page.locator('[data-section-type="segments"] section').nth(1).getByRole("link");
  await segment.click();
  await expect(segment).toHaveAttribute("aria-current", "true");
  await expect(page).toHaveURL(/phan-khuc=factory/);
  const calculator = page.locator('[data-section-type="calculator"]');
  await calculator.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(calculator.getByLabel("Tiền điện trung bình mỗi tháng", { exact: true })).toHaveValue("80.000.000");
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/lead", async (request) => {
    payload = request.request().postDataJSON();
    await request.fulfill({ json: { ok: true } });
  });
  const form = page.locator('[data-section-type="lead-form"]');
  await form.getByLabel("Họ và tên").fill("[DỮ LIỆU MẪU] Khách t08");
  await form.getByLabel("Số điện thoại di động").fill("0901234567");
  await form.locator('[name="consent"]').check();
  await form.getByRole("button", { name: "Nhận báo giá chi tiết" }).click();
  await expect(form.getByRole("status")).toBeVisible();
  expect(payload?.source).toBe("home-bottom");
  expect(payload?.phone).toBe("0901234567");
});

test("t08 content and segment links remain visible without JavaScript; matrix lists both new variants", async ({ browser, page, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  try {
    const staticPage = await context.newPage();
    expect((await staticPage.goto(baseURL + route))?.status()).toBe(200);
    await expect(staticPage.locator('[data-section-type="hero"] h1')).toBeVisible();
    await expect(staticPage.locator('[data-section-type="segments"] h3')).toHaveCount(3);
    await expect(staticPage.locator('[data-section-type="energy-monitoring"] h2')).toBeVisible();
    await expect(staticPage.locator('[data-section-type="lead-form"] input[name="phone"]')).toBeVisible();
  } finally { await context.close(); }
  await page.goto("/lab/sections/matrix", { waitUntil: "networkidle" });
  for (const type of ["segments", "energy-monitoring"]) {
    await expect(page.locator("li").filter({ has: page.locator(`[data-lab-type="${type}"]`) })).toContainText("t08");
  }
  const total = [390, 1440].reduce((bytes, width) => bytes + statSync(resolve(evidence, `after-${width}.jpg`)).size, 0);
  expect(total).toBeLessThan(3_000_000);
});

test("both t08 variants render in dark mode under t08, t12 and t15", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("t15-theme", "dark"); });
  for (const theme of ["t08", "t12", "t15"]) {
    expect((await page.goto(`${route}?theme=${theme}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator('[data-section-type="segments"] h3')).toHaveCount(3);
    await expect(page.locator('[data-section-type="energy-monitoring"] h2')).toBeVisible();
    await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
  }
});
