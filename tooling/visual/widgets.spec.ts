import { expect, test } from "@playwright/test";

const route = "/lab/sections/t15-widgets";
const sku = "helionyx-nova-n-590w";
async function seed(page: import("@playwright/test").Page, cart = false) {
  await page.addInitScript(({ sku, cart }) => {
    sessionStorage.setItem("t15-consult-shown", "1");
    if (cart) localStorage.setItem("t15-quote-cart", JSON.stringify([{ sku, qty: 2 }, { sku: "unknown-sku", qty: 9 }]));
  }, { sku, cart });
}

test("widgets load HTTP 200 without errors, retain inline content and capture desktop", async ({ page }, testInfo) => {
  await seed(page);
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  expect((await page.goto(route, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.locator("[data-widget]")).toHaveCount(7);
  await expect(page.locator('[data-widget="commitments-strip"]')).toContainText("Khảo sát miễn phí");
  await expect(page.locator(".t15-scroll-progress")).toHaveCount(1);
  expect(errors).toEqual([]);
  await testInfo.attach("widgets-desktop", { body: await page.screenshot({ path: "../../.agent-runs/E3-S07/screenshots/widgets-desktop.png" }), contentType: "image/png" });
});

test("contact dock opens advice with form, traps focus, sends popup lead and restores focus", async ({ page }) => {
  await seed(page);
  let body: Record<string, unknown> | undefined;
  await page.route("**/api/lead", async (request) => { body = request.request().postDataJSON(); await request.fulfill({ json: { ok: true } }); });
  await page.goto(route, { waitUntil: "networkidle" });
  const opener = page.locator('[data-widget="contact-dock"]').getByRole("button", { name: "Nhận tư vấn", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog");
  const close = dialog.getByRole("button", { name: "Đóng popup tư vấn" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Messenger" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await dialog.getByLabel("Họ và tên").fill("Khách mẫu");
  await dialog.getByLabel("Số điện thoại di động").fill("0901234567");
  await dialog.getByRole("button", { name: "Gọi lại cho tôi" }).click();
  await expect(dialog.getByRole("status")).toBeVisible();
  expect(body?.source).toBe("popup");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("automatic advice opens once per session; reload stays closed; manual open still works", async ({ page }) => {
  await page.goto(route, { waitUntil: "networkidle" });
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Nhận tư vấn ngay" })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("t15:open-consult")));
  await expect(dialog.getByLabel("Số điện thoại di động")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await expect(dialog).toHaveCount(0);
  await page.locator('[data-widget="contact-dock"]').getByRole("button", { name: "Nhận tư vấn" }).click();
  await expect(dialog.getByLabel("Số điện thoại di động")).toBeVisible();
});

test("automatic advice waits for another modal before opening", async ({ page }) => {
  await page.addInitScript(({ sku }) => localStorage.setItem("t15-quote-cart", JSON.stringify([{ sku, qty: 1 }])), { sku });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.locator('[data-widget="quote-cart"]').getByRole("button", { name: "Mở giỏ báo giá" }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toContainText("Giỏ yêu cầu báo giá");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toContainText("Tư vấn sản phẩm & lắp đặt", { timeout: 8000 });
});

test("quote cart filters unknown SKUs, changes quantity, traps focus and clears after successful lead", async ({ page }) => {
  await seed(page, true);
  let requests = 0;
  let body: Record<string, unknown> | undefined;
  await page.route("**/api/lead", async (request) => {
    requests++; body = request.request().postDataJSON();
    await request.fulfill({ status: requests === 1 ? 503 : 200, json: requests === 1 ? { ok: false, message: "Thử gửi lại" } : { ok: true } });
  });
  await page.goto(route, { waitUntil: "networkidle" });
  const opener = page.locator('[data-widget="quote-cart"]').getByRole("button", { name: "Mở giỏ báo giá" });
  await expect(opener.locator("[data-cart-count]")).toHaveText("2");
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Tấm pin Nova N-type 590W");
  await expect(dialog).not.toContainText("unknown-sku");
  await expect(dialog.getByRole("button", { name: "Đóng giỏ báo giá" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Gửi yêu cầu", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole("button", { name: /Tăng số lượng/ }).click();
  await expect(opener.locator("[data-cart-count]")).toHaveText("3");
  await dialog.getByRole("button", { name: /Giảm số lượng/ }).click();
  await dialog.getByLabel("Họ và tên").fill("Khách báo giá");
  await dialog.getByLabel("Số điện thoại di động").fill("0901234567");
  await dialog.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Thử gửi lại");
  await expect(opener.locator("[data-cart-count]")).toHaveText("2");
  await dialog.getByRole("button", { name: "Gửi yêu cầu", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Đã gửi yêu cầu báo giá!");
  expect(body?.source).toBe("quote-cart");
  expect(body?.items).toEqual([{ sku, name: "Tấm pin Nova N-type 590W", qty: 2 }]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("t15-quote-cart") || "[]"))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(opener).toHaveCount(0);
});

test("products add to widget cart and deletion reaches empty state", async ({ page }) => {
  await seed(page);
  await page.goto(route, { waitUntil: "networkidle" });
  await page.locator('[data-section-type="products"]').getByRole("button", { name: "Thêm báo giá", exact: true }).first().click();
  const opener = page.locator('[data-widget="quote-cart"]').getByRole("button", { name: "Mở giỏ báo giá" });
  await expect(opener.locator("[data-cart-count]")).toHaveText("1");
  await page.locator('[data-section-type="products"]').getByRole("button", { name: /Xem nhanh/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Xem giỏ báo giá" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Xóa:/ }).click();
  await expect(dialog).toContainText("Giỏ báo giá đang trống.");
  await expect(dialog.getByRole("link", { name: "Xem sản phẩm" })).toHaveAttribute("href", "/san-pham");
});

test("basic plan never renders quote cart even with stored products", async ({ page }) => {
  await seed(page, true);
  await page.goto(route + "?plan=basic", { waitUntil: "networkidle" });
  await expect(page.locator('[data-widget="quote-cart"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mở giỏ báo giá" })).toHaveCount(0);
});

test("theme switch persists dark mode and supports English labels", async ({ page }, testInfo) => {
  await seed(page);
  await page.goto(route + "?lang=en", { waitUntil: "networkidle" });
  const button = page.locator('[data-widget="theme-switch"]').getByRole("button");
  await expect(button).toHaveAccessibleName("Switch to dark mode");
  await button.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(button).toHaveAccessibleName("Switch to light mode");
  await page.reload({ waitUntil: "networkidle" });
  await expect(button).toHaveAccessibleName("Switch to light mode");
  await testInfo.attach("widgets-dark", { body: await page.screenshot({ path: "../../.agent-runs/E3-S07/screenshots/widgets-dark.png" }), contentType: "image/png" });
});

test("mobile navigation emits menu event and opens the section header drawer", async ({ page }, testInfo) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.dataset.menuEvents = "0";
    window.addEventListener("t15:toggle-site-menu", () => { document.documentElement.dataset.menuEvents = String(Number(document.documentElement.dataset.menuEvents) + 1); });
  });
  const nav = page.locator('[data-widget="mobile-bottom-nav"]');
  await expect(nav.getByRole("navigation")).toBeVisible();
  await testInfo.attach("widgets-mobile", { body: await page.screenshot({ path: "../../.agent-runs/E3-S07/screenshots/widgets-mobile.png" }), contentType: "image/png" });
  await nav.getByRole("button", { name: "Danh mục", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-events", "1");
  await expect(page.locator("#widget-lab-site-header-drawer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#widget-lab-site-header-drawer")).toHaveCount(0);
});

test("contact links and commitments remain visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  try {
    const page = await context.newPage();
    expect((await page.goto("http://localhost:3210" + route))?.status()).toBe(200);
    await expect(page.locator('[data-widget="contact-dock"]').getByRole("link", { name: "0901 234 567" })).toBeVisible();
    await expect(page.locator('[data-widget="commitments-strip"]')).toContainText("Bảo hành rõ ràng");
  } finally { await context.close(); }
});
