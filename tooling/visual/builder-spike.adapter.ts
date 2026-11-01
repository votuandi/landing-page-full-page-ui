import type { Page } from "@playwright/test";

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
};

const missing = async () => { throw new Error("Demo chưa cài adapter"); };
export const adapter: BuilderAdapter = { dragFromLibrary: missing, drag: missing, addByKeyboard: missing, moveByKeyboard: missing, select: missing };
