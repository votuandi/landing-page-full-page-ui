import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** E7-S03: form CMS tự sinh trong Next thật — hydrate, bàn phím/kéo thả, reduced motion, a11y, 390/1440. */
async function open(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/lab/cms-form", { waitUntil: "networkidle" });
  // Hydrate xong mới gõ được: ô số đổi giá trị trong state React.
  await expect(page.getByRole("button", { name: "Kiểm tra" })).toBeEnabled();
  return errors;
}

const price = (page: Page, i: number) => page.locator(`[id$="-tariffs.household.tiers.${i}.price"]`);
/** Danh sách > 3 mục mặc định thu gọn: mở bằng nút tiêu đề (aria-expanded). */
async function expandTier(page: Page, n: number) {
  const toggle = page.getByRole("button", { name: new RegExp(`^Bậc giá ${n} ·`) });
  if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
}

for (const width of [390, 1440]) {
  test(`form dự toán ${width}px: hydrate không lỗi, không tràn ngang, axe sạch`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const errors = await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
    await testInfo.attach(`cms-form-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("sửa giá điện bằng bàn phím, nhập sai bị chặn, lưu ra dữ liệu đúng", async ({ page }) => {
  const errors = await open(page);
  const submit = page.getByRole("button", { name: "Kiểm tra" });
  await expandTier(page, 1);
  await price(page, 0).fill("abc");
  await expect(price(page, 0)).toHaveAttribute("aria-invalid", "true");
  await expect(submit).toBeDisabled();
  await price(page, 0).fill("1 999");
  await page.locator('[id$="-pricePerKwp.household"]').fill("11 500 000");
  await page.locator('[id$="-system.performanceRatio"]').fill("0,82");
  await expect(submit).toBeEnabled();
  await submit.click();
  const saved = JSON.parse(await page.getByTestId("cms-form-saved").textContent() ?? "{}");
  expect(saved.tariffs.household.tiers[0].price).toBe(1999);
  expect(saved.pricePerKwp.household).toBe(11_500_000);
  expect(saved.system.performanceRatio).toBe(0.82);
  expect(errors).toEqual([]);
});

test("sắp xếp bậc giá bằng bàn phím (dnd-kit) và bằng chuột; reduced motion tắt transition", async ({ page }) => {
  await open(page);
  await expandTier(page, 1);
  await expandTier(page, 2);
  const first = await price(page, 0).inputValue();
  const second = await price(page, 1).inputValue();
  const handle = page.getByRole("button", { name: "Kéo để sắp xếp: Bậc giá 1" });
  await handle.focus();
  const live = (text: string) => page.locator('[role="status"][aria-live]', { hasText: text });
  await page.keyboard.press("Space");
  await expect(live("Đang ở vị trí 1")).toHaveCount(1);
  const item = page.locator("li", { has: handle });
  expect(await item.evaluate((el) => (el as HTMLElement).style.transition)).toBe("");
  await page.keyboard.press("ArrowDown");
  await expect(live("Đang ở vị trí 2")).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(live("Đã thả vào vị trí 2")).toHaveCount(1);
  await expect(price(page, 0)).toHaveValue(second);
  await expect(price(page, 1)).toHaveValue(first);

  const from = await page.getByRole("button", { name: "Kéo để sắp xếp: Bậc giá 1" }).boundingBox();
  const to = await page.getByRole("button", { name: "Kéo để sắp xếp: Bậc giá 2" }).boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2 + 10, { steps: 8 });
  await page.mouse.up();
  await expect(price(page, 0)).toHaveValue(first);
});

test("focus thấy được khi dùng Tab", async ({ page }) => {
  await open(page);
  await page.locator('[id$="-eyebrow"]').focus();
  await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return { tag: el.tagName, visible: style.outlineStyle !== "none" || style.boxShadow !== "none" };
  });
  expect(ring.visible).toBe(true);
});
