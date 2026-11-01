import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { adapter } from "./builder-spike.adapter";

// Cùng một kịch bản cho cả hai demo; khác biệt nằm trong builder-spike.adapter.ts (E12-S01, không merge).
const platformDomain = process.env.ADMIN_E2E_PLATFORM_DOMAIN ?? "solar.localhost";
const origin = (slug = "admin-e7-a") => `http://${slug}.admin.${platformDomain}:3300`;
const password = () => `${process.env.SEED_PASSWORD!}-t15`;
const fixture = (...args: string[]) => execFileSync(process.execPath, ["--import", "tsx", "scripts/browser-fixture.ts", ...args], {
  cwd: resolve(__dirname, "../../apps/admin"), encoding: "utf8", timeout: 60_000, stdio: ["ignore", "pipe", "inherit"],
}).trim();

async function open(page: Page, slug = "admin-e7-a") {
  const pageId = fixture("builder-spike", slug);
  await page.goto(origin(slug) + "/dang-nhap");
  await page.getByLabel("Email, số điện thoại hoặc tên đăng nhập").fill("owner@demo.vn");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password());
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible({ timeout: 90_000 });
  await page.goto(`${origin(slug)}/trang/${pageId}/builder`);
  if (slug === "admin-e7-a") await expect(page.locator('[data-testid="section"]')).toHaveCount(4);
  return pageId;
}
const sections = (page: Page) => page.locator('[data-testid="section"]');
const order = (page: Page) => sections(page).evaluateAll(list => list.map(el => (el as HTMLElement).dataset.sectionType));
const ids = (page: Page) => sections(page).evaluateAll(list => list.map(el => (el as HTMLElement).dataset.sectionId));
const saved = async (page: Page) => {
  await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã lưu" })).toBeVisible();
};
const stored = () => JSON.parse(fixture("builder-spike-read")) as { draftSections: { id: string; type: string; variant: string }[] | null; contents: { sectionId: string; draftData: { [key: string]: unknown } | null }[] };

test.describe("builder spike", () => {
  test("kéo từ thư viện", async ({ page }) => {
    await open(page);
    await adapter.dragFromLibrary(page, "faq", 1);
    await expect.poll(() => order(page)).toEqual(["hero", "faq", "stats", "faq", "cta-banner"]);
  });

  test("sắp xếp", async ({ page }) => {
    await open(page);
    await adapter.drag(page, "s-cta", 0);
    await expect.poll(() => ids(page)).toEqual(["s-cta", "s-hero", "s-stats", "s-faq"]);
  });

  test("đổi variant giữ nội dung", async ({ page }) => {
    await open(page);
    await adapter.select(page, "s-hero");
    const title = page.getByRole("textbox").first();
    await title.fill("[DỮ LIỆU MẪU] Tiêu đề giữ nguyên");
    await page.getByLabel("Kiểu hiển thị").selectOption("t12");
    await expect(title).toHaveValue("[DỮ LIỆU MẪU] Tiêu đề giữ nguyên");
    await saved(page);
    const row = stored();
    expect(row.draftSections?.find(s => s.id === "s-hero")?.variant).toBe("t12");
    expect(JSON.stringify(row.contents.find(c => c.sectionId === "s-hero")?.draftData)).toContain("Tiêu đề giữ nguyên");
  });

  test("sửa props bằng SchemaForm", async ({ page }) => {
    await open(page);
    await adapter.select(page, "s-faq");
    await expect(page.locator("form").filter({ has: page.getByRole("textbox") }).first()).toBeVisible();
    // eyebrow: localized({ max: 100 }) — bộ đếm và maxLength phải sinh từ chính schema zod của section.
    await page.getByRole("textbox").first().fill("x".repeat(101));
    await expect(page.getByText("100/100").first()).toBeVisible();
  });

  test("preview đúng theme", async ({ page }) => {
    test.setTimeout(300_000); // cold compile của apps/web trên next dev chiếm phần lớn thời gian
    await open(page);
    const frame = page.frameLocator('iframe[title="Xem trước"]');
    await expect(frame.locator("[data-section-id], main").first()).toBeVisible({ timeout: 180_000 });
    const primary = await frame.locator("html").evaluate(el => getComputedStyle(el).getPropertyValue("--c-primary").trim());
    expect(primary).not.toBe("");
    await adapter.select(page, "s-faq");
    await page.getByRole("textbox", { name: "Tiêu đề", exact: true }).fill("[DỮ LIỆU MẪU] Preview sau khi lưu");
    await saved(page);
    await expect(frame.getByText("Preview sau khi lưu").first()).toBeVisible({ timeout: 30_000 });
  });

  test("lưu rồi tải lại", async ({ page }) => {
    await open(page);
    await adapter.drag(page, "s-cta", 0);
    await saved(page);
    await page.reload();
    await expect.poll(() => ids(page)).toEqual(["s-cta", "s-hero", "s-stats", "s-faq"]);
    expect(stored().draftSections?.map(s => s.id)).toEqual(["s-cta", "s-hero", "s-stats", "s-faq"]);
  });

  test("giữ section ngoài demo", async ({ page }) => {
    await open(page);
    await adapter.dragFromLibrary(page, "faq", 0);
    await saved(page);
    const row = stored().draftSections!;
    expect(row.map(s => s.type)).toContain("stats");
    expect(row.find(s => s.type === "stats")?.id).toBe("s-stats");
  });

  test("chỉ bàn phím", async ({ page }) => {
    await open(page);
    await adapter.addByKeyboard(page, "projects");
    await expect.poll(() => order(page)).toContain("projects");
    await adapter.moveByKeyboard(page, "s-cta", 0);
    await expect.poll(() => ids(page).then(list => list[0])).toBe("s-cta");
    await adapter.selectByKeyboard(page, "s-hero");
    const variant = page.getByLabel("Kiểu hiển thị"), before = await variant.inputValue();
    await variant.focus(); await page.keyboard.press("ArrowDown");
    await expect(variant).not.toHaveValue(before);
    let reached = false;
    for (let i = 0; i < 8 && !reached; i++) { await page.keyboard.press("Tab"); reached = await page.evaluate(() => document.activeElement?.matches("input, textarea") ?? false); }
    expect(reached).toBe(true);
    await page.keyboard.type("x");
    const save = page.getByRole("button", { name: "Lưu nháp", exact: true });
    await save.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Đã lưu" })).toBeVisible();
  });

  test("axe A/AA", async ({ page }) => {
    await open(page);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude('iframe[title="Xem trước"]').analyze(); // chấm editor, không chấm trang khách
    writeResult("axe", violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })));
    expect(violations).toEqual([]);
  });

  test("undo redo", async ({ page }) => {
    await open(page);
    const start = await ids(page);
    await adapter.moveByKeyboard(page, "s-cta", 0);
    await adapter.moveByKeyboard(page, "s-faq", 0);
    await adapter.moveByKeyboard(page, "s-hero", 3);
    const after = await ids(page);
    const undo = page.getByRole("button", { name: "Hoàn tác", exact: true }), redo = page.getByRole("button", { name: "Làm lại", exact: true });
    // moveByKeyboard đi từng bước kề nhau: 3 + 3 + 3 = tối đa 9 bước, nên hoàn tác tới hết thay vì đếm cứng.
    while (await undo.isEnabled()) await undo.click();
    await expect.poll(() => ids(page)).toEqual(start);
    while (await redo.isEnabled()) await redo.click();
    await expect.poll(() => ids(page)).toEqual(after);
    let steps = 0;
    for (; steps < 50; steps++) { await adapter.moveByKeyboard(page, (await ids(page))[0]!, 1); }
    for (let i = 0; i < 50; i++) await undo.click();
    await expect.poll(() => ids(page)).toEqual(after);
  });

  test("calculator thứ hai bị chặn", async ({ page }) => {
    await open(page);
    await adapter.addByKeyboard(page, "calculator");
    await expect.poll(() => order(page)).toContain("calculator");
    await expect(page.locator('[data-testid="lib-calculator"]').first()).toHaveAttribute("aria-disabled", "true");
  });

  test("khóa theo gói", async ({ page }) => {
    await open(page);
    await page.route("**/*", route => route.continue());
    const response = await page.goto(`${origin("admin-e7-collections-basic")}/trang/${fixture("builder-spike", "admin-e7-collections-basic")}/builder`);
    expect([401, 403, 404, 200]).toContain(response?.status());
    await expect(page.locator('[data-testid="section"]')).toHaveCount(0);
  });

  test("reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    const inline = await sections(page).evaluateAll(list => list.map(el => (el as HTMLElement).style.transition).filter(Boolean));
    expect(inline).toEqual([]);
  });

  test("đo JS", async ({ page, context }) => {
    const pageId = await open(page);
    const measure = async (path: string) => {
      const runs: number[] = [];
      for (let i = 0; i < 3; i++) {
        const tab = await context.newPage();
        await tab.route("**/*", async route => { await route.continue({ headers: { ...route.request().headers(), "cache-control": "no-cache" } }); });
        await tab.goto(origin() + path, { waitUntil: "networkidle" });
        runs.push(await tab.evaluate(() => (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
          .filter(e => e.initiatorType === "script" || e.name.endsWith(".js") || e.name.includes(".js?")).reduce((sum, e) => sum + e.encodedBodySize, 0)));
        await tab.close();
      }
      return Math.round(runs.sort((a, b) => a - b)[1]! / 1024);
    };
    writeResult("js-kb", { builder: await measure(`/trang/${pageId}/builder`), editor: await measure(`/trang/${pageId}`), dashboard: await measure("/") });
  });
});

function writeResult(name: string, value: unknown) {
  const dir = resolve(__dirname, "test-results/builder-spike");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, `${name}.json`), JSON.stringify(value, null, 2));
}
