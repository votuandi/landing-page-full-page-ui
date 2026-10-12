import { expect, test } from "@playwright/test";

const origin = (id: string) => `http://${id}.localhost:3211`;
const postSlug = "tien-dien-2-trieu-nen-lap-bao-nhieu-kwp";
const productSlug = "helionyx-nova-n-590w";
const projectSlug = "nha-pho-binh-thanh";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("t15-consult-shown", "1"));
});
test("A/B/A/B share one instance: theme, content, chrome and metadata follow the host", async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const tokens = new Map<string, string>();
  for (const id of ["t15", "t12", "t15", "t12"]) {
    for (const path of ["/", `/tin-tuc/${postSlug}`, `/cong-trinh/${projectSlug}`, "/uu-dai/nang-luong"]) {
      const response = await page.goto(origin(id) + path, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toContainText(`Demo ${id}`);
      await expect(page.locator("main")).not.toContainText(`Demo ${id === "t15" ? "t12" : "t15"}`);
      await expect(page.locator('[data-section-type="site-header"]')).toHaveCount(1);
      await expect(page.locator('[data-section-type="site-footer"]')).toHaveCount(1);
      await expect(page.locator('[data-section-fallback]')).toHaveCount(0);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", origin(id) + (path === "/" ? "" : path));
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", origin(id) + (path === "/" ? "" : path));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(id === "t15" ? "solar-panels-hero" : "solar-battery-hero"));
      await expect(page).toHaveTitle(new RegExp(`Demo ${id}`));
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(jsonLd.join(" ")).not.toMatch(/Organization|lumivolt\.vn/);
    }
    tokens.set(id, await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--c-primary")));
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin(id), { waitUntil: "networkidle" });
      const screenshot = info.outputPath(`${id}-${width}.png`);
      await page.screenshot({ path: screenshot, fullPage: true, caret: "initial" });
      await info.attach(`${id}-${width}`, { path: screenshot, contentType: "image/png" });
    }
  }
  expect(tokens.get("t15")).not.toEqual(tokens.get("t12"));
  expect(errors).toEqual([]);
});

test("every seeded t15 route has a DB equivalent; reserved, missing and internal paths return 404", async ({ page }) => {
  test.setTimeout(240_000);
  for (const id of ["t15", "t12"]) {
    await page.goto(origin(id));
    const paths = new Set(["/san-pham", "/giai-phap", "/tin-tuc", "/cam-nang", "/ve-chung-toi", "/lien-he", "/uu-dai/nang-luong"]);
    for (const list of ["/san-pham", "/giai-phap", "/tin-tuc"]) {
      await page.goto(origin(id) + list);
      for (const href of await page.locator("main a[href]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")!))) if (href.startsWith(list + "/")) paths.add(href);
    }
    for (const slug of ["nha-pho-binh-thanh", "biet-thu-da-lat", "sieu-thi-mini-can-tho", "chuoi-cafe-da-nang", "xuong-co-khi-dong-nai", "kho-lanh-tay-ninh", "trai-ga-tay-ninh", "trai-heo-dong-thap"]) paths.add(`/cong-trinh/${slug}`);
    for (const slug of ["bao-hanh", "doi-tra", "van-chuyen", "bao-mat", "dai-ly"]) paths.add(`/chinh-sach/${slug}`);
    for (const path of paths) {
      const response = await page.goto(origin(id) + path);
      expect(response?.status(), `${id}${path}`).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", origin(id) + path);
    }
    for (const path of ["/missing", "/cong-trinh", "/tin-tuc/draft", "/robots.txt", "/sitemap.xml", "/sites/x"]) {
      const response = await page.goto(origin(id) + path);
      expect(response?.status(), path).toBe(404);
    }
  }
});

test("catalog filters, quick view, quote cart, guide anchors and client navigation keep DB data", async ({ page }) => {
  await page.goto(`${origin("t15")}/san-pham?category=panel&sort=price-asc`, { waitUntil: "networkidle" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin("t15")}/san-pham`);
  await expect(page.locator("main article")).toHaveCount(4);
  await page.getByRole("button", { name: /Xem nhanh/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Demo t15");
  await dialog.getByRole("button", { name: /Thêm/ }).click();
  await dialog.getByRole("button", { name: "Xem giỏ báo giá" }).click();
  await expect(page.getByRole("dialog")).toContainText("Demo t15");
  await page.keyboard.press("Escape");
  await page.goto(`${origin("t15")}/tin-tuc`);
  await page.locator(`main a[href="/tin-tuc/${postSlug}"]`).click();
  await expect(page).toHaveURL(`${origin("t15")}/tin-tuc/${postSlug}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin("t15")}/tin-tuc/${postSlug}`);
  await page.goto(`${origin("t15")}/cam-nang`);
  await page.getByRole("navigation", { name: "Mục lục" }).getByRole("link", { name: "Hỏi đáp" }).click();
  await expect(page).toHaveURL(/#hoi-dap$/);
  await expect(page.locator("#hoi-dap")).toBeVisible();
  await page.goto(`${origin("t12")}/san-pham/${productSlug}`);
  await expect(page.locator("main")).toContainText("Demo t12");
  await expect(page.locator('[data-widget="quote-cart"]')).toHaveCount(0);
  await expect(page.locator('[data-section-type="products"]')).toHaveCount(0);
});

test("JS disabled and reduced motion preserve SSR content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const id of ["t15", "t12"]) {
    await page.goto(origin(id));
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("main")).toContainText(`Demo ${id}`);
    await page.goto(`${origin(id)}/san-pham`);
    await expect(page.locator("main article").first()).toBeVisible();
  }
  await context.close();
});

test("spoofed headers cannot select B; tenant leads return 503 before the legacy adapter", async ({ request }) => {
  const response = await request.get("http://localhost:3211/", { headers: { Host: "t15.localhost", "x-tenant-id": "B", "x-site-id": "B", "X-Forwarded-Host": "t12.localhost" } });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Demo t15");
  expect(html).not.toContain("Demo t12");
  for (const data of [{ website: "bot" }, { name: "A", phone: "0901234500" }]) {
    const lead = await request.post("http://localhost:3211/api/lead", { headers: { Host: "t15.localhost" }, data });
    expect(lead.status()).toBe(503);
    expect((await lead.json()).ok).toBe(false);
  }
});
