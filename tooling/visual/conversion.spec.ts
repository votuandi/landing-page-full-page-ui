import { expect, test } from "@playwright/test";

const TYPES = ["site-header", "hero", "segments", "packages", "calculator", "lead-form", "site-footer"];

test("segment grid synchronizes packages and calculator without reloading, including reverse selection", async ({ page }, testInfo) => {
  await page.goto("/lab/sections/t15", { waitUntil: "networkidle" });
  await page.evaluate(() => { (window as Window & { __noReload?: number }).__noReload = 1; });
  const packages = page.locator("#goi-giai-phap");
  const calculator = page.locator("#du-toan");
  const farm = page.locator("#phan-khuc").getByRole("link", { name: /Trang trại/ });
  await farm.click();
  await expect(farm).toHaveAttribute("aria-current", "true");
  await expect(packages.getByRole("button", { name: "Trang trại", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(packages.getByRole("heading", { name: "Gói Trại nhỏ" })).toBeVisible();
  await expect(calculator.getByRole("radio", { name: "Trang trại", exact: true })).toBeChecked();
  await expect(calculator.getByLabel("Tiền điện trung bình mỗi tháng")).toHaveValue("25.000.000");
  expect(new URL(page.url()).searchParams.get("phan-khuc")).toBe("farm");
  expect(await page.evaluate(() => (window as Window & { __noReload?: number }).__noReload)).toBe(1);
  await calculator.getByText("Nhà xưởng", { exact: true }).click();
  await expect(packages.getByRole("button", { name: "Nhà xưởng", exact: true })).toHaveAttribute("aria-pressed", "true");
  await testInfo.attach("shared-segment", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("without segment grid, defaults, estimation, package prefill and URL segment still work", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/lab/sections/t15?an=segments", { waitUntil: "networkidle" });
  await expect(page.locator('[data-section-type="segments"]')).toHaveCount(0);
  const packages = page.locator("#goi-giai-phap");
  const calculator = page.locator("#du-toan");
  await expect(packages.getByRole("button", { name: "Hộ gia đình", exact: true })).toHaveAttribute("aria-pressed", "true");
  const cost = calculator.locator("[data-calculator-cost]");
  const before = await cost.textContent();
  await calculator.getByLabel("Tiền điện trung bình mỗi tháng").fill("5.000.000");
  await expect(cost).not.toHaveText(before ?? "");
  await packages.getByRole("button", { name: /Nhận tư vấn gói này/ }).first().click();
  await expect(calculator.getByText(/Đang hỏi giá:/)).toBeVisible();
  await page.goto("/lab/sections/t15?an=segments&phan-khuc=trang-trai", { waitUntil: "networkidle" });
  await expect(packages.getByRole("button", { name: "Trang trại", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(calculator.getByRole("radio", { name: "Trang trại", exact: true })).toBeChecked();
  await expect(calculator.getByLabel("Tiền điện trung bình mỗi tháng")).toHaveValue("25.000.000");
  expect(errors).toEqual([]);
});

test("package CTA navigates to calculator page when calculator section is absent", async ({ page }) => {
  await page.goto("/lab/sections/t15?an=calculator", { waitUntil: "networkidle" });
  await expect(page.locator('[data-section-type="calculator"]')).toHaveCount(0);
  await page.locator("#goi-giai-phap").getByRole("button", { name: /Nhận tư vấn gói này/ }).first().click();
  await expect(page).toHaveURL(/\/\?phan-khuc=household.*#du-toan$/);
  expect(new URL(page.url()).pathname).toBe("/");
});

test("URL prefill keeps its bill while the provider hydrates", async ({ page }) => {
  await page.goto("/lab/sections/t15?phan-khuc=trang-trai&hoa-don=37000000#du-toan", { waitUntil: "networkidle" });
  await expect(page.locator("#du-toan").getByLabel("Tiền điện trung bình mỗi tháng")).toHaveValue("37.000.000");
  await expect(page.locator("#goi-giai-phap").getByRole("button", { name: "Trang trại", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("segment selection keeps query and hash when the target section is absent", async ({ page }) => {
  await page.goto("/lab/sections/t15?an=packages&lang=vi#phan-khuc", { waitUntil: "networkidle" });
  await page.locator("#phan-khuc").getByRole("link", { name: /Trang trại/ }).click();
  await expect(page.locator("#du-toan").getByRole("radio", { name: "Trang trại", exact: true })).toBeChecked();
  const url = new URL(page.url());
  expect(url.pathname).toBe("/lab/sections/t15");
  expect(url.searchParams.get("an")).toBe("packages");
  expect(url.searchParams.get("lang")).toBe("vi");
  expect(url.searchParams.get("phan-khuc")).toBe("farm");
  expect(url.hash).toBe("#phan-khuc");
});

test("segment grid retains visible content and navigation without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:3210/lab/sections/t15");
    const farm = page.locator("#phan-khuc").getByRole("link", { name: /Trang trại/ });
    await expect(farm).toBeVisible();
    await expect(farm).toHaveAttribute("href", "?phan-khuc=trang-trai#goi-giai-phap");
    await farm.click();
    await expect(page).toHaveURL(/phan-khuc=trang-trai#goi-giai-phap$/);
  } finally { await context.close(); }
});

test("7 section luồng chuyển đổi t15 render từ fixture, dự toán và tab gói tương tác được", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/lab/sections/t15", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);

  const sections = page.locator("[data-section-id]");
  expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section-type")))).toEqual(TYPES);
  await expect(page.locator("[data-section-fallback]")).toHaveCount(0);
  for (const type of TYPES) await expect(page.locator(`[data-section-type="${type}"]`)).not.toBeEmpty();

  // Dự toán: đổi tiền điện → chi phí ước tính đổi.
  const calc = page.locator("#du-toan");
  const cost = calc.locator("[data-calculator-cost]");
  const before = await cost.textContent();
  await calc.getByLabel("Tiền điện trung bình mỗi tháng").fill("5.000.000");
  await expect(cost).not.toHaveText(before ?? "");
  // Chọn phân khúc nhà xưởng → ô tiền điện về mặc định của phân khúc.
  await calc.getByText("Nhà xưởng", { exact: true }).click();
  await expect(calc.getByLabel("Tiền điện trung bình mỗi tháng")).toHaveValue("80.000.000");

  // Tab gói: chọn Trang trại → thẻ gói trang trại.
  const pkgs = page.locator("#goi-giai-phap");
  await pkgs.getByRole("button", { name: "Trang trại" }).click();
  await expect(pkgs.getByRole("heading", { name: "Gói Trại nhỏ" })).toBeVisible();

  // Nút gói mở dự toán, điền sẵn nhu cầu.
  await pkgs.getByRole("button", { name: /Nhận tư vấn gói này/ }).first().click();
  await expect(calc.getByText(/Đang hỏi giá: Gói Trại nhỏ/)).toBeVisible();

  expect(errors).toEqual([]);
  await testInfo.attach("lab-t15", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("lab t15 render tiếng Anh qua site.locale", async ({ page }) => {
  await page.goto("/lab/sections/t15?lang=en", { waitUntil: "networkidle" });
  await expect(page.locator('[data-section-type="hero"] h1')).toContainText("Clean power from");
  await expect(page.locator("#du-toan").getByLabel("Average monthly electricity bill")).toBeVisible();
});
