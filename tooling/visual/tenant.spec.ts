import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

function fixture(action: string) {
  return execFileSync(process.execPath, ["--import", "tsx", "scripts/tenant-browser-fixture.ts", action], { cwd: resolve(__dirname, "../../apps/web"), encoding: "utf8" });
}

const origin = (id: string) => `http://${id}.localhost:3211`;
const postSlug = "tien-dien-2-trieu-nen-lap-bao-nhieu-kwp";
const productSlug = "helionyx-nova-n-590w";
const projectSlug = "nha-pho-binh-thanh";

test("uploaded image uses variants", async ({ browser }) => {
  test.setTimeout(180_000);
  fixture("setup");
  try {
    const { base } = JSON.parse(fixture("uploaded-image")) as { base: string };
    for (const javaScriptEnabled of [true, false]) for (const [width, variant] of [[1280, 1280], [390, 640]]) {
      const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
      try {
        const page = await context.newPage();
        const errors: string[] = [], requests: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("request", request => requests.push(request.url()));
        const response = page.waitForResponse(`${base}-w${variant}.avif`);
        await page.goto(origin("review"), { waitUntil: "networkidle" });
        expect((await response).status()).toBe(200);
        const hero = page.locator('[data-section-type="hero"] picture');
        await expect(hero.locator('source[type="image/avif"]')).toHaveCount(1);
        const image = hero.locator("img");
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).currentSrc)).toBe(`${base}-w${variant}.avif`);
        expect(await image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await expect(image).toHaveCSS("object-position", "20% 80%");
        expect(requests.filter(url => url.startsWith(base))).toEqual([`${base}-w${variant}.avif`]);
        expect(requests.filter(url => url.includes("/_next/image") && decodeURIComponent(url).includes(base))).toEqual([]);
        expect(errors).toEqual([]);
      } finally { await context.close(); }
    }
  } finally { fixture("cleanup"); }
});

test("homepage images properly sized", async ({ browser }) => {
  test.setTimeout(240_000);
  for (const id of ["t15", "t12"]) for (const viewport of [{ width: 412, height: 823, dpr: 1.75 }, { width: 1350, height: 940, dpr: 1 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.dpr, reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      await page.goto(origin(id), { waitUntil: "networkidle" });
      // Stricter than Lighthouse: visit the whole page so lazy images enter the same audit as the hero.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      });
      await page.waitForLoadState("networkidle");
      const images = await page.locator("img").evaluateAll(async nodes => {
        const images = nodes.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0 && image.getBoundingClientRect().width > 0 && image.getBoundingClientRect().height > 0);
        return Promise.all(images.map(async image => {
          const { width, height } = image.getBoundingClientRect();
          const bytes = [...new Uint8Array(await (await fetch(image.currentSrc)).arrayBuffer())];
          const timing = performance.getEntriesByName(image.currentSrc).find(entry => entry.entryType === "resource") as PerformanceResourceTiming | undefined;
          const breakpoints = !!image.srcset || image.parentElement instanceof HTMLPictureElement;
          return { src: image.currentSrc, width, height, dpr: window.devicePixelRatio, encodedBodySize: timing?.encodedBodySize || bytes.length, bytes, breakpoints };
        }));
      });
      expect(images.length).toBeGreaterThan(5);
      const waste: { src: string; wastedBytes: number }[] = [];
      for (const image of images) {
        const metadata = await sharp(Buffer.from(image.bytes)).metadata();
        expect(metadata.width).toBeGreaterThan(0); expect(metadata.height).toBeGreaterThan(0);
        const wastedBytes = image.encodedBodySize * (1 - image.width * image.height * image.dpr ** 2 / (metadata.width! * metadata.height!));
        // Lighthouse `uses-responsive-images`: 12 KiB allowance with srcset/<picture> breakpoints, 4 KiB otherwise.
        if (wastedBytes >= (image.breakpoints ? 12 : 4) * 1024) waste.push({ src: image.src, wastedBytes: Math.round(wastedBytes) });
      }
      expect(waste, `${id} ${viewport.width}px DPR ${viewport.dpr}`).toEqual([]);
    } finally { await context.close(); }
  }
});

test("media crawl has no 404", async ({ page }) => {
  test.setTimeout(180_000);
  fixture("setup");
  try {
    const { url, poster } = JSON.parse(fixture("self-hosted-video")) as { url: string; poster: string };
    await page.goto(origin("review"), { waitUntil: "networkidle" });
    const dialog = page.getByRole("dialog", { name: /Self-hosted video/ });
    // A click before hydration is a no-op (README flaky list); retry until the dialog opens.
    await expect(async () => {
      await page.getByRole("button", { name: /Play video:.*Self-hosted video/ }).click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    const media = dialog.locator("video");
    await expect(media).toHaveAttribute("src", url);
    await expect(media).toHaveAttribute("poster", poster);
    // Include mounted video alongside SSR image/source srcsets.
    const urls = await page.locator("img, source, video, audio").evaluateAll(elements => {
      const urls = new Set<string>();
      for (const node of elements) for (const attribute of ["src", "poster", "srcset"]) {
        const value = node.getAttribute(attribute);
        if (!value) continue;
        const items = attribute === "srcset" ? value.split(/,\s*/).map(part => part.trim().split(/\s+/)[0]) : [value];
        for (const item of items) { const resolved = new URL(item, document.baseURI); if (["http:", "https:"].includes(resolved.protocol)) urls.add(resolved.href); }
      }
      return [...urls];
    });
    expect(urls).toContain(url); expect(urls).toContain(poster);
    // Node API requests cannot resolve *.localhost on Windows: HEAD those same-origin URLs from the page, the media
    // server (cross-origin, no CORS) from Node.
    const sameSite = urls.filter(address => new URL(address).hostname.endsWith(".localhost"));
    const failures = await page.evaluate(async addresses => (await Promise.all(addresses.map(async address => {
      try { const response = await fetch(address, { method: "HEAD" }); return response.ok ? null : `${response.status} ${address}`; }
      catch { return `network ${address}`; }
    }))).filter(Boolean), sameSite);
    for (const address of urls.filter(address => !sameSite.includes(address))) {
      try { const response = await page.request.head(address); if (!response.ok()) failures.push(`${response.status()} ${address}`); }
      catch { failures.push(`network ${address}`); }
    }
    expect(failures).toEqual([]);
    // Same Windows limitation for the Node crawler (covered by scripts/media-crawl.test.mjs); CI runs it on Ubuntu.
    if (process.platform === "win32") return;
    const crawl = JSON.parse(execFileSync(process.execPath, [resolve(__dirname, "../../scripts/media-crawl.mjs"), origin("review")], { encoding: "utf8" })) as { checked: number; failures: unknown[] };
    expect(crawl.checked).toBeGreaterThan(0); expect(crawl.failures).toEqual([]);
  } finally { fixture("cleanup"); }
});

test("shorts self-hosted video plays", async ({ page, browser }) => {
  fixture("setup");
  try {
    const { url, poster } = JSON.parse(fixture("self-hosted-video")) as { url: string; poster: string };
    expect((await page.goto(origin("review"), { waitUntil: "networkidle" }))?.status()).toBe(200);
    const card = page.getByRole("button", { name: /Play video:.*Self-hosted video/ });
    await expect(card).toBeVisible();
    // Poster is already in SSR HTML when JavaScript is disabled.
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    try {
      const ssr = await noJs.newPage(); await ssr.goto(origin("review"));
      await expect(ssr.getByRole("button", { name: /Play video:.*Self-hosted video/ }).locator("img")).toHaveAttribute("src", poster);
    } finally { await noJs.close(); }
    await card.click();
    const video = page.getByRole("dialog", { name: /Self-hosted video/ }).locator("video");
    await expect(video).toHaveAttribute("src", url);
    await expect(video).toHaveAttribute("poster", poster);
    await expect.poll(() => video.evaluate(node => (node as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
    const response = await page.request.get(url, { headers: { Range: "bytes=0-99" } });
    expect(response.status()).toBe(206); expect(response.headers()["content-type"]).toBe("video/mp4");
    expect((await response.body()).length).toBe(100);
  } finally { fixture("cleanup"); }
});

test("brand font and favicon", async ({ page, browser }) => {
  test.setTimeout(180_000);
  fixture("setup");
  try {
    const id = fixture("brand-font-favicon").trim();
    await page.goto(origin("review"), { waitUntil: "networkidle" });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-sans"))).toContain('"Manrope"');
    await expect(page.locator('link[rel="preload"][as="font"][href*="manrope"]')).not.toHaveCount(0);
    await expect(page.locator(`link[rel="icon"][href="/icon.png?v=${id}"]`)).toHaveCount(1);
    await expect(page.locator(`link[rel="apple-touch-icon"][href="/apple-icon.png?v=${id}"]`)).toHaveCount(1);
    for (const [path, size] of [["icon.png", 64], ["apple-icon.png", 180]] as const) {
      const response = await page.request.get(`http://localhost:3211/${path}?v=${id}`, { headers: { Host: "review.localhost" } });
      expect(response.status()).toBe(200); expect(response.headers()["content-type"]).toBe("image/png");
      expect(await sharp(await response.body()).metadata()).toMatchObject({ width: size, height: size, format: "png" });
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    try {
      const ssr = await noJs.newPage(); await ssr.goto(origin("review"));
      expect(await ssr.content()).toContain('--font-sans:"Manrope"');
      await expect(ssr.locator(`link[rel="icon"][href="/icon.png?v=${id}"]`)).toHaveCount(1);
    } finally { await noJs.close(); }
    await page.goto(origin("t12"));
    await expect(page.locator(`link[rel="icon"][href="/icon.png?v=${id}"]`)).toHaveCount(0);
    fixture("brand-downgrade");
    await page.goto(origin("review"));
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-sans"))).not.toContain('"Manrope"');
  } finally { fixture("cleanup"); }
});

test("backup restore renders identical home", async ({ page }, info) => {
  test.setTimeout(180_000);
  fixture("backup-restore");
  // The source page is the baseline; it is written per run and never committed.
  const snapshot = info.snapshotPath("backup-restore-home.png");
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    const capture = async (host: string) => {
      expect((await page.goto(origin(host), { waitUntil: "networkidle" }))?.status()).toBe(200);
      // Dynamic islands (projects t14 tabs) select their first panel only after the chunk mounts.
      await page.waitForFunction(() => document.querySelector("[role=tabpanel][hidden]") !== null);
      await page.evaluate(async () => {
        await document.fonts.ready;
        // Off-screen lazy images never load on their own, so decode() would wait forever.
        await Promise.all(Array.from(document.images).map(img => {
          img.loading = "eager";
          return Promise.race([img.decode().catch(() => undefined), new Promise(done => setTimeout(done, 5_000))]);
        }));
      });
      return page.screenshot({ fullPage: true, animations: "disabled" });
    };
    const reference = await capture("t15");
    await mkdir(dirname(snapshot), { recursive: true }); await writeFile(snapshot, reference);
    const restored = await capture("clone");
    expect(restored).toMatchSnapshot("backup-restore-home.png", { maxDiffPixelRatio: 0.01 });
    await info.attach("source-home", { body: reference, contentType: "image/png" });
    await info.attach("restored-home", { body: restored, contentType: "image/png" });
  } finally {
    fixture("backup-cleanup");
    await rm(dirname(snapshot), { recursive: true, force: true });
  }
});

test("disabled page type returns 404 and disappears from sitemap; re-enable preserves page", async ({ page }) => {
  fixture("setup");
  try {
    fixture("disable-about");
    const response = await page.goto(origin("review") + "/ve-chung-toi");
    expect(response?.status()).toBe(404);
    const sitemap = await page.goto(origin("review") + "/sitemap.xml");
    expect(await sitemap?.text()).not.toContain("/ve-chung-toi");
    fixture("enable-about");
    expect((await page.goto(origin("review") + "/ve-chung-toi"))?.status()).toBe(200);
  } finally { fixture("cleanup"); }
});
// A cold `next dev` compiles each tenant route on its first hit, which can exceed the 30 s navigation timeout on CI
// and race the browser against half-written dev manifests. Compile the main routes once, outside any navigation.
test.beforeAll(async ({ request }) => {
  test.setTimeout(600_000);
  for (const path of ["/", `/tin-tuc/${postSlug}`, `/cong-trinh/${projectSlug}`, "/uu-dai/nang-luong", "/san-pham", "/tin-tuc", "/lien-he"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await request.get(`http://localhost:3211${path}`, { headers: { Host: "t15.localhost" }, timeout: 180_000 }).catch(() => null);
      if (response?.ok()) break;
    }
  }
});
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
      // Tenant Organization only, at this host; never the legacy t15 brand or the other tenant.
      expect(jsonLd.join(" ")).not.toMatch(/lumivolt\.vn/);
      expect(jsonLd.join(" ")).not.toContain(origin(id === "t15" ? "t12" : "t15"));
      expect(jsonLd.map((value) => JSON.parse(value)).find((value) => value["@graph"])?.["@graph"][0]).toMatchObject({ "@type": "Organization", url: `${origin(id)}/` });
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
    // /robots.txt and /sitemap.xml are served per tenant since E5-S08 (checked in the SEO test).
    for (const path of ["/missing", "/cong-trinh", "/tin-tuc/draft", "/sites/x"]) {
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
  await page.locator(`main:visible a[href="/tin-tuc/${postSlug}"]`).click();
  await expect(page).toHaveURL(`${origin("t15")}/tin-tuc/${postSlug}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin("t15")}/tin-tuc/${postSlug}`);
  await page.goto(`${origin("t15")}/cam-nang`);
  // App Router replaceState lúc hydrate xóa hash nếu click quá sớm → click lại tới khi hash giữ được.
  await expect(async () => {
    await page.getByRole("navigation", { name: "Mục lục" }).getByRole("link", { name: "Hỏi đáp" }).click();
    await expect(page).toHaveURL(/#hoi-dap$/, { timeout: 1_000 });
  }).toPass();
  await expect(page.locator("#hoi-dap")).toBeVisible();
  await page.goto(`${origin("t12")}/san-pham/${productSlug}`);
  await expect(page.locator("main")).toContainText("Demo t12");
  await expect(page.locator('[data-widget="quote-cart"]')).toHaveCount(0);
  await expect(page.locator('[data-section-type="products"]')).toHaveCount(0);
});

test("JS disabled and reduced motion preserve SSR content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  // SSR text is the subject here: waiting for `load` also waits on `next dev` image optimisation, which can hang
  // on CI (run 39011394788 trace: document 200 in 0.7 s, one /_next/image request never finished).
  const open = async (url: string) => expect((await page.goto(url, { waitUntil: "domcontentloaded" }))?.status()).toBe(200);
  for (const id of ["t15", "t12"]) {
    await open(origin(id));
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("main")).toContainText(`Demo ${id}`);
    await open(`${origin(id)}/san-pham`);
    await expect(page.locator("main article").first()).toBeVisible();
    for (const path of [`/san-pham/${productSlug}`, `/tin-tuc/${postSlug}`, `/cong-trinh/${projectSlug}`, "/giai-phap/solar-gia-dinh", "/cam-nang", "/ve-chung-toi", "/lien-he"]) {
      await open(origin(id) + path);
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
      // networkidle after reload never settles on CI (README: flaky list); wait for load, then for hydration below.
      if (reload) await page.reload({ waitUntil: "load" });
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
        const quick = page.getByRole("dialog");
        // The button only reacts once hydrated: retry the click until the dialog opens.
        await expect(async () => {
          await card.getByRole("button", { name: /Quick view/ }).click();
          await expect(quick).toBeVisible({ timeout: 2_000 });
        }).toPass({ timeout: 30_000 });
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
          await page.locator(`main:visible a[href="${path}"]`).first().click();
          await expect(page).toHaveURL(url + path);
        } else expect((await page.goto(url + path))?.status()).toBe(200);
        // Cache Components keeps the previous page mounted in a hidden React Activity.
        await expect(page.locator("main:visible h1")).toHaveText(title);
        for (const selector of ['title', 'meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]']) {
          await expect(page.locator(selector)).toHaveCount(1);
        }
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
      const response = await page.goto(url + path, { waitUntil: "networkidle" });
      // A DB/SSR 500 has no title: surface its status immediately instead of timing out on metadata (E5-S06 r1).
      expect(response?.status(), path).toBe(200);
      await expect(page).toHaveTitle(new RegExp(title));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "English description");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url + path);
    }
    await page.goto(url + "/tin-tuc/review-post", { waitUntil: "networkidle" });
    await expect(page.locator("main:visible h1")).toHaveText("English post");
    await expect(page.locator("main:visible")).toContainText("English post body");
    await expect(page.getByRole("link", { name: "Estimate costs" })).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "English excerpt");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", url + "/images/illustrations/home-solar.webp");
    // A click before hydration is a no-op (README flaky list); retry until the locale reload lands.
    await expect(async () => {
      await page.getByRole("button", { name: "vi", exact: true }).click();
      await expect(page.locator("main:visible h1")).toHaveText("Bài viết VI", { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Mô tả VI");
    await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
    await page.reload();
    await expect(page.locator("main:visible h1")).toHaveText("Bài viết VI");
    await page.locator('header a[href="/"]').click();
    await expect(page).toHaveURL(url + "/");
    await expect(page.locator("main:visible")).toContainText("Tiêu đề VI");
    for (const selector of ['title', 'link[rel="canonical"]', 'meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:locale"]', 'meta[property="og:url"]']) {
      await expect(page.locator(selector)).toHaveCount(1);
    }
    await expect(page).toHaveTitle("Trang chủ VI | [DỮ LIỆU MẪU] Công ty điện mặt trời với tên rất dài để kiểm tra menu");
    // Home canonical/og:url is the bare origin, as in the A/B/A/B test above.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "vi_VN");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", url);
    await expect(async () => {
      await page.getByRole("button", { name: "en", exact: true }).click();
      await expect(page.locator("main:visible")).toContainText("English hero", { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
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
    await page.locator('main [name="consent"]').check();
    // E11-S01: tenant leads are stored; forms filled faster than 3 s are silently ignored, so wait like a person.
    await page.waitForTimeout(3_100);
    const response = page.waitForResponse((response) => response.url().endsWith("/api/lead"));
    await page.getByRole("button", { name: "Get a detailed quote" }).click();
    const lead = await response;
    expect(lead.status()).toBe(200);
    expect((await lead.json()).id).toEqual(expect.any(String));
    await expect(page.locator("main").getByRole("status")).toBeVisible();
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

test("robots, sitemap and rich-result JSON-LD stay on each tenant's own host", async ({ page, request }) => {
  for (const id of ["t15", "t12"]) {
    const other = origin(id === "t15" ? "t12" : "t15");
    // Node's API client does not use Chromium's *.localhost resolver rules on Windows.
    const get = (path: string, maxRedirects?: number) => request.get(`http://localhost:3211${path}`, { headers: { Host: `${id}.localhost:3211` }, maxRedirects });
    const robots = await get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain(`Sitemap: ${origin(id)}/sitemap.xml`);
    const sitemap = await get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs).toContain(`${origin(id)}/`);
    expect(locs).toContain(`${origin(id)}/san-pham/${productSlug}`);
    expect(locs.every((loc) => loc.startsWith(`${origin(id)}/`))).toBe(true);
    expect(locs.some((loc) => loc.startsWith(other))).toBe(false);
    await page.goto(`${origin(id)}/san-pham/${productSlug}`);
    const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((value) => JSON.parse(value));
    expect(jsonLd.find((value) => value["@type"] === "Product")).toMatchObject({ name: expect.any(String), url: `${origin(id)}/san-pham/${productSlug}` });
    expect(jsonLd.find((value) => value["@type"] === "BreadcrumbList")?.itemListElement).toHaveLength(3);
    await page.goto(`${origin(id)}/cam-nang`);
    const faq = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((value) => JSON.parse(value)).find((value) => value["@type"] === "FAQPage");
    expect(faq?.mainEntity?.length).toBeGreaterThan(0);
    const about = await get("/about-us", 0);
    expect(about.status()).toBe(308);
    expect(about.headers().location).toMatch(/\/ve-chung-toi$/);
    const legacy = await get(`/product/${productSlug}`, 0);
    expect(legacy.status()).toBe(308);
    expect(legacy.headers().location).toContain(`/san-pham/${productSlug}`);
  }
});
test("spoofed headers cannot select B; tenant lead API stores real leads and ignores bots (E11-S01)", async ({ request }) => {
  const response = await request.get("http://localhost:3211/", { headers: { Host: "t15.localhost", "x-tenant-id": "B", "x-site-id": "B", "X-Forwarded-Host": "t12.localhost" } });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Demo t15");
  expect(html).not.toContain("Demo t12");
  // Honeypot or a missing/too-fast fill time: silent success, nothing stored (no id).
  for (const data of [{ website: "bot", name: "A", phone: "0901234500", elapsedMs: 5_000 }, { name: "A", phone: "0901234500" }, { name: "A", phone: "0901234500", elapsedMs: 200 }]) {
    const lead = await request.post("http://localhost:3211/api/lead", { headers: { Host: "t15.localhost" }, data });
    expect(lead.status()).toBe(200);
    expect(await lead.json()).toEqual({ ok: true });
  }
  // Spoofed tenant headers are replaced by the proxy; the lead is stored for the host's tenant.
  const stored = await request.post("http://localhost:3211/api/lead", {
    headers: { Host: "t15.localhost", "x-tenant-id": "B", "x-site-id": "B" },
    data: { name: "[DỮ LIỆU MẪU] E2E", phone: "0901234501", consent: true, source: "contact", elapsedMs: 5_000 },
  });
  expect(stored.status()).toBe(200);
  expect((await stored.json()).id).toEqual(expect.any(String));
});
