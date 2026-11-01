import type { Locator, Page } from "@playwright/test";

/**
 * Phần duy nhất mỗi demo tự viết (spike E12-S01). DOM chung mà spec đọc:
 * `[data-testid="lib-<type>"]` (thư viện), `[data-testid="section"][data-section-id][data-section-type]` (theo thứ tự trang),
 * nhãn "Kiểu hiển thị", nút "Lưu nháp" / "Hoàn tác" / "Làm lại", iframe title "Xem trước", status "Đã lưu".
 */
export type BuilderAdapter = {
  dragFromLibrary(page: Page, type: string, targetIndex: number): Promise<void>;
  drag(page: Page, sectionId: string, targetIndex: number): Promise<void>;
  addByKeyboard(page: Page, type: string): Promise<void>;
  moveByKeyboard(page: Page, sectionId: string, targetIndex: number): Promise<void>;
  select(page: Page, sectionId: string): Promise<void>;
  selectByKeyboard(page: Page, sectionId: string): Promise<void>;
};

const dragTo = async (page: Page, from: Locator, to: Locator, after: boolean) => {
  await from.scrollIntoViewIfNeeded();
  const start = (await from.boundingBox())!, end = (await to.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 + 12, { steps: 4 });
  const y = after ? end.y + end.height - 4 : end.y + 4;
  await page.mouse.move(end.x + end.width / 2, y, { steps: 20 });
  await page.waitForTimeout(150);
  await page.mouse.move(end.x + end.width / 2, y + (after ? 1 : -1), { steps: 2 });
  await page.waitForTimeout(150);
  await page.mouse.up();
};
const cards = (page: Page) => page.locator('[data-testid="section"]');
const pressButton = async (button: Locator) => { await button.focus(); await button.press("Enter"); };

export const adapter: BuilderAdapter = {
  dragFromLibrary: async (page, type, targetIndex) => {
    const count = await cards(page).count(), after = targetIndex >= count;
    await dragTo(page, page.locator(`[data-testid="lib-${type}"]`).last(), cards(page).nth(after ? count - 1 : targetIndex), after);
  },
  drag: async (page, sectionId, targetIndex) => {
    const from = await cards(page).evaluateAll((list, id) => list.findIndex(el => (el as HTMLElement).dataset.sectionId === id), sectionId);
    await dragTo(page, page.locator(`[data-section-id="${sectionId}"]`), cards(page).nth(targetIndex), targetIndex > from);
  },
  addByKeyboard: async (page, type) => {
    const label = await page.locator(`[data-testid="lib-${type}"]`).first().innerText();
    await pressButton(page.getByRole("button", { name: `Thêm ${label.trim()}`, exact: true }));
  },
  moveByKeyboard: async (page, sectionId, targetIndex) => {
    for (;;) {
      const index = await cards(page).evaluateAll((list, id) => list.findIndex(el => (el as HTMLElement).dataset.sectionId === id), sectionId);
      if (index === targetIndex) return;
      await pressButton(page.getByRole("button", { name: `Đưa ${sectionId} ${index > targetIndex ? "lên" : "xuống"}`, exact: true }));
      await page.waitForTimeout(300); // Puck ghi lịch sử sau debounce 250 ms
    }
  },
  selectByKeyboard: async (page, sectionId) => {
    await pressButton(page.getByRole("button", { name: `Sửa ${sectionId}`, exact: true }));
    await page.getByLabel("Kiểu hiển thị").waitFor();
  },
  select: async (page, sectionId) => {
    await page.locator(`[data-section-id="${sectionId}"]`).click();
    await page.getByLabel("Kiểu hiển thị").waitFor();
  },
};
