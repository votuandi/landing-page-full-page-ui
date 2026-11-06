import { expect, test, type Locator, type Page } from "@playwright/test";

// E14-S02: conversion smoke on tenants built from presets (journey.global-setup.ts → apps/admin/scripts/journey-fixture.ts).
// A visitor converts on the public site; the lead must reach the tenant's CMS inbox. Runs whole on every PR touching
// sections, core, leads or apps/web (checks-map `e2e:journey`, smoke).
const domain = process.env.ADMIN_E2E_PLATFORM_DOMAIN ?? "solar.localhost";
const site = (id: string) => `http://journey-${id}.${domain}:3212/`;
const admin = (id: string) => `http://journey-${id}.admin.${domain}:3300`;
// Lead intake allows 5 leads per phone per tenant in 10 minutes: every submission gets its own number.
let sequence = 0;
const phone = () => `09${String(Date.now() + sequence++).slice(-8)}`;

async function openInbox(page: Page, id: string) {
  await page.goto(admin(id) + "/dang-nhap");
  await page.getByLabel("Email, số điện thoại hoặc tên đăng nhập").fill("owner@demo.vn");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(`${process.env.SEED_PASSWORD!}-${id}`);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  // Wait for the session before navigating; the first authenticated render may be a cold `next dev` compile.
  await expect(page.getByRole("heading", { name: "Tổng quan", exact: true })).toBeVisible({ timeout: 90_000 });
  await page.goto(admin(id) + "/lead");
  await expect(page.getByRole("heading", { name: "Hộp thư lead", exact: true })).toBeVisible();
}

async function visit(page: Page, id: string, { popup = false } = {}) {
  const visitor = await page.context().newPage();
  const errors: string[] = [];
  visitor.on("pageerror", (error) => errors.push(error.message));
  // The consult popup auto-opens on scroll; only the popup journey lets it.
  if (!popup) await visitor.addInitScript(() => sessionStorage.setItem("t15-consult-shown", "1"));
  await visitor.goto(site(id), { waitUntil: "networkidle" });
  return { visitor, errors };
}

// A click before hydration natively GET-submits the form and skips the client checks (admin.spec.ts lead inbox).
const hydrated = (element: Locator) => expect.poll(() => element.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps$"))), { timeout: 60_000 }).toBe(true);

async function submitLead(form: Locator, name: string, submit: Locator = form.locator('button[type="submit"], button:not([type])')) {
  await hydrated(form);
  await form.locator('[name="name"]').fill(name);
  await form.locator('[name="phone"]').fill(phone());
  await form.locator('[name="consent"]').check();
  await form.page().waitForTimeout(3100); // forms sent within 3 s are dropped as bots (E11-S01)
  const received = form.page().waitForResponse((response) => response.url().endsWith("/api/lead") && response.request().method() === "POST");
  await submit.click();
  const response = await received;
  expect(response.status()).toBe(200);
  const { id } = await response.json();
  expect(id).toEqual(expect.any(String));
  return id as string;
}

async function expectLead(inbox: Page, leadId: string, name: string, fields: Record<string, string | RegExp>) {
  await inbox.bringToFront();
  await inbox.reload();
  const row = inbox.locator(`[data-lead-id="${leadId}"]`);
  await expect(row).toBeVisible();
  await expect(row.getByRole("heading", { level: 2 })).toHaveText(name);
  for (const [term, value] of Object.entries(fields)) await expect(row.locator(`dl > div:has(> dt:text-is("${term}")) > dd`)).toHaveText(value);
  return row;
}

for (const id of ["t08", "t12", "t15"]) {
  test(`${id}: trang chủ → phân khúc → hóa đơn → kết quả → báo giá → lead trong CMS`, async ({ page, browser }, info) => {
    test.setTimeout(240_000);
    await openInbox(page, id);
    const { visitor, errors } = await visit(page, id);
    const calculator = visitor.locator('[data-section-type="calculator"]');
    await hydrated(calculator.locator("form"));
    // Segment card → shared segment state selects the calculator's segment (t08 jumps to #du-toan, t12/t15 elsewhere).
    await visitor.locator('[data-section-type="segments"] a[href*="phan-khuc=nha-xuong"]').first().click();
    await expect(calculator.locator('input[type="radio"][value="factory"]')).toBeChecked();
    // t12 calculator (t08, t12) is a wizard: the bill is step 2.
    const next = calculator.getByRole("button", { name: "Tiếp tục", exact: true });
    if (await next.isVisible()) await next.click();
    const bill = calculator.getByLabel("Tiền điện trung bình mỗi tháng", { exact: true });
    const cost = calculator.locator("[data-calculator-cost]");
    const before = await cost.textContent();
    await bill.fill("50.000.000");
    await expect(bill).toHaveValue("50.000.000");
    await expect(cost).not.toHaveText(before ?? "");
    await expect(calculator.locator("[data-calculator-result]")).toBeVisible();
    await info.attach(`${id}-result`, { body: await calculator.screenshot(), contentType: "image/png" });

    const name = `[DỮ LIỆU MẪU] Hành trình ${id} ${Date.now()}`;
    const form = calculator.locator("form");
    const leadId = await submitLead(form, name, form.getByRole("button", { name: /Nhận báo giá/ }));
    expect(errors).toEqual([]);
    // Segment and estimate travel with the calculator lead ("—" means missing).
    await expectLead(page, leadId, name, { "Nguồn": "Dự toán chi phí", "Phân khúc": /[^—\s]/, "Dự toán": /\d/ });

    if (id !== "t08") return;
    // Tenant isolation: another tenant's inbox never shows this lead.
    const other = await browser.newContext();
    try {
      const otherPage = await other.newPage();
      await openInbox(otherPage, "t12");
      await expect(otherPage.locator(`[data-lead-id="${leadId}"]`)).toHaveCount(0);
    } finally { await other.close(); }
  });
}

for (const id of ["t13", "t15"]) {
  test(`${id}: giỏ báo giá từ thẻ sản phẩm → lead trong CMS`, async ({ page }, info) => {
    test.setTimeout(240_000);
    await openInbox(page, id);
    const { visitor, errors } = await visit(page, id);
    const add = visitor.locator('[data-section-type="products"]').getByRole("button", { name: "Thêm báo giá", exact: true }).first();
    await hydrated(add);
    await add.click();
    const cart = visitor.locator('[data-widget="quote-cart"]');
    await expect(cart.locator("[data-cart-count]")).toHaveText("1");
    await cart.getByRole("button", { name: "Mở giỏ báo giá" }).click();
    const dialog = visitor.getByRole("dialog");
    const product = (await dialog.getByRole("listitem").first().getByRole("heading", { level: 3 }).textContent())!.trim();
    await info.attach(`${id}-cart`, { body: await visitor.screenshot(), contentType: "image/png" });

    const name = `[DỮ LIỆU MẪU] Giỏ ${id} ${Date.now()}`;
    const leadId = await submitLead(dialog.locator("form"), name);
    expect(errors).toEqual([]);
    await expectLead(page, leadId, name, { "Nguồn": "Giỏ yêu cầu báo giá", "Sản phẩm": new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
  });
}

test("t13: popup tư vấn tự mở khi cuộn → lead trong CMS", async ({ page }, info) => {
  test.setTimeout(240_000);
  await openInbox(page, "t13");
  const { visitor, errors } = await visit(page, "t13", { popup: true });
  const dialog = visitor.getByRole("dialog");
  // The scroll listener attaches after hydration; keep scrolling until the popup opens on its own.
  await expect(async () => {
    await visitor.evaluate(() => window.scrollTo(0, 0));
    await visitor.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(dialog).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 60_000 });
  await dialog.getByRole("button", { name: "Nhận tư vấn ngay", exact: true }).click();
  await info.attach("t13-popup", { body: await visitor.screenshot(), contentType: "image/png" });

  const name = `[DỮ LIỆU MẪU] Popup t13 ${Date.now()}`;
  const leadId = await submitLead(dialog.locator("form"), name);
  expect(errors).toEqual([]);
  await expectLead(page, leadId, name, { "Nguồn": "Popup tư vấn" });
});
