import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const platformDomain = process.env.ADMIN_E2E_PLATFORM_DOMAIN ?? "solar.localhost";
const origin = (slug = "admin-e7-a") => `http://${slug}.admin.${platformDomain}:3300`;
const password = () => `${process.env.SEED_PASSWORD!}-t15`;
async function apiSession(page: Page, slug = "admin-e7-a") {
  const cookies = await page.context().cookies(origin(slug));
  return page.request.get("http://127.0.0.1:3300/api/session", { headers: {
    Host: `${slug}.admin.${platformDomain}:3300`, Cookie: cookies.map(c => `${c.name}=${c.value}`).join("; "),
  } });
}
function fixture(...args: string[]) {
  return execFileSync(process.execPath, ["--import", "tsx", "scripts/browser-fixture.ts", ...args], {
    cwd: resolve(__dirname, "../../apps/admin"), encoding: "utf8", timeout: 180_000,
  }).trim();
}
async function login(page: Page, identifier = "owner@demo.vn", pass = password(), slug = "admin-e7-a") {
  await page.goto(origin(slug) + "/dang-nhap");
  await page.getByLabel("Email, số điện thoại hoặc tên đăng nhập").fill(identifier);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(pass);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}
test.beforeAll(async ({ request }) => {
  test.setTimeout(600_000);
  fixture("setup");
  // Warm new routes before timing user flows against next dev.
  for (const path of ["/dang-nhap", "/api/session", "/quen-mat-khau", "/link-dang-nhap", "/dat-lai-mat-khau", "/moi", "/auth/magic", "/doi-mat-khau", "/ten-mien", "/goi", "/nhan-vien", "/tai-khoan/bao-mat", "/tai-khoan/khoi-phuc", "/trang", `/trang/${fixture("home-page")}`, "/noi-dung", "/media", "/lead", "/giao-dien", "/email"]) {
    const response = await request.get(`http://localhost:3300${path}`, { headers: { Host: `admin-e7-a.admin.${platformDomain}:3300` }, timeout: 180_000 });
    expect(response.status(), path).toBeLessThan(500);
  }
});
test.afterAll(() => fixture("cleanup"));

test("collections: create project, publish, duplicate, reorder", async ({ page }, info) => {
  await login(page);
  await page.goto(origin() + "/noi-dung");
  await page.getByRole("link", { name: /^Dự án/ }).click();
  await page.getByRole("link", { name: "Thêm dự án" }).click();
  await page.getByLabel("Tiêu đề", { exact: true }).fill("[DỮ LIỆU MẪU] Đà Nẵng E7-S06");
  await expect(page.getByText("du-lieu-mau-da-nang-e7-s06", { exact: true })).toBeVisible();
  await page.getByLabel("Trạng thái", { exact: true }).selectOption("published");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Lưu nội dung", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã lưu nội dung" })).toBeVisible();
  await page.getByRole("button", { name: /Nhân bản.*Đà Nẵng E7-S06/ }).click();
  const copy = page.getByRole("list", { name: "Danh sách nội dung" }).getByRole("listitem").filter({ hasText: "-ban-sao" });
  await expect(copy).toContainText("Nháp");
  const handle = copy.getByRole("button", { name: /^Kéo để sắp xếp/ });
  await handle.focus(); await page.keyboard.press("Space"); await page.keyboard.press("ArrowUp"); await page.keyboard.press("Space");
  await expect(page.getByRole("status").filter({ hasText: "Đã lưu thứ tự" })).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`collections-${width}.png`), fullPage: true });
  }
  await page.getByLabel("Tìm kiếm", { exact: true }).fill("da nang"); await page.getByRole("button", { name: "Áp dụng" }).click();
  await expect(page.getByText(/Sắp xếp tạm tắt/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Kéo để sắp xếp/ }).first()).toBeDisabled();
  await page.getByRole("link", { name: "Xóa bộ lọc" }).click();
  page.on("dialog", dialog => dialog.accept());
  await copy.getByRole("button", { name: /^Xóa/ }).click(); await expect(copy).toHaveCount(0);
  await page.getByRole("button", { name: /Xóa.*Đà Nẵng E7-S06/ }).click();
  await expect(page.getByRole("list", { name: "Danh sách nội dung" }).getByRole("listitem")).toHaveCount(0);
});

test("collections: basic tenant hides catalog and direct route is 404", async ({ page }) => {
  const slug = "admin-e7-collections-basic";
  await login(page, "owner@demo.vn", password(), slug);
  await page.goto(origin(slug) + "/noi-dung");
  await expect(page.getByRole("link", { name: /^Sản phẩm/ })).toHaveCount(0);
  const response = await page.goto(origin(slug) + "/noi-dung/san-pham");
  expect(response?.status()).toBe(404);
});

test("section editor: save variant as draft, reload and publish", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  await page.goto(origin() + "/trang");
  await page.getByRole("link", { name: /^Trang chủ/ }).click();
  const variant = page.getByLabel("Đổi kiểu hiển thị: Banner chính");
  await expect(variant).toHaveValue("t12"); await variant.selectOption("t15");
  await expect(page.getByRole("button", { name: "Xuất bản", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã lưu nháp" })).toBeVisible();
  await page.reload(); await expect(variant).toHaveValue("t15");
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Đã xuất bản" })).toBeVisible();
  await page.reload(); await expect(variant).toHaveValue("t15");
  await expect(page.getByRole("button", { name: "Xuất bản", exact: true })).toBeDisabled();
});

test("host errors have no login; cross-tenant/platform/client credentials and copied cookies are rejected", async ({ page, request }, info) => {
  for (const [host, status] of [[`missing.admin.${platformDomain}`, 404], [`admin-e7-paused.admin.${platformDomain}`, 403], [`${platformDomain}`, 404]] as const) {
    const response = await request.get("http://localhost:3300/dang-nhap", { headers: { Host: host } });
    expect(response.status()).toBe(status);
    expect(await response.text()).not.toContain('name="password"');
  }
  await login(page, "owner@demo.vn", `${process.env.SEED_PASSWORD}-t12`);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Thông tin đăng nhập không đúng");
  for (const slug of ["admin-e7-a", "admin-e7-b"]) {
    await login(page, "owner@demo.vn", `${process.env.SEED_PASSWORD}-platform`, slug);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Thông tin đăng nhập không đúng");
  }
  await login(page, "customer_client");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Thông tin đăng nhập không đúng");
  await login(page);
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  const session = (await page.context().cookies()).find(c => c.name === "site_sid")!;
  expect(session.httpOnly).toBe(true); expect(session.sameSite).toBe("Lax"); expect(session.domain).toBe(`admin-e7-a.admin.${platformDomain}`);
  await page.context().addCookies([{ ...session, domain: `admin-e7-b.admin.${platformDomain}` }]);
  expect((await apiSession(page, "admin-e7-b")).status()).toBe(401);
  await page.context().clearCookies();
  await page.context().addCookies([{ name: "site_sid", value: fixture("storefront"), domain: `admin-e7-a.admin.${platformDomain}`, path: "/", httpOnly: true, sameSite: "Lax" }]);
  expect((await apiSession(page)).status()).toBe(401);
  await page.goto(origin()); await expect(page).toHaveURL(/\/dang-nhap$/);
  await page.context().clearCookies();
  await login(page, "+84901234567");
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  const plusResponse = await apiSession(page);
  expect(plusResponse.status()).toBe(200);
  const plus = await plusResponse.json();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, "0901234567");
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  const localResponse = await apiSession(page);
  expect(localResponse.status()).toBe(200);
  expect((await localResponse.json()).accountId).toBe(plus.accountId);
  await page.screenshot({ path: info.outputPath("admin-dashboard.png"), fullPage: true });
});

test("temporary password forces change; expired temporary password fails; editor has neither menu nor page access", async ({ page }, info) => {
  await login(page, "expired_admin", password(), "nang-luong-solar");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Mật khẩu tạm đã hết hạn");
  await login(page, "nangluongsolar_admin", password(), "nang-luong-solar");
  await expect(page).toHaveURL(/\/doi-mat-khau$/);
  expect((await apiSession(page, "nang-luong-solar")).status()).toBe(403);
  await page.goto(origin("nang-luong-solar") + "/ten-mien");
  await expect(page).toHaveURL(/\/doi-mat-khau$/);
  const next = `${process.env.SEED_PASSWORD}-New!temporary`;
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill(next);
  await page.getByLabel("Nhập lại mật khẩu mới").fill(next);
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page.getByRole("heading", { name: "Bảo vệ quyền truy cập" })).toBeVisible();
  await page.context().clearCookies();
  await login(page, "editor_admin");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  await page.getByText("Menu", { exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Điều hướng quản trị" });
  await expect(menu.getByRole("link", { name: "Trang & Section", exact: true })).toBeVisible();
  for (const label of ["Tên miền", "Gói", "Tài khoản & nhân viên"]) await expect(menu.getByRole("link", { name: label, exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("admin-editor-mobile.png"), fullPage: true });
  for (const path of ["/ten-mien", "/goi", "/nhan-vien"]) {
    expect((await page.goto(origin() + path))?.status()).toBe(403);
    await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeVisible();
  }
});

test("owner enables TOTP, receives one-use backups, and magic link still needs TOTP", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await login(page);
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  await page.goto(origin() + "/tai-khoan/bao-mat");
  await page.getByRole("button", { name: "Bắt đầu thiết lập" }).click();
  await expect(page.getByText("Khóa thiết lập:")).toBeVisible();
  const secret = (await page.getByText("Khóa thiết lập:").locator("code").textContent())!;
  // Generate the code in Node, never from client-side credentials or session storage.
  const code = execFileSync(process.execPath, ["--import", "tsx", "-e", "import {totp} from '@solar/auth'; process.stdout.write(totp(process.argv[1]))", secret], { cwd: resolve(__dirname, "../../apps/admin"), encoding: "utf8" });
  await page.getByLabel("Mã xác thực 6 số").fill(code);
  await page.getByRole("button", { name: "Bật xác thực hai bước", exact: true }).click();
  const backups = page.getByRole("list", { name: "Mã dự phòng" });
  await expect(backups.locator("li")).toHaveCount(10);
  const backup = (await backups.locator("li").first().textContent())!;
  // TOTP steps already used are rejected (replay protection), so later steps use unused backup codes.
  const [magicBackup, disableBackup] = [(await backups.locator("li").nth(1).textContent())!, (await backups.locator("li").nth(2).textContent())!];
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page);
  await expect(page.getByRole("heading", { name: "Xác thực hai bước" })).toBeVisible();
  expect(await page.content()).not.toContain(password());
  await page.getByLabel("Mã xác thực hoặc mã dự phòng").fill(backup);
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page);
  await page.getByLabel("Mã xác thực hoặc mã dự phòng").fill(backup);
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Thông tin đăng nhập không đúng");
  await page.goto(origin() + "/link-dang-nhap");
  await page.getByLabel("Email, số điện thoại hoặc tên đăng nhập").fill("owner@demo.vn");
  await page.getByRole("button", { name: "Gửi link đăng nhập" }).click();
  await expect(page.getByText("Nếu tài khoản tồn tại", { exact: false })).toBeVisible();
  await page.goto(fixture("mail", "magic_link"));
  await page.getByRole("button", { name: "Tiếp tục đăng nhập" }).click();
  await expect(page).toHaveURL(/buoc=magic-totp/);
  await page.getByLabel("Mã xác thực hoặc mã dự phòng").fill(magicBackup);
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  await page.goto(origin() + "/tai-khoan/bao-mat");
  await page.getByRole("heading", { name: "Tắt xác thực hai bước", exact: true }).locator("..").getByLabel("Mã xác thực hoặc mã dự phòng").fill(disableBackup);
  await page.getByRole("button", { name: "Tắt xác thực hai bước", exact: true }).click();
  await expect(page.getByText("Đã tắt xác thực hai bước", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("invite and reset forms work without JavaScript and consume each link once", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    const token = fixture("invite");
    await page.goto(origin() + `/moi?token=${token}`);
    const staffPassword = `${process.env.SEED_PASSWORD}-Staff!password`;
    await page.getByLabel("Mật khẩu mới", { exact: true }).fill(staffPassword);
    await page.getByLabel("Nhập lại mật khẩu mới").fill(staffPassword);
    await page.getByRole("button", { name: "Kích hoạt và đăng nhập" }).click();
    await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await page.goto(origin() + "/quen-mat-khau");
    await page.getByLabel("Email, số điện thoại hoặc tên đăng nhập").fill("owner@demo.vn");
    await page.getByRole("button", { name: "Gửi link đặt lại" }).click();
    await expect(page.getByText("Nếu tài khoản tồn tại", { exact: false })).toBeVisible();
    const url = fixture("mail", "reset_password");
    const resetPassword = `${process.env.SEED_PASSWORD}-Reset!password`;
    for (let i = 0; i < 2; i++) {
      await page.goto(url);
      await page.getByLabel("Mật khẩu mới", { exact: true }).fill(resetPassword);
      await page.getByLabel("Nhập lại mật khẩu mới").fill(resetPassword);
      await page.getByRole("button", { name: "Đặt lại mật khẩu", exact: true }).click();
      if (i === 0) await expect(page.getByText("Đã đặt lại mật khẩu. Vui lòng đăng nhập.")).toBeVisible();
      else await expect(page.getByRole("main").getByRole("alert")).toContainText("đã dùng hoặc đã hết hạn");
    }
    await login(page, "owner@demo.vn", resetPassword);
    await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  } finally { await context.close(); }
});

test("owner shell lists every story screen, marks the current page, and main admin pages pass axe", async ({ page }, info) => {
  // admin-e7-b: earlier tests change the admin-e7-a owner password and enable TOTP.
  const site = "admin-e7-b";
  await login(page, "owner@demo.vn", `${process.env.SEED_PASSWORD}-t12`, site);
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible();
  const menu = page.getByRole("navigation", { name: "Điều hướng quản trị" });
  for (const label of ["Tổng quan", "Trang & Section", "Nội dung", "Media", "Lead", "Giao diện", "Tên miền", "Email theo tên miền", "Tài khoản & nhân viên", "Gói", "Đổi mật khẩu", "Bảo mật"]) {
    await expect(menu.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(menu.locator('[aria-current="page"]')).toHaveText("Tổng quan");
  for (const [path, heading] of [["/", "Tổng quan"], ["/trang", "Trang & Section"], ["/nhan-vien", null], ["/goi", "Gói dịch vụ"]] as const) {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width > 400 ? 900 : 844 });
      await page.goto(origin(site) + path);
      if (heading) await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await page.screenshot({ path: info.outputPath(`admin-${path === "/" ? "tong-quan" : path.slice(1)}-${width}.png`), fullPage: true });
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`), `${path} @${width}`).toEqual([]);
    }
  }
});
