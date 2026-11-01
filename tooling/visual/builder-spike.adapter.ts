import { expect, type Locator, type Page } from "@playwright/test";

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

const rows = (page: Page) => page.getByTestId("section");
// Attribute locator works for ids containing punctuation, without interpolating CSS.
async function sectionRow(page: Page, id: string) {
  const list = rows(page);
  const index = (await list.evaluateAll(elements => elements.map(el => el.getAttribute("data-section-id")))).indexOf(id);
  if (index < 0) throw new Error(`Không tìm thấy section ${id}`);
  return list.nth(index);
}

async function pointerDrag(page: Page, source: Locator, target: Locator, before: boolean) {
  // Đo trước khi nhấn: cuộn giữa lúc kéo làm boundingBox trả tọa độ sai.
  await source.scrollIntoViewIfNeeded();
  const start = await source.boundingBox(), end = await target.boundingBox();
  if (!start || !end) throw new Error("Không xác định được vị trí kéo/thả");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 8, start.y + start.height / 2, { steps: 4 });
  try {
    await page.mouse.move(end.x + end.width / 2, end.y + end.height * (before ? 0.25 : 0.5), { steps: 20 });
    await page.waitForTimeout(150); // dnd-kit tính vùng thả theo khung hình; người thật luôn dừng trước khi nhả
  } finally { await page.mouse.up(); }
}

export const adapter: BuilderAdapter = {
  async dragFromLibrary(page, type, targetIndex) {
    const count = await rows(page).count();
    if (targetIndex < 0 || targetIndex > count) throw new Error("Vị trí chèn ngoài danh sách");
    const source = page.getByTestId(`lib-${type}`);
    const target = targetIndex === count ? page.getByTestId("section-end") : rows(page).nth(targetIndex);
    await pointerDrag(page, source, target, true);
    await expect(rows(page)).toHaveCount(count + 1);
    await expect(rows(page).nth(targetIndex)).toHaveAttribute("data-section-type", type);
  },
  async drag(page, sectionId, targetIndex) {
    const sourceRow = await sectionRow(page, sectionId);
    const target = rows(page).nth(targetIndex);
    await pointerDrag(page, sourceRow.getByRole("button", { name: /^Kéo để sắp xếp:/ }), target, false);
    await expect(rows(page).nth(targetIndex)).toHaveAttribute("data-section-id", sectionId);
  },
  async addByKeyboard(page, type) {
    const count = await rows(page).count();
    await page.getByTestId(`lib-${type}`).focus();
    await page.keyboard.press("Enter");
    await expect(rows(page)).toHaveCount(count + 1);
    await expect(rows(page).last()).toHaveAttribute("data-section-type", type);
  },
  async moveByKeyboard(page, sectionId, targetIndex) {
    const source = await sectionRow(page, sectionId);
    const current = (await rows(page).evaluateAll(elements => elements.map(el => el.getAttribute("data-section-id")))).indexOf(sectionId);
    if (targetIndex < 0 || targetIndex >= await rows(page).count()) throw new Error("Vị trí sắp xếp ngoài danh sách");
    if (current === targetIndex) return;
    await source.getByRole("button", { name: /^Kéo để sắp xếp:/ }).focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(150); // KeyboardSensor chỉ nhận phím sau khi đã nhấc lên
    try {
      const step = targetIndex > current ? 1 : -1;
      for (let position = current + step; step > 0 ? position <= targetIndex : position >= targetIndex; position += step) {
        await page.keyboard.press(step > 0 ? "ArrowDown" : "ArrowUp");
        await page.waitForTimeout(150);
        // Mỗi DndContext có một live region riêng: chỉ cần một vùng thông báo đúng vị trí.
        await expect(page.locator('[id^="DndLiveRegion-"]').filter({ hasText: `vị trí ${position + 1}` }).first()).toBeAttached();
      }
      await page.keyboard.press("Space");
    } catch (error) { await page.keyboard.press("Escape"); throw error; }
    await expect(rows(page).nth(targetIndex)).toHaveAttribute("data-section-id", sectionId);
  },
  async selectByKeyboard(page, sectionId) {
    await (await sectionRow(page, sectionId)).getByRole("button", { name: /^Chọn / }).focus();
    await page.keyboard.press("Enter");
    await page.getByLabel("Kiểu hiển thị").waitFor();
  },
  async select(page, sectionId) {
    await (await sectionRow(page, sectionId)).getByRole("button", { name: /^Chọn / }).click();
  },
};
