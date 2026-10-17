import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";

async function open(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.goto("/lab/cms-sections", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Lưu nháp", exact: true })).toBeDisabled();
  return errors;
}
const rows = (page: Page) => page.locator("li[data-section-id]");
for (const width of [390, 1440]) for (const colorScheme of ["light", "dark"] as const) {
  test(`${width} ${colorScheme}: hydrate, responsive, axe and focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.addInitScript(scheme => localStorage.setItem("t15-theme", scheme), colorScheme);
    const errors = await open(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    expect((await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await page.getByRole("button", { name: /^Kéo để sắp xếp:/ }).first().focus();
    expect(await page.evaluate(() => { const s = getComputedStyle(document.activeElement!); return s.outlineStyle !== "none" || s.boxShadow !== "none"; })).toBe(true);
    expect(errors).toEqual([]);
    const folder = resolve(__dirname, "../../.agent-runs/E7-S04/screenshots"); await mkdir(folder, { recursive: true });
    await page.screenshot({ path: resolve(folder, `${width}-${colorScheme}.png`), fullPage: true });
  });
}
test("keyboard reorder and pointer reorder, reduced motion", async ({ page }) => {
  await open(page);
  const handles = page.getByRole("button", { name: /^Kéo để sắp xếp:/ });
  await handles.first().focus(); await page.keyboard.press("Space");
  await expect(page.locator('[role="status"][aria-live]', { hasText: "Đang ở section hero" })).toHaveCount(1);
  expect(await rows(page).first().evaluate(el => (el as HTMLElement).style.transition)).toBe("");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[role="status"][aria-live]', { hasText: "Đang ở section calculator" })).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(rows(page).first()).toHaveAttribute("data-section-id", "calculator");
  const from = await handles.first().boundingBox(), to = await handles.nth(1).boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2); await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2 + 10, { steps: 10 }); await page.mouse.up();
  await expect(rows(page).first()).toHaveAttribute("data-section-id", "hero");
});
test("toggle, switch variant, save, add, remove and limit locks", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("button", { name: "Thêm Dự toán chi phí", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Thêm Video công trình", exact: true })).toBeDisabled();
  const hero = rows(page).first();
  await hero.getByRole("switch").click(); await expect(hero.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  await hero.getByLabel("Đổi kiểu hiển thị: Banner chính").selectOption("t15");
  await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
  await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Đã lưu nháp" })).toHaveCount(1);
  const saved = JSON.parse(await page.getByTestId("sections-saved").textContent() ?? "[]");
  expect(saved[0]).toMatchObject({ id: "hero", variant: "t15", enabled: false });
  await page.getByRole("button", { name: "Thêm Công trình đã thực hiện", exact: true }).click(); await expect(rows(page)).toHaveCount(3);
  page.on("dialog", d => d.accept()); await rows(page).last().getByRole("button", { name: /^Xóa:/ }).click(); await expect(rows(page)).toHaveCount(2);
});
test("legacy overflow disables saving and no-JS content stays visible", async ({ page, browser }) => {
  await open(page); await page.getByRole("button", { name: "Nạp dữ liệu vượt giới hạn" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText('Chỉ được có tối đa 1 "Dự toán chi phí"');
  await expect(page.getByRole("button", { name: "Lưu nháp", exact: true })).toBeDisabled();
  const context = await browser.newContext({ javaScriptEnabled: false });
  try { const plain = await context.newPage(); await plain.goto("http://localhost:3210/lab/cms-sections"); await expect(plain.getByText("Banner chính", { exact: true })).toBeVisible(); }
  finally { await context.close(); }
});
