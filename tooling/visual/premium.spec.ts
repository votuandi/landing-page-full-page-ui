import { expect, test } from "@playwright/test";

const route = "/lab/sections/t15-premium";
const types = ["products", "dealer", "branch-map", "press", "tiktok", "social", "investment-models", "warranty", "about-story", "services"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("t15-consult-shown", "1"));
});

test("10 premium sections render with collection content and no browser errors", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(route, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  expect(await page.locator("[data-section-type]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section-type")))).toEqual(types);
  await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
  for (const type of types) await expect(page.locator('[data-section-type="' + type + '"]').getByRole("heading").first()).toBeVisible();
  await expect(page.locator('[data-section-type="products"] article')).toHaveCount(8);
  await expect(page.locator('[data-section-type="branch-map"]')).toContainText("TP. Hồ Chí Minh");
  expect(errors).toEqual([]);
  await testInfo.attach("lab-t15-premium", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("products quick view traps focus, closes with Escape and adds to the existing quote drawer", async ({ page }) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const products = page.locator('[data-section-type="products"]');
  const opener = products.getByRole("button", { name: /Xem nhanh/ }).first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Đóng xem nhanh" })).toBeFocused();
  await expect(dialog).toContainText("Công suất");
  await expect(dialog).toContainText("Bảo hành");
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Trang chi tiết" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Đóng xem nhanh" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await products.getByRole("button", { name: "Thêm báo giá", exact: true }).first().click();
  await expect(products.getByRole("status").first()).toHaveText("Đã thêm");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("t15-quote-cart") || "[]"))).toEqual([{ sku: "helionyx-nova-n-590w", qty: 1 }]);
  await opener.click();
  await dialog.getByRole("button", { name: "Thêm vào yêu cầu báo giá", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("t15-quote-cart") || "[]")[0]?.qty)).toBe(2);
  await dialog.getByRole("button", { name: "Xem giỏ báo giá" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Tấm pin Nova N-type 590W");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("quick view supports secondary product images", async ({ page }) => {
  await page.goto(route, { waitUntil: "networkidle" });
  await page.locator('[data-section-type="products"]').getByRole("button", { name: /Xem nhanh.*Inverter hybrid/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Ảnh 2", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Ảnh 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator("img").first()).toHaveAttribute("src", /battery-10/);
});

test("dealer validates inputs, supports keyboard tabs and submits a dealer lead", async ({ page }) => {
  let body: Record<string, unknown> | undefined;
  await page.route("**/api/lead", async (request) => {
    body = request.request().postDataJSON();
    await request.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto(route, { waitUntil: "networkidle" });
  const dealer = page.locator('[data-section-type="dealer"]');
  await dealer.getByRole("tab", { name: "Chính sách" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(dealer.getByRole("tab", { name: "Hỏi đáp" })).toBeFocused();
  await expect(dealer.getByRole("tab", { name: "Hỏi đáp" })).toHaveAttribute("aria-selected", "true");
  await dealer.locator("summary").first().click();
  await expect(dealer.getByText(/Có pháp nhân hoặc hộ kinh doanh/)).toBeVisible();
  await dealer.getByRole("button", { name: "Đăng ký làm đại lý", exact: true }).click();
  await expect(dealer.getByLabel("Họ và tên")).toBeFocused();
  expect(body).toBeUndefined();
  await dealer.getByLabel("Họ và tên").fill("Đại lý kiểm thử");
  await dealer.getByLabel("Số điện thoại").fill("0123");
  await dealer.getByRole("button", { name: "Đăng ký làm đại lý", exact: true }).click();
  await expect(dealer.getByLabel("Số điện thoại")).toHaveAttribute("aria-invalid", "true");
  expect(body).toBeUndefined();
  await dealer.getByLabel("Số điện thoại").fill("0901234500");
  await dealer.getByLabel("Tỉnh/thành").selectOption("Hà Nội");
  await dealer.getByLabel("Loại hình kinh doanh").selectOption("Đội thi công lắp đặt");
  await dealer.getByRole("button", { name: "Đăng ký làm đại lý", exact: true }).click();
  await expect.poll(() => body?.source).toBe("dealer");
  expect(body?.province).toBe("Hà Nội");
  expect(body?.businessType).toBe("Đội thi công lắp đặt");
  await expect(dealer.getByRole("status")).toContainText("Đã nhận đăng ký đại lý!");
});

test("dealer displays a failed request and allows retry", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/lead", async (request) => {
    requests++;
    await request.fulfill({ status: requests === 1 ? 503 : 200, json: requests === 1 ? { ok: false, message: "Thử gửi lại" } : { ok: true } });
  });
  await page.goto(route, { waitUntil: "networkidle" });
  const dealer = page.locator('[data-section-type="dealer"]');
  await dealer.getByLabel("Họ và tên").fill("Đại lý kiểm thử");
  await dealer.getByLabel("Số điện thoại").fill("0901234500");
  await dealer.getByLabel("Tỉnh/thành").selectOption("Hà Nội");
  await dealer.getByLabel("Loại hình kinh doanh").selectOption("Đội thi công lắp đặt");
  await dealer.getByRole("button", { name: "Đăng ký làm đại lý", exact: true }).click();
  await expect(dealer.getByRole("alert")).toHaveText("Thử gửi lại");
  await dealer.getByRole("button", { name: "Đăng ký làm đại lý", exact: true }).click();
  await expect(dealer.getByRole("status")).toBeVisible();
  expect(requests).toBe(2);
});

test("branch pins select the correct contact card and directions", async ({ page }) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const map = page.locator('[data-section-type="branch-map"]');
  await map.getByRole("button", { name: "Chi nhánh Hà Nội", exact: true }).click();
  await expect(map.getByRole("heading", { name: "Chi nhánh Hà Nội" })).toBeVisible();
  await expect(map.getByRole("heading", { name: "Chi nhánh TP. Hồ Chí Minh" })).toBeHidden();
  await expect(map.getByRole("link", { name: "Chỉ đường", exact: true })).toHaveAttribute("href", "https://www.google.com/maps/dir/?api=1&destination=21.03%2C105.8");
  await map.getByRole("button", { name: "Đắk Lắk", exact: true }).click();
  await expect(map.getByRole("heading", { name: "Chi nhánh Đắk Lắk" })).toBeVisible();
  await expect(map.getByRole("link", { name: "0901 234 560", exact: true })).toHaveAttribute("href", "tel:0901234560");
});

test("services switch panels and TikTok uses the shared player", async ({ page }) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const services = page.locator('[data-section-type="services"]');
  await services.getByRole("tab", { name: "Nhà xưởng", exact: true }).click();
  await expect(services.getByRole("tabpanel")).toContainText("EPC trọn gói");
  await expect(services.getByRole("link", { name: "Dự toán cho phân khúc này", exact: true })).toHaveAttribute("href", /phan-khuc=factory/);
  const opener = page.locator('[data-section-type="tiktok"]').getByRole("button", { name: /Phát video:/ }).first();
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog")).toContainText("Kiểm tra string");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
});

test("premium content and all branch contacts remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto("http://localhost:3210" + route);
    expect(response?.status()).toBe(200);
    for (const type of types) await expect(page.locator('[data-section-type="' + type + '"]').getByRole("heading").first()).toBeVisible();
    const products = page.locator('[data-section-type="products"]');
    await expect(products.getByRole("heading", { name: "Tấm pin Nova N-type 590W", exact: true }).getByRole("link")).toHaveAttribute("href", "/san-pham/helionyx-nova-n-590w");
    await expect(products).toContainText("3.150.000");
    const map = page.locator('[data-section-type="branch-map"]');
    await expect(map.getByRole("link", { name: "Chỉ đường", exact: true })).toHaveCount(5);
    await expect(map.getByRole("heading", { name: "Chi nhánh Hà Nội" })).toBeVisible();
    const dealer = page.locator('[data-section-type="dealer"]');
    await expect(dealer.locator("summary").first()).toBeVisible();
    await dealer.locator("summary").first().click();
    await expect(dealer.getByText(/Có pháp nhân hoặc hộ kinh doanh/)).toBeVisible();
    const services = page.locator('[data-section-type="services"]');
    await expect(services.getByRole("link", { name: "Dự toán cho phân khúc này", exact: true })).toHaveCount(4);
  } finally { await context.close(); }
});
