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
const heroData = () => (JSON.parse(fixture("builder-section-read", "s-hero")) as { data: { title: { highlight: { vi: string } } } }).data;
const heroText = (page: Page, text: string) => canvas(page).locator('main [data-section-id="s-hero"]').getByText(text, { exact: true });
const panel = (page: Page) => page.getByRole("region", { name: "Thuộc tính section" });
const panelValues = (page: Page) => panel(page).locator('input[type="text"]').evaluateAll(list => list.map(el => (el as HTMLInputElement).value));
async function editInline(page: Page, text: string, path: string) {
  const target = heroText(page, text);
  await target.hover();
  await expect(canvas(page).locator("[data-builder-editable]")).toBeAttached();
  await target.dblclick();
  await expect(canvas(page).locator(`[data-builder-inline][data-path="${path}"]`)).toBeAttached();
  await expect(canvas(page).locator("main [contenteditable]")).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+a");
}

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

  test("thư viện nhóm theo mục đích, thumbnail theo theme", async ({ page }) => {
    await open(page);
    const library = page.getByRole("complementary", { name: "Thư viện section" });
    await expect(library.getByRole("heading", { level: 3 })).toHaveText(["Mở đầu", "Thuyết phục", "Chuyển đổi", "Nội dung", "Chân trang"]);
    const projects = library.locator('li[data-library-type="projects"]');
    await expect(projects).toHaveAttribute("data-library-status", "ok");
    // Site of admin-e7-a uses theme t15; the card shows the type's first variant.
    await expect(projects.getByRole("button", { name: "Thêm Công trình đã thực hiện", exact: true }).locator("img")).toHaveAttribute("src", "/section-thumbs/t15/projects--t15.webp");
    await projects.getByRole("button", { name: "Kiểu của Công trình đã thực hiện", exact: true }).click();
    for (const variant of ["t15", "t14", "t12", "t11", "t10"]) {
      await expect(projects.getByRole("button", { name: `Thêm Công trình đã thực hiện kiểu ${variant}`, exact: true }).locator("img"))
        .toHaveAttribute("src", `/section-thumbs/t15/projects--${variant}.webp`);
    }
    // hero is already on the page (maxPerPage 1): its variants stay browsable but cannot be added.
    await expect(library.locator('li[data-library-type="hero"]')).toHaveAttribute("data-library-status", "limit");
  });

  test("kéo section từ thư viện vào canvas tại vị trí thả", async ({ page }) => {
    await open(page);
    const item = page.getByRole("button", { name: "Thêm Dự toán chi phí", exact: true });
    const iframe = page.locator('iframe[title="Xem trước trang"]');
    // Dropped outside the canvas, back on the item itself: a finished drag is not a click, nothing is added.
    // The library scrolls on its own: bring the item into the viewport before using its box.
    await item.scrollIntoViewIfNeeded();
    let from = (await item.boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 20, from.y + from.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await expect(canvas(page).locator("[data-builder-drop]")).toHaveCount(0);
    expect(await rowIds(page)).toEqual(["s-hero", "s-stats", "s-faq", "s-cta"]);
    // Bring s-faq near the top of the canvas (the page may end before it reaches 0), then aim at its upper half.
    const target = await frame(page).evaluate(() => {
      const faq = () => document.querySelector('main [data-section-id="s-faq"]')!.getBoundingClientRect();
      window.scrollTo({ top: faq().top + window.scrollY - 200, behavior: "instant" });
      const rect = faq();
      return { y: rect.top + Math.min(rect.height / 4, 120), half: rect.top + rect.height / 2, width: window.innerWidth, height: window.innerHeight };
    });
    // Away from the 64px auto-scroll bands and still in the upper half → "before s-faq".
    expect(target.y).toBeGreaterThan(80);
    expect(target.y).toBeLessThan(Math.min(target.half, target.height - 80));
    await item.scrollIntoViewIfNeeded();
    const box = (await iframe.boundingBox())!, scale = box.width / target.width;
    from = (await item.boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + target.y * scale, { steps: 10 });
    await expect(canvas(page).locator("[data-builder-drop]")).toBeVisible();
    await page.mouse.up();
    await expect.poll(() => rowIds(page)).toEqual(["s-hero", "s-stats", expect.stringMatching(/^calculator-/), "s-faq", "s-cta"]);
    await expect.poll(draft).toEqual(["s-hero", "s-stats", expect.stringMatching(/^calculator-/), "s-faq", "s-cta"]);
    await expect(canvas(page).locator("[data-builder-drop]")).toHaveCount(0);
    await expect.poll(() => canvasIds(page), { timeout: 30_000 }).toEqual(["s-hero", expect.stringMatching(/^calculator-/), "s-faq", "s-cta"]);
    await expect(page.getByRole("region", { name: "Thuộc tính section" }).getByRole("heading", { level: 2 })).toHaveText("Dự toán chi phí");
  });

  test("thêm calculator thứ hai bị chặn kèm giải thích", async ({ page }) => {
    await open(page);
    const calculator = page.getByRole("complementary", { name: "Thư viện section" }).locator('li[data-library-type="calculator"]');
    await expect(calculator).toHaveAttribute("data-library-status", "ok");
    await calculator.getByRole("button", { name: "Thêm Dự toán chi phí", exact: true }).click();
    await expect.poll(() => rowIds(page)).toEqual(["s-hero", expect.stringMatching(/^calculator-/), "s-stats", "s-faq", "s-cta"]);
    await expect.poll(draft).toHaveLength(5);
    await expect(calculator).toHaveAttribute("data-library-status", "limit");
    const add = calculator.getByRole("button", { name: "Thêm Dự toán chi phí", exact: true });
    await expect(add).toBeDisabled();
    await expect(add).toHaveAccessibleDescription('Chỉ được có tối đa 1 "Dự toán chi phí" trên một trang');
    await expect(calculator).toContainText('Chỉ được có tối đa 1 "Dự toán chi phí" trên một trang');
    await calculator.getByRole("button", { name: "Kiểu của Dự toán chi phí", exact: true }).click();
    await expect(calculator.getByRole("button", { name: "Thêm Dự toán chi phí kiểu t12", exact: true })).toBeDisabled();
    await add.click({ force: true });
    await page.waitForTimeout(500);
    expect(await rowIds(page)).toHaveLength(5);
    expect(draft()).toHaveLength(5);
  });

  test("bấm Thêm chèn sau section đang chọn", async ({ page }) => {
    await open(page);
    await selectRow(page, "s-faq");
    await selected(page, "s-faq");
    const add = page.getByRole("button", { name: "Thêm Quy trình triển khai", exact: true });
    await add.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => rowIds(page)).toEqual(["s-hero", "s-stats", "s-faq", expect.stringMatching(/^process-/), "s-cta"]);
    await expect.poll(draft).toEqual(["s-hero", "s-stats", "s-faq", expect.stringMatching(/^process-/), "s-cta"]);
    await expect(rows(page).nth(3).getByRole("button", { pressed: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Thuộc tính section" }).getByRole("heading", { level: 2 })).toHaveText("Quy trình triển khai");
    await expect.poll(() => canvasIds(page), { timeout: 30_000 }).toEqual(["s-hero", "s-faq", expect.stringMatching(/^process-/), "s-cta"]);
  });

  test("không có quyền cấu trúc thì thư viện chỉ xem", async ({ page }) => {
    await open(page, "viewer_admin");
    const library = page.getByRole("complementary", { name: "Thư viện section" });
    await expect(library).toBeVisible();
    await expect(library.getByRole("button", { name: /^Thêm / }).first()).toBeDisabled();
    await expect(library.getByRole("button", { name: /^Thêm /, disabled: false })).toHaveCount(0);
  });

  test("nhấp đúp sửa tiêu đề trực tiếp trên canvas", async ({ page }) => {
    await open(page);
    const next = `nhà xưởng ${Date.now() % 100000}`;
    await editInline(page, "mái nhà của bạn", "title.highlight");
    await page.keyboard.type(next);
    await page.keyboard.press("Enter");
    await expect(canvas(page).locator("[data-builder-inline]")).toHaveCount(0);
    await expect(canvas(page).locator("main [contenteditable]")).toHaveCount(0);
    await expect.poll(() => panelValues(page)).toContain(next);
    await expect.poll(() => heroData().title.highlight.vi, { timeout: 30_000 }).toBe(next);
    await expect(panel(page).getByRole("status")).toHaveText("Đã lưu nháp");
    await expect(heroText(page, next)).toBeVisible({ timeout: 30_000 });
    // Escape restores the text and sends nothing.
    await editInline(page, next, "title.highlight");
    await page.keyboard.type("bỏ đi");
    await page.keyboard.press("Escape");
    await expect(heroText(page, next)).toBeVisible();
    await expect(canvas(page).locator("[data-builder-inline]")).toHaveCount(0);
    expect(heroData().title.highlight.vi).toBe(next);
  });

  test("dán văn bản có định dạng chỉ giữ text", async ({ page }) => {
    await open(page);
    await editInline(page, "mái nhà của bạn", "title.highlight");
    await frame(page).evaluate(() => {
      const data = new DataTransfer();
      data.setData("text/html", "<b>Đậm</b><br><i>nghiêng</i>");
      data.setData("text/plain", "Đậm\nnghiêng");
      document.activeElement!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await page.keyboard.press("Enter");
    await expect(heroText(page, "Đậm nghiêng")).toBeVisible();
    await expect(canvas(page).locator('main [data-section-id="s-hero"] h1').locator("b, i, br")).toHaveCount(0);
    await expect.poll(() => heroData().title.highlight.vi, { timeout: 30_000 }).toBe("Đậm nghiêng");
  });

  test("sửa inline vượt giới hạn không lưu", async ({ page }) => {
    await open(page);
    await editInline(page, "mái nhà của bạn", "title.highlight");
    await page.keyboard.type("[DỮ LIỆU MẪU] chuỗi quá dài cho phần nhấn mạnh của tiêu đề hero x");
    await page.keyboard.press("Enter");
    await expect(panel(page).getByRole("status")).toHaveText("Có lỗi cần sửa — chưa lưu");
    await page.waitForTimeout(2_000);
    expect(heroData().title.highlight.vi).toBe("mái nhà của bạn");
  });

  test("không có quyền sửa nội dung thì không sửa trực tiếp được", async ({ page }) => {
    await open(page, "viewer_admin");
    await heroText(page, "mái nhà của bạn").dblclick();
    await expect(canvas(page).locator("main [contenteditable]")).toHaveCount(0);
    await expect(canvas(page).locator("[data-builder-inline]")).toHaveCount(0);
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
