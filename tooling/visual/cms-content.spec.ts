import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("t15-consult-shown", "1"));
});
async function hydrateForm(page: Page) {
  const en = page.getByRole("button", { name: "Tiếng Anh", exact: true }).first();
  await en.click(); await expect(en).toHaveAttribute("aria-pressed", "true");
  const vi = page.getByRole("button", { name: "Tiếng Việt", exact: true }).first();
  await vi.click(); await expect(vi).toHaveAttribute("aria-pressed", "true");
}

for (const width of [390, 1440]) for (const colorScheme of ["light", "dark"] as const) {
  test(`${width} ${colorScheme}: content editor keyboard, status, preview and axe`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.addInitScript(theme => localStorage.setItem("t15-theme", theme), colorScheme);
    await page.goto("/lab/cms-content", { waitUntil: "networkidle" });
    // Isolate the CMS lab from the public site's fixed widgets (same capture policy as the section matrix).
    await page.addStyleTag({ content: "body > [data-widget] { display: none !important; }" });
    await hydrateForm(page);
    await expect(page.getByRole("heading", { name: "[DỮ LIỆU MẪU] Sửa nội dung section", exact: true })).toBeVisible();
    const editor = page.getByTestId("content-editor"), input = editor.getByRole("textbox", { name: "Nhãn nổi bật", exact: true });
    await input.focus(); await page.keyboard.press("End"); await page.keyboard.type(" Test");
    await expect(editor.getByRole("status").filter({ hasText: "Đã lưu nháp" })).toBeVisible();
    if (width === 390) await editor.getByRole("button", { name: "Xem trước", exact: true }).click();
    await expect(page.locator('iframe[title="Xem trước nội dung section"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).include('[data-testid="content-editor"]').withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
    expect(errors).toEqual([]);
    const folder = resolve(__dirname, "../../.agent-runs/E7-S05/screenshots"); await mkdir(folder, { recursive: true });
    await page.screenshot({ path: resolve(folder, `${width}-${colorScheme}.png`), fullPage: true });
  });
}
test("content editor warns before leaving while dirty", async ({ page }) => {
  await page.goto("/lab/cms-content", { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "body > [data-widget] { display: none !important; }" });
  await hydrateForm(page);
  await page.locator('input[id$="-rating.score"]').fill("bad");
  await expect(page.getByTestId("content-editor").getByRole("status").filter({ hasText: "Có lỗi cần sửa — chưa lưu" })).toBeVisible();
  page.once("dialog", d => { expect(d.type()).toBe("confirm"); void d.dismiss(); });
  await page.getByRole("link", { name: "Về bố cục trang" }).click();
  await expect(page).toHaveURL(/\/lab\/cms-content$/);
});
