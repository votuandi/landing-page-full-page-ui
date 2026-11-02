import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const platformDomain = process.env.ADMIN_E2E_PLATFORM_DOMAIN ?? "solar.localhost";
const origin = (slug = "admin-e7-a") => `http://${slug}.admin.${platformDomain}:3300`;
const password = () => `${process.env.SEED_PASSWORD!}-t15`;
const fixture = (...args: string[]) => execFileSync(process.execPath, ["--import", "tsx", "scripts/browser-fixture.ts", ...args], {
  cwd: resolve(__dirname, "../../apps/admin"), encoding: "utf8", timeout: 60_000, stdio: ["ignore", "pipe", "inherit"],
}).trim();

async function signIn(page: Page, slug: string, identifier: string) {
  await page.context().grantPermissions(["local-network-access"]);
  await page.goto(origin(slug) + "/dang-nhap");
  await page.getByLabel("Email, số điện thoại hoặc tên đăng nhập").fill(identifier);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password());
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible({ timeout: 90_000 });
}
const canvas = (page: Page) => page.frameLocator('iframe[title="Xem trước trang"]');
const frame = (page: Page) => page.frames().find(item => item.url().includes(".preview."))!;
const rows = (page: Page) => page.locator('ul[aria-label="Section của trang"] > li');
const rowIds = (page: Page) => rows(page).evaluateAll(list => list.map(el => (el as HTMLElement).dataset.sectionId));
const canvasIds = (page: Page) => canvas(page).locator("main [data-section-id]").evaluateAll(list => list.map(el => (el as HTMLElement).dataset.sectionId));
const selectRow = (page: Page, id: string) => rows(page).and(page.locator(`[data-section-id="${id}"]`)).getByRole("button", { pressed: false }).first().click();
const selected = (page: Page, id: string) => expect(canvas(page).locator(`[data-builder-selected="${id}"]`)).toBeAttached();
const draft = () => (JSON.parse(fixture("builder-page-read")) as { draftSections: { id: string }[] | null }).draftSections?.map(section => section.id);

async function open(page: Page, identifier = "owner@demo.vn") {
  const pageId = fixture("builder-page");
  await signIn(page, "admin-e7-a", identifier);
  await page.goto(`${origin()}/trang/${pageId}/builder`);
  await expect(rows(page)).toHaveCount(4);
  await expect(canvas(page).locator("[data-builder-canvas]")).toBeAttached({ timeout: 120_000 });
  await selected(page, "s-hero");
  return pageId;
}

let client = 100;
test.beforeEach(async ({ page }) => { await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.101.${++client}` }); });

test.describe("builder", () => {
  test("click section trong canvas mở form đúng section", async ({ page }) => {
    await open(page);
    const panel = page.getByRole("region", { name: "Thuộc tính section" });
    await expect(panel.getByRole("heading", { level: 2 })).toHaveText("Banner chính");
    await canvas(page).locator('main [data-section-id="s-faq"]').click();
    await expect(panel.getByRole("heading", { level: 2 })).toHaveText("Câu hỏi thường gặp");
    await selected(page, "s-faq");
    await expect(rows(page).and(page.locator('[data-section-id="s-faq"]')).getByRole("button", { pressed: true })).toBeVisible();
  });

  test("thông điệp origin lạ bị bỏ qua", async ({ page }) => {
    await open(page);
    const message = { type: "solar-preview", action: "select", sectionId: "s-faq" };
    await page.evaluate(data => window.postMessage(data, "*"), message);
    await frame(page).evaluate(data => window.postMessage(data, "*"), message);
    // A real foreign window: srcdoc has origin "null", and it is not the canvas iframe.
    await page.evaluate(data => new Promise<void>(done => {
      const stranger = document.createElement("iframe");
      stranger.srcdoc = `<script>parent.postMessage(${JSON.stringify(data)},"*")</script>`;
      stranger.onload = () => { stranger.remove(); done(); };
      document.body.append(stranger);
    }), message);
    await page.waitForTimeout(500);
    await selected(page, "s-hero");
    await expect(page.getByRole("region", { name: "Thuộc tính section" }).getByRole("heading", { level: 2 })).toHaveText("Banner chính");
  });

  test("chọn section hiện viền và nhãn", async ({ page }) => {
    await open(page);
    await selectRow(page, "s-cta");
    const outline = canvas(page).locator('[data-builder-selected="s-cta"]');
    await expect(outline).toBeVisible();
    await expect(outline).toContainText("Đội ngũ kỹ sư");
    await expect(outline.locator("[data-builder-handle]")).toBeVisible();
  });

  test("kéo section trên canvas đổi thứ tự và lưu nháp", async ({ page }) => {
    await open(page);
    await selectRow(page, "s-cta");
    await selected(page, "s-cta");
    const box = (await canvas(page).locator("[data-builder-handle]").boundingBox())!;
    const stage = (await page.locator('iframe[title="Xem trước trang"]').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y - 40, { steps: 5 });
    // Holding the pointer at the top edge auto-scrolls the canvas up to the first section.
    await page.mouse.move(stage.x + 40, stage.y + 4, { steps: 5 });
    await expect.poll(() => frame(page).evaluate(() => window.scrollY), { timeout: 15_000 }).toBe(0);
    await page.mouse.up();
    await expect.poll(() => rowIds(page)).toEqual(["s-cta", "s-hero", "s-stats", "s-faq"]);
    await expect.poll(draft).toEqual(["s-cta", "s-hero", "s-stats", "s-faq"]);
    await expect.poll(() => canvasIds(page), { timeout: 30_000 }).toEqual(["s-cta", "s-hero", "s-faq"]);
  });

  test("cuộn đồng bộ và cuộn trong iframe không cuộn trang admin", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await open(page);
    await page.evaluate(() => window.scrollTo(0, 120));
    const before = await page.evaluate(() => window.scrollY);
    await selectRow(page, "s-cta");
    await expect.poll(() => frame(page).evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await frame(page).evaluate(() => window.scrollTo(0, 0));
    await expect(rows(page).and(page.locator('[data-section-id="s-hero"]')).locator('[aria-current="true"]')).toBeVisible();
    // Row highlight must not push the canvas back: the page stays where the visitor scrolled.
    await page.waitForTimeout(300);
    expect(await frame(page).evaluate(() => window.scrollY)).toBe(0);
  });

  test("đổi khung thiết bị không nạp lại iframe", async ({ page }) => {
    await open(page);
    await frame(page).evaluate(() => { (window as Window & { marker?: number }).marker = 1; });
    for (const width of [390, 768, 1440]) {
      await page.getByRole("button", { name: `${width}`, exact: true }).click();
      await expect.poll(() => frame(page).evaluate(() => window.innerWidth)).toBe(width);
    }
    expect(await frame(page).evaluate(() => (window as Window & { marker?: number }).marker)).toBe(1);
  });

  test("sửa form cập nhật canvas mà không nạp lại iframe", async ({ page }) => {
    await open(page);
    await frame(page).evaluate(() => { (window as Window & { marker?: number }).marker = 1; });
    const text = `[DỮ LIỆU MẪU] Canvas ${Date.now()}`;
    await page.getByRole("region", { name: "Thuộc tính section" }).getByRole("textbox").first().fill(text);
    await expect(canvas(page).locator("main")).toContainText(text, { timeout: 30_000 });
    expect(await frame(page).evaluate(() => (window as Window & { marker?: number }).marker)).toBe(1);
  });

  test("click liên kết trong canvas không điều hướng", async ({ page }) => {
    await open(page);
    const url = frame(page).url();
    await selectRow(page, "s-cta");
    await canvas(page).locator('main [data-section-id="s-cta"] a').first().click();
    await page.waitForTimeout(500);
    expect(frame(page).url()).toBe(url);
    await selected(page, "s-cta");
  });

  test("không có quyền cấu trúc thì không kéo được", async ({ page }) => {
    await open(page, "viewer_admin");
    await expect(canvas(page).locator("[data-builder-selected]")).toBeVisible();
    await expect(canvas(page).locator("[data-builder-handle]")).toHaveCount(0);
    await expect(rows(page).getByRole("button", { name: /^(Lên|Xuống) / })).toHaveCount(0);
  });

  test("lưu thứ tự lỗi thì hoàn nguyên", async ({ page }) => {
    await open(page);
    fixture("builder-page-bump");
    await rows(page).first().getByRole("button", { name: /^Xuống / }).click();
    await expect(page.getByRole("alert").filter({ hasText: /thay đổi|phiên bản/ })).toBeVisible();
    await expect.poll(() => rowIds(page)).toEqual(["s-hero", "s-stats", "s-faq", "s-cta"]);
    await expect(page.getByRole("button", { name: "Tải lại trang", exact: true })).toBeVisible();
    expect(draft()).toBeUndefined();
  });

  test("gói không có builder thì route trả 404", async ({ page }) => {
    const pageId = fixture("builder-page", "admin-e7-collections-basic");
    await signIn(page, "admin-e7-collections-basic", "owner@demo.vn");
    expect((await page.goto(`${origin("admin-e7-collections-basic")}/trang/${pageId}/builder`))?.status()).toBe(404);
  });

  test("từ bố cục trang mở được trình dựng", async ({ page }) => {
    const pageId = await open(page);
    await page.goto(`${origin()}/trang/${pageId}`);
    await page.getByRole("link", { name: "Mở trình dựng", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/trang/${pageId}/builder$`));
  });

  test("builder không lỗi a11y và không tràn ở 390/1440", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", message => { if (message.type() === "error" && /hydrat/i.test(message.text())) errors.push(message.text()); });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      if (width === 390) await open(page); else await page.reload();
      await expect(canvas(page).locator("[data-builder-canvas]")).toBeAttached({ timeout: 120_000 });
      expect((await new AxeBuilder({ page }).exclude("iframe").withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await selected(page, "s-hero");
      await page.screenshot({ path: test.info().outputPath(`builder-${width}.png`), fullPage: true });
    }
    expect(errors).toEqual([]);
  });
});
