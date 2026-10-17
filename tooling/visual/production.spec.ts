import { expect, test, type APIRequestContext } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { resolve } from "node:path";

type Site = { tenantId: string; siteId: string; host: string };
let sites: Site[];
const fixture = (action: string) => execFileSync(process.execPath, ["--import", "tsx", "scripts/production-browser-fixture.ts", action], {
  cwd: resolve(__dirname, "../../apps/web"), encoding: "utf8", timeout: 60_000,
}).trim();
const origin = (site: Site) => `http://${site.host}:3210`;
async function html(request: APIRequestContext, site: Site, path = "/", cookie = "") {
  const response = await request.get(`http://localhost:3210${path}`, { headers: { Host: site.host, Cookie: cookie, "User-Agent": "solar-production-test" } });
  return { status: response.status(), body: await response.text(), headers: response.headers() };
}
async function invalidate(request: APIRequestContext, tags: string[], hosts?: string[]) {
  const body = JSON.stringify({ tags, hosts, nonce: randomUUID(), ts: Date.now() });
  const signature = createHmac("sha256", process.env.REVALIDATE_SECRET!).update(body).digest("hex");
  const response = await request.post("http://localhost:3210/api/revalidate", { headers: { "Content-Type": "application/json", "x-signature": signature }, data: body });
  expect(response.status(), await response.text()).toBe(200);
}
const title = (body: string) => body.match(/<title>([\s\S]*?)<\/title>/)?.[1];
const main = (body: string) => body.match(/<main[ >][\s\S]*?<\/main>/)?.[0] ?? "";
const chrome = (body: string) => [...body.matchAll(/<(header|footer)[ >][\s\S]*?<\/\1>/g)].map(value => value[0]).join("");

test.describe.serial("production Cache Components on PostgreSQL", () => {
  test.beforeAll(async ({ request }) => {
    sites = JSON.parse(fixture("setup"));
    await invalidate(request, sites.map(site => `tenant:${site.tenantId}`), sites.flatMap(site => [site.host, site.host.replace(".solar.", ".preview.solar.")]));
  });
  test.afterAll(async ({ request }) => {
    if (!sites) return;
    fixture("cleanup");
    await invalidate(request, ["platform:entitlements", ...sites.map(site => `tenant:${site.tenantId}`)]);
  });

  test("real signed page/collection/site/platform tags refresh UI, metadata and negative entries; B stays unchanged", async ({ request }) => {
    const [a, b] = sites;
    const bBefore = await html(request, b);
    const bPost = await html(request, b, "/tin-tuc/shared");
    expect(main(bBefore.body)).toContain("B body 0");
    const before = await html(request, a);
    expect(main(before.body)).toContain("A body 0");
    expect(chrome(before.body)).toContain("A chrome 0");
    expect(title(before.body)).toContain("A trang chủ");
    fixture("publish");
    expect(main((await html(request, a)).body)).toContain("A body 0");
    await invalidate(request, [`tenant:${a.tenantId}:page:`]);
    const published = await html(request, a);
    expect(published.status).toBe(200);
    expect(main(published.body)).toContain("A body 1");
    expect(chrome(published.body)).toContain("A chrome 1");
    expect(title(published.body)).toContain("A published title");

    expect((await html(request, a, "/tin-tuc/was-missing")).status).toBe(404);
    expect(title((await html(request, a, "/tin-tuc/shared")).body)).toContain("A post 0");
    fixture("collection");
    expect((await html(request, a, "/tin-tuc/was-missing")).status).toBe(404);
    await invalidate(request, [`tenant:${a.tenantId}:collection:post`]);
    const post = await html(request, a, "/tin-tuc/shared");
    expect(main(post.body)).toContain("A article 1");
    expect(title(post.body)).toContain("A post 1");
    expect(post.body).toContain('name="description" content="A excerpt 1"');
    const added = await html(request, a, "/tin-tuc/was-missing");
    expect(added.status).toBe(200);
    expect(main(added.body)).toContain("A newly published");

    await html(request, a, "/lien-he");
    fixture("site");
    await invalidate(request, [`tenant:${a.tenantId}:site`]);
    const contact = await html(request, a, "/lien-he");
    expect(title(contact.body)).toContain("A updated VI");
    expect(contact.body).toContain("A updated description");
    expect((await html(request, a)).body).toContain('"name":"[DỮ LIỆU MẪU] A updated VI"');
    expect((await html(request, a, "/tin-tuc/shared")).status).toBe(404);
    fixture("restore-news");
    await invalidate(request, [`tenant:${a.tenantId}:site`]);
    expect((await html(request, a, "/tin-tuc/shared")).status).toBe(200);

    const bAfter = await html(request, b);
    expect(main(bAfter.body)).toBe(main(bBefore.body));
    expect(chrome(bAfter.body)).toBe(chrome(bBefore.body));
    expect(title(bAfter.body)).toBe(title(bBefore.body));
    expect(main((await html(request, b, "/tin-tuc/shared")).body)).toBe(main(bPost.body));
    expect(bAfter.body).toContain('data-section-type="calculator"');
    fixture("disable");
    await invalidate(request, ["platform:entitlements"]);
    for (const site of sites) {
      const disabled = await html(request, site);
      expect(disabled.body).not.toContain('data-section-type="calculator"');
      expect((await html(request, site, "/tin-tuc/shared")).body).not.toContain(">Dự toán chi phí</a>");
    }
  });

  test("production preview bypasses every UI scope on each reload without revalidate", async ({ request }) => {
    const a = sites[0];
    const publicBefore = await html(request, a);
    expect((await html(request, a, "/uu-dai/preview-only")).status).toBe(404);
    const preview = { ...a, host: a.host.replace(".solar.", ".preview.solar.") };
    const token = fixture("token");
    const entry = await request.get(`http://localhost:3210/api/preview?token=${token}`, { headers: { Host: preview.host }, maxRedirects: 0 });
    expect(entry.status()).toBe(307);
    const cookie = entry.headersArray().filter(header => header.name.toLowerCase() === "set-cookie").map(header => header.value.split(";")[0]).join("; ");
    expect(cookie).toContain("__Host-preview=");
    expect(cookie).toContain("__prerender_bypass=");
    for (const version of ["1", "2", "3"]) {
      fixture(`draft-${version}`);
      const draft = await html(request, preview, "/", cookie);
      expect(draft.status).toBe(200);
      expect(draft.headers["cache-control"]).toContain("private");
      expect(draft.headers["cache-control"]).toContain("no-store");
      expect(draft.headers["x-robots-tag"]).toBe("noindex");
      expect(main(draft.body)).toContain(`A draft body ${version}`);
      expect(chrome(draft.body)).toContain(`A draft chrome ${version}`);
      expect(title(draft.body)).toContain("A published title");
      const metadata = await html(request, preview, "/uu-dai/preview-only", cookie);
      expect(metadata.status).toBe(200);
      expect(title(metadata.body)).toContain(`Draft title ${version}`);
      expect((await html(request, a, "/uu-dai/preview-only", cookie)).status).toBe(404);
      const publicAgain = await html(request, a, "/", cookie);
      expect(main(publicAgain.body)).toBe(main(publicBefore.body));
      expect(chrome(publicAgain.body)).toBe(chrome(publicBefore.body));
      expect(publicAgain.body).not.toContain("A draft body");
    }
  });

  test("VI/EN same slug, metadata, html lang and chrome stay synchronized across repeated reloads and navigation", async ({ page }, info) => {
    const a = sites[0];
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    for (let round = 0; round < 4; round++) for (const locale of ["en", "vi"] as const) {
      await page.context().addCookies([{ name: "solar-locale", value: locale, url: origin(a) }]);
      await page.goto(`${origin(a)}/ve-chung-toi`, { waitUntil: "networkidle" });
      await expect(page).toHaveTitle(`A ve-chung-toi ${locale.toUpperCase()} | [DỮ LIỆU MẪU] A updated ${locale.toUpperCase()}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("main:visible h1")).toHaveText(`A ve-chung-toi ${locale.toUpperCase()}`);
      await expect(page.locator("title")).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", locale === "en" ? "A updated description EN" : "A updated description");
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", locale === "en" ? "en_US" : "vi_VN");
      await expect(page.locator("header")).toContainText("A chrome 1");
      await page.locator('header a[href="/"]').first().click();
      await expect(page.locator("main:visible")).toContainText(locale === "en" ? "A body EN" : "A body 1");
      await expect(page.locator("title")).toHaveCount(1);
      await page.reload();
      await expect(page).toHaveTitle(new RegExp(locale === "en" ? "A home" : "A published title"));
    }
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath("locale.png"), fullPage: true });
  });

  test("both MULTI_TENANT modes reject full internal paths, encodings, forged headers and public draft contexts", async ({ request }) => {
    const [a, b] = sites;
    expect(fixture("second-site")).toContain("unique tenant/site enforced");
    for (const port of [3210, 3213]) {
      for (const pair of [[a.tenantId, a.siteId], [a.tenantId, b.siteId]]) for (const ctx of ["vi", "en", "draft.vi", "draft.en"]) {
        const path = `/sites/${pair[0]}/${pair[1]}/${ctx}/ve-chung-toi`;
        for (const encoded of [path, path.replace("sites", "%73ites"), path.replaceAll("/", "%2F")]) {
          const response = await request.get(`http://localhost:${port}/${encoded.replace(/^\//, "")}`, { headers: { Host: a.host, "x-tenant-id": b.tenantId, "x-site-id": b.siteId, "x-preview": "1" } });
          expect(response.status(), encoded).toBe(404);
        }
      }
      const forged = await request.get(`http://localhost:${port}/`, { headers: { Host: a.host, "x-tenant-id": b.tenantId, "x-site-id": b.siteId, "x-preview": "1" } });
      expect(forged.status()).toBe(200);
      const body = await forged.text();
      if (port === 3210) { expect(main(body)).toContain("A body 1"); expect(body).not.toContain("B chrome"); }
      else expect(body).not.toContain('data-tenant-site=');
      expect((await request.get(`http://localhost:${port}/draft.vi/ve-chung-toi`, { headers: { Host: a.host } })).status()).toBe(404);
    }
  });

  for (const failure of ["delayed", "failed"] as const) test(`normal-motion SSR reveal remains visible with ${failure} hydration`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    let release!: () => void;
    const barrier = new Promise<void>(done => { release = done; });
    await page.route("**/_next/static/**/*.js", async route => {
      if (failure === "failed") await route.abort();
      else { await barrier; await route.continue(); }
    });
    await page.goto(origin(sites[1]), { waitUntil: "commit" });
    const element = page.locator('[data-reveal], [data-reveal-stagger] > *').first();
    await expect(element).toBeAttached();
    await element.scrollIntoViewIfNeeded();
    await expect.poll(() => element.evaluate(el => ({ opacity: getComputedStyle(el).opacity, unmoved: ["none", "0px"].includes(getComputedStyle(el).translate), clear: /^(none|blur\(0px\))$/.test(getComputedStyle(el).filter) })), { timeout: 15_000 }).toEqual({ opacity: "1", unmoved: true, clear: true });
    if (failure === "delayed") {
      // Keep chunks late for 5.5 seconds, then hydrate the same visible SSR document.
      await new Promise(done => setTimeout(done, 5500));
      await expect(element).toBeVisible();
    }
    release();
    if (failure === "delayed") {
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "en", exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      expect(errors).toEqual([]);
    }
    expect(errors.filter(error => /hydrat|didn.t match|server rendered|Minified React error|react\.dev\/errors/i.test(error))).toEqual([]);
    await page.screenshot({ path: info.outputPath(`reveal-${failure}.png`), fullPage: true });
  });
});
