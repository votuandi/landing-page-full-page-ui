import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

function fixture(action: string) {
  return execFileSync(process.execPath, ["--import", "tsx", "scripts/tenant-browser-fixture.ts", action], { cwd: resolve(__dirname, "../../apps/web"), encoding: "utf8" });
}

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
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(`^http://${id}\\.localhost:3211/images/`));
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

for (const id of ["t15", "t12"]) {
for (const group of ["products", "posts", "services", "projects", "system"] as const) {
  test(`${id}: seeded ${group} have DB equivalents`, async ({ page }) => {
    const manifest = JSON.parse(fixture("manifest")) as Record<string, string[]>;
    const prefix = { products: "/san-pham", posts: "/tin-tuc", services: "/giai-phap", projects: "/cong-trinh", system: "" }[group];
    const paths = group === "system"
      ? ["/cam-nang", "/ve-chung-toi", "/lien-he", "/uu-dai/nang-luong"]
      : manifest[group].map((slug) => `${prefix}/${slug}`);
    if (["products", "posts", "services"].includes(group)) {
      await page.goto(origin(id) + prefix);
      await expect(page.locator("main article")).toHaveCount(manifest[group].length);
      if (group !== "products") await expect(page.locator("main article img")).toHaveCount(manifest[group].length);
      if (group === "posts") {
        await expect(page.locator("main")).toContainText("phút đọc");
        await expect(page.locator("main")).toContainText("Hộ gia đình");
      }
      if (group === "services") {
        await expect(page.locator("main article").first()).toContainText(manifest.servicePrices[0]);
        await expect(page.locator("main article").first()).toContainText(manifest.serviceSolutions[0]);
      }
      for (const path of paths) await expect(page.locator(`main a[href="${path}"]`).first()).toBeVisible();
      paths.unshift(prefix);
    }
    for (const path of paths) {
      const response = await page.goto(origin(id) + path);
      expect(response?.status(), `${id}${path}`).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", origin(id) + path);
      if (path.startsWith("/tin-tuc/")) await expect(page.getByRole("link", { name: "Dự toán chi phí" })).toHaveAttribute("href", /#du-toan$/);
      if (path.startsWith("/cong-trinh/")) {
        await expect(page.locator("main")).toContainText("Tiết kiệm mỗi tháng");
        await expect(page.getByRole("link", { name: "Nhận báo giá công trình tương tự" })).toHaveAttribute("href", "/lien-he");
      }
      if (path.startsWith("/giai-phap/")) {
        await expect(page.locator("main ol li")).toHaveCount(5);
        await expect(page.locator('main form input[name="phone"]')).toBeVisible();
      }
    }
  });
}
test(`${id}: every policy and reserved, missing or internal path`, async ({ page }) => {
    for (const slug of ["bao-hanh", "doi-tra", "van-chuyen", "bao-mat", "dai-ly"]) {
      const path = `/chinh-sach/${slug}`;
      const response = await page.goto(origin(id) + path);
      expect(response?.status(), `${id}${path}`).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", origin(id) + path);
      await expect(page.locator("main h1")).toBeVisible();
    }
    for (const path of ["/missing", "/cong-trinh", "/tin-tuc/draft", "/robots.txt", "/sitemap.xml", "/sites/x"]) {
      const response = await page.goto(origin(id) + path);
      expect(response?.status(), path).toBe(404);
    }
});
}

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
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
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
    for (const path of [`/san-pham/${productSlug}`, `/tin-tuc/${postSlug}`, `/cong-trinh/${projectSlug}`, "/giai-phap/solar-gia-dinh", "/cam-nang", "/ve-chung-toi", "/lien-he"]) {
      await page.goto(origin(id) + path);
      await expect(page.locator("main h1")).toBeVisible();
      if (["/lien-he", "/giai-phap/solar-gia-dinh"].includes(path)) await expect(page.locator('main form input[name="phone"]')).toBeVisible();
    }
  }
  await context.close();
});

test.describe("review fixtures: EN, complete cart lookup, mobile controls and theme configuration", () => {
  test.beforeAll(() => { fixture("setup"); });
  test.afterAll(() => { fixture("cleanup"); });
  const url = "http://review.localhost:3211";
  test("home section, quick view, packages and actual cart keep EN prices after switching and reload", async ({ page }, info) => {
    await page.context().addCookies([{ name: "solar-locale", value: "vi", url }]);
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    const products = page.locator('[data-section-type="products"]');
    await expect(products).toContainText("Giảm 20%");
    for (const i of [0, 1]) {
      const card = products.locator("article").filter({ has: page.getByRole("heading", { name: `Sản phẩm VI ${i}`, exact: true }) });
      await card.getByRole("button", { name: /Xem nhanh/ }).click();
      await expect(page.getByRole("dialog")).toContainText(i === 0 ? "Liên hệ" : "Giảm 20%");
      await page.getByRole("dialog").getByRole("button", { name: /Thêm/ }).click();
      await page.keyboard.press("Escape");
    }
    await page.getByRole("button", { name: "en", exact: true }).click();
    for (const reload of [false, true]) {
      if (reload) await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(products).toContainText("Contact");
      await expect(products).toContainText("Original price");
      await expect(products).toContainText("Save 20%");
      const packages = page.locator('[data-section-type="packages"]');
      await expect(packages).toContainText("144M VND");
      await expect(packages).toContainText("180M VND");
      await expect(packages).not.toContainText(/144 triệu|180 triệu|Giá gốc|Giảm/);
      for (const i of [0, 1]) {
        const card = products.locator("article").filter({ has: page.getByRole("heading", { name: `English product ${i}`, exact: true }) });
        await card.getByRole("button", { name: /Quick view/ }).click();
        const quick = page.getByRole("dialog");
        await expect(quick).toContainText(i === 0 ? "Contact" : "Save 20%");
        if (i === 1) await expect(quick).toContainText("Original price");
        await page.keyboard.press("Escape");
      }
      await page.locator('[data-cart-count]').click();
      const cart = page.locator('[data-widget="quote-cart"]').getByRole("dialog");
      await expect(cart).toContainText("English product 0");
      await expect(cart).toContainText("English product 1");
      await expect(cart).toContainText("Contact for price");
      await expect(cart).toContainText("Original price");
      await expect(cart).toContainText("Save 20%");
      await expect(cart).not.toContainText(/Liên hệ|Giá gốc|Giảm/);
      if (reload) await page.screenshot({ path: info.outputPath("home-cart-en-after-reload.png") });
      await page.keyboard.press("Escape");
    }
  });
  for (const [path, from, title, description] of [
    ["/san-pham/review-sku-2", "/san-pham", "Sản phẩm thiếu EN", "Unbranded · Bảo hành VI"],
    ["/cong-trinh/review-project", "/giai-phap/solar-gia-dinh", "Công trình thiếu EN", "Mô tả công trình VI"],
    ["/giai-phap/review-service", "/giai-phap", "Giải pháp thiếu EN", "English description"],
    ["/chinh-sach/review-policy", "/chinh-sach/bao-hanh", "Chính sách VI", "English description"],
  ]) {
    test(`metadata dispatcher: direct and client navigation ${path}`, async ({ page }) => {
      const fullTitle = `${title} | [DỮ LIỆU MẪU] Solar company with a very long name for mobile menu`;
      for (const client of [false, true]) {
        if (client) {
          await page.goto(url + from, { waitUntil: "networkidle" });
          await page.locator(`main a[href="${path}"]`).first().click();
          await expect(page).toHaveURL(url + path);
        } else expect((await page.goto(url + path))?.status()).toBe(200);
        await expect(page.locator("main h1")).toHaveText(title);
        await expect(page).toHaveTitle(fullTitle);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", description);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", fullTitle);
        await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description);
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", url + path);
        await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url + path);
      }
    });
  }
  test("filter waits for hydration, then opens on its first keyboard activation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    let release!: () => void;
    const scriptsReady = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/_next/static/**/*.js", async (route) => { await scriptsReady; await route.continue(); });
    try {
      await page.goto(url + "/san-pham", { waitUntil: "commit" });
      const filters = page.getByRole("button", { name: /^Filters/ });
      const quick = page.getByRole("button", { name: /Quick view/ }).first();
      await expect(filters).toBeDisabled();
      await expect(quick).toBeDisabled();
      release();
      await expect(filters).toBeEnabled();
      await filters.focus();
      await page.keyboard.press("Enter");
      const drawer = page.getByRole("dialog", { name: "Filters", exact: true });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("option", { name: "Household", exact: true })).toHaveCount(1);
      await expect(drawer.getByRole("option", { name: "Business", exact: true })).toHaveCount(1);
      await expect(drawer.getByRole("option", { name: "Projects / factories", exact: true })).toHaveCount(1);
      await expect(drawer.getByRole("option", { name: "≥ 600 W (panels)", exact: true })).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(filters).toBeFocused();
      await expect(page.getByRole("button", { name: "Under 1 million VND", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Over 50 million VND", exact: true })).toBeVisible();
      const noPrice = page.locator("main article").filter({ has: page.getByRole("link", { name: "English product 0", exact: true }) });
      await expect(noPrice).toContainText("Contact for price");
      const sale = page.locator("main article").filter({ has: page.getByRole("link", { name: "English product 1", exact: true }) });
      await expect(sale).toContainText("Save 20%");
      await expect(sale).toContainText("Original price");
      await expect(quick).toBeEnabled();
      await quick.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(quick).toBeFocused();
    } finally { release(); }
  });
  test("locale switch refreshes records, chrome, widgets and metadata on reload and client navigation", async ({ page }) => {
    for (const [path, title] of [["/san-pham", "Products"], ["/tin-tuc", "News"], ["/giai-phap", "Solutions"], ["/cam-nang", "English cam-nang"], ["/ve-chung-toi", "English ve-chung-toi"], ["/lien-he", "English lien-he"], ["/uu-dai/nang-luong", "English uu-dai/nang-luong"]]) {
      await page.goto(url + path, { waitUntil: "networkidle" });
      await expect(page).toHaveTitle(new RegExp(title));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "English description");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url + path);
    }
    await page.goto(url + "/tin-tuc/review-post", { waitUntil: "networkidle" });
    await expect(page.locator("main h1")).toHaveText("English post");
    await expect(page.locator("main")).toContainText("English post body");
    await expect(page.getByRole("link", { name: "Estimate costs" })).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "English excerpt");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", url + "/images/illustrations/home-solar.webp");
    await page.getByRole("button", { name: "vi", exact: true }).click();
    await expect(page.locator("main h1")).toHaveText("Bài viết VI");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Mô tả VI");
    await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
    await page.reload();
    await expect(page.locator("main h1")).toHaveText("Bài viết VI");
    await page.locator('header a[href="/"]').click();
    await expect(page.locator("main")).toContainText("Tiêu đề VI");
    await page.getByRole("button", { name: "en", exact: true }).click();
    await expect(page.locator("main")).toContainText("English hero");
    await expect(page.locator('[data-widget="commitments-strip"]')).toContainText("Free site survey");
  });
  for (const width of [390, 1440]) {
  test(`${width}: 49th SKU stays in cart; detail content and keyboard dialogs`, async ({ page }, info) => {
    await page.route("https://media.example.test/**", (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url + "/san-pham/review-sku-48", { waitUntil: "networkidle" });
      await expect(page.locator("main")).toContainText("/set");
      await expect(page.getByRole("link", { name: "Download datasheet" })).toHaveAttribute("href", "/files/review.pdf");
      await expect(page.locator('header a[href="/"]')).toHaveAttribute("aria-label", "[DỮ LIỆU MẪU] Solar energy installation company – Home");
      const controls = page.getByRole("button", { name: "Open menu", exact: true });
      if (width === 390) {
        const box = await controls.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        await controls.focus(); await page.keyboard.press("Enter");
        await expect(page.getByRole("dialog", { name: "Menu", exact: true })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(controls).toBeFocused();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.getByRole("button", { name: /Add to/ }).click();
      await page.locator('[data-cart-count]').click();
      const cart = page.getByRole("dialog");
      await expect(cart).toContainText("English product 48");
      await expect(cart.locator('img[src="https://media.example.test/product.webp"]')).toBeVisible();
      await page.keyboard.press("Tab");
      expect(await cart.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Escape");
      await page.goto(url + "/san-pham?category=panel", { waitUntil: "networkidle" });
      if (width === 390) {
        await page.getByRole("button", { name: /^Filters/ }).click();
        const drawer = page.getByRole("dialog", { name: "Filters", exact: true });
        await expect(drawer).toBeVisible();
        await drawer.getByLabel("Brand", { exact: false }).selectOption("Helionyx");
        await page.keyboard.press("Escape");
        await expect(drawer).toHaveCount(0);
        await expect(page.locator("main article")).toHaveCount(2);
      }
      const quick = page.getByRole("button", { name: /Quick view/ }).first();
      await expect(quick).toBeEnabled();
      await quick.focus(); await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(quick).toBeFocused();
      for (const path of ["/tin-tuc/review-post", `/cong-trinh/${projectSlug}`, "/giai-phap/solar-gia-dinh", "/cam-nang", "/ve-chung-toi", "/lien-he"]) {
        await page.goto(url + path, { waitUntil: "networkidle" });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        if (path.includes("giai-phap")) {
          const links = await page.locator('main a[href^="/cong-trinh/"]').count();
          expect(links).toBe(3);
          await expect(page.locator('main a[href="/cong-trinh/review-project"]')).toBeVisible();
        }
        await page.screenshot({ path: info.outputPath(`${width}-${path.split("/")[1]}.png`), fullPage: true, caret: "initial" });
      }
  });
  }
  test("theme override, no-dark and disabled switcher, absent/disabled chrome respect configuration", async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--c-primary").trim())).toBe("90 190 120");
    await page.getByRole("button", { name: "Switch to light mode" }).first().click();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--c-primary").trim())).toBe("10 110 70");
    for (const action of ["no-dark", "switcher-off"]) {
      fixture(action);
      await page.context().addCookies([{ name: "solar-locale", value: "vi", url }]);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator('[data-widget="theme-switch"]')).toHaveCount(0);
      await expect(page.locator('[data-header-theme]')).toHaveCount(0);
      if (action === "no-dark") await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await expect(page.getByRole("group", { name: "Language" })).toHaveCount(0);
    }
    await page.goto(url + "/giai-phap/solar-gia-dinh", { waitUntil: "networkidle" });
    await page.getByLabel("Full name", { exact: false }).fill("Review");
    await page.getByLabel("Mobile number", { exact: false }).fill("0901234567");
    const response = page.waitForResponse((response) => response.url().endsWith("/api/lead"));
    await page.getByRole("button", { name: "Get a detailed quote" }).click();
    expect((await response).status()).toBe(503);
    const error = page.locator("main form").getByRole("alert");
    await expect(error).toBeVisible();
    await expect(error.locator('a[href^="tel:"]')).toHaveCount(0);
    for (const action of ["disabled-chrome", "no-chrome"]) {
      fixture(action); await page.reload();
      await expect(page.locator('header, footer')).toHaveCount(0);
      await expect(page.locator("main h1")).toBeVisible();
    }
  });
  test("secondary domain redirects to primary host with public path and query intact", async ({ request }) => {
    const response = await request.get("http://localhost:3211/tin-tuc/review-post?q=1", { headers: { Host: "review-alt.localhost:3211" }, maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(url + "/tin-tuc/review-post?q=1");
  });
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
