/* Read-only UI QA. Needs Playwright, axe and Chrome supplied outside production dependencies.
   QA_NODE_MODULES=/path/to/node_modules QA_CHROMIUM_PATH=/path/to/chromium node scripts/check-template-11.cjs */
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  { spawn, execFileSync } = require("node:child_process"),
  vm = require("node:vm");
const ts = require("typescript"),
  sharp = require("sharp");
const resolve = (name) =>
  require.resolve(name, {
    paths: [process.env.QA_NODE_MODULES || process.cwd()],
  });
const { chromium } = require(resolve("playwright-core")),
  AxeBuilder = require(resolve("@axe-core/playwright")).default;
const chrome = process.env.QA_CHROMIUM_PATH;
if (!chrome) throw new Error("Set QA_CHROMIUM_PATH");
function load(file) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    { module, exports: module.exports, require, Intl },
  );
  return module.exports;
}
const d = load("src/content/solar/data.ts"),
  calc = load("src/lib/solar-calc.ts"),
  a = d.assumptions,
  output = "docs/qa-template-11";
fs.mkdirSync(output, { recursive: true });
const base = "http://127.0.0.1:3112",
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3112",
    ],
    { stdio: "ignore" },
  );
(async () => {
  let browser;
  const report = { viewports: [], flows: [], integrity: [] };
  try {
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(base)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    browser = await chromium.launch({
      executablePath: chrome,
      headless: true,
      args: [
        "--no-sandbox",
        "--no-zygote",
        "--disable-dev-shm-usage",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    });
    const context = await browser.newContext({ reducedMotion: "reduce" }),
      page = await context.newPage(),
      errors = [],
      api = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (r.url().includes("/api/"))
        api.push({ url: r.url(), method: r.method() });
    });
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.equal(dimensions.scroll, width);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        scan.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      report.viewports.push({ width, overflow: false, axeViolations: 0 });
      await sharp(await page.screenshot({ fullPage: true }))
        .webp({ quality: 78 })
        .toFile(`${output}/home-${width}.webp`);
    }
    const expectedSchema = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      )
        .map((s) => JSON.parse(s.textContent))
        .find((s) => s["@type"] === "FAQPage"),
    );
    assert.equal(expectedSchema.mainEntity.length, d.copy.faq.length);
    assert.ok(
      (await page.title()).includes(
        calc.money(Math.min(...d.pricing.map((p) => p.price))),
      ),
    );
    assert.equal(
      await page.locator('meta[name="theme-color"]').getAttribute("content"),
      "#15803D",
    );
    assert.equal(
      await page.locator("svg.solar-shell-logo text").first().textContent(),
      d.brand.name,
    );
    const pkg = d.pricing.find(
      (p) =>
        a.defaultBill >= p.minBill &&
        (p.maxBill === null || a.defaultBill < p.maxBill) &&
        p.type === "hoa-luoi",
    );
    const alt = d.pvout.find(
      (p) => p.pvout !== d.pvout.find((p) => p.id === a.defaultProvince).pvout,
    );
    await page.locator("#province").selectOption(alt.id);
    let estimated = calc.estimate(pkg, alt, a);
    assert.ok(
      (await page.locator(`[data-package="${pkg.id}"]`).textContent()).includes(
        calc.money(estimated.monthlySaving),
      ),
    );
    await page.locator("#bill-unit").selectOption("kwh");
    await page.locator("#full-bill").fill("1000");
    assert.equal(
      await page.locator("#hero-bill").inputValue(),
      String(1000 * a.electricityPrice),
    );
    await page.locator("#bill-unit").selectOption("money");
    await page.locator("#full-bill").fill(String(a.defaultBill));
    const hybrid = d.pricing.find(
      (p) =>
        a.defaultBill >= p.minBill &&
        (p.maxBill === null || a.defaultBill < p.maxBill) &&
        p.type === "hybrid",
    );
    await page
      .locator(`[data-package="${hybrid.id}"]`)
      .getByRole("button", { name: "Chọn gói", exact: true })
      .click();
    await page.locator("#months").focus();
    await page.locator("#months").press("End");
    assert.equal(
      await page.locator("#months").inputValue(),
      String(a.installment.maxMonths),
    );
    const hybridResult = calc.estimate(hybrid, alt, a),
      loan = calc.installment(
        hybrid.price,
        a.installment.maxMonths,
        hybridResult.monthlySaving,
        a.installment.interestPerMonth,
      );
    assert.ok(
      (await page.locator(".solar-installment").textContent()).includes(
        calc.money(Math.abs(loan.extra)),
      ),
    );
    for (const card of await page.locator(".solar-package").all())
      await card.locator("details.solar-package-details > summary").click();
    assert.equal(await page.locator(".solar-package .solar-chart").count(), 4);
    const openScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      openScan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    await page
      .getByRole("tab", { name: d.segments[0].label, exact: true })
      .focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page
        .getByRole("tab", { name: d.segments[1].label, exact: true })
        .getAttribute("aria-selected"),
      "true",
    );
    await page
      .locator(".solar-project-filters")
      .getByRole("button", { name: d.segments[2].label, exact: true })
      .click();
    assert.equal(
      await page.locator(".solar-project").count(),
      d.projects.filter((p) => p.segment === "home").length,
    );
    assert.equal(
      await page.locator(".solar-license").count(),
      d.brand.licenses.filter(
        (l) => l.lookupUrl && /^https?:\/\//.test(l.lookupUrl),
      ).length,
    );
    assert.equal(await page.locator(".solar-dev-note").count(), 0);
    assert.equal(await page.locator("video").count(), 0);
    await page.locator("#full-bill").fill("0");
    assert.equal(await page.locator(".solar-package").count(), 0);
    await page.locator("#full-bill").fill("-1");
    assert.equal(await page.locator(".solar-package").count(), 0);
    await page.reload();
    assert.equal(
      await page.locator("#hero-bill").inputValue(),
      String(a.defaultBill),
    );
    assert.equal(
      await page.locator("#province").inputValue(),
      a.defaultProvince,
    );
    assert.equal(api.length, 0);
    report.flows.push(
      "province formulas, money/kWh, selected package, 24-month installment, four per-package charts, keyboard tabs, project filtering, legal hiding, invalid input, client state reset, no new API calls",
    );
    await page
      .getByRole("button", { name: "Bật nền tối", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector(".solar-home")).color ===
        "rgb(243, 251, 241)",
      {},
      { timeout: 3000 },
    );
    const darkScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      darkScan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    await sharp(await page.screenshot({ fullPage: false }))
      .webp({ quality: 80 })
      .toFile(`${output}/home-dark-1280.webp`);
    await page
      .getByRole("button", { name: "Bật nền sáng", exact: true })
      .click();
    report.flows.push("dark mode WCAG AA: zero axe violations");
    let posted;
    await page.route("**/api/lead", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"ok":true,"mode":"demo"}',
      });
    });
    const fields = {
      name: "Kiểm tra UI",
      phone: "0708699808",
      email: "qa@example.test",
      company: "Công trình mẫu",
      message: "Dữ liệu kiểm tra giả lập",
    };
    for (const [name, value] of Object.entries(fields))
      await page.locator(`.solar-contact-form [name="${name}"]`).fill(value);
    await page
      .locator(".solar-contact-form")
      .getByRole("button", { name: "Nhận tư vấn & báo giá", exact: true })
      .click();
    await page
      .getByText("Đã nhận thông tin của bạn.", { exact: true })
      .waitFor();
    assert.deepEqual(posted, { ...fields, source: "home-bottom" });
    report.flows.push(
      "existing contact form POST intercepted: exact fields and home-bottom source preserved; no submission sent",
    );
    await page.goto(base + "/product");
    await page
      .getByRole("button", { name: "Thêm RFQ", exact: true })
      .first()
      .click();
    await page.getByRole("dialog").waitFor();
    assert.ok(
      (
        await page
          .getByRole("dialog")
          .getByRole("link", { name: "Tiếp tục gửi yêu cầu" })
          .getAttribute("href")
      ).startsWith("/contact-us?rfq="),
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    report.flows.push("existing RFQ and contact-us?rfq= path preserved");
    for (const route of ["/about-us", "/service", "/contact-us", "/news"]) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200);
    }
    assert.deepEqual(errors, []);
    report.flows.push(
      "existing static frontend routes return 200, zero page errors",
    );
    const changed = execFileSync("git", ["diff", "template-8", "--name-only"], {
      encoding: "utf8",
    })
      .trim()
      .split("\n");
    const forbidden = changed.filter((f) =>
      /^src\/app\/api\/|(^|\/)(\.env|schema|migration|middleware|prisma)|^next.config|^Dockerfile|^docker-compose|^\.github\//.test(
        f,
      ),
    );
    assert.deepEqual(forbidden, []);
    for (const file of [
      "src/components/LeadForm.tsx",
      "src/app/api/lead/route.ts",
      "next.config.ts",
      ".env.example",
    ])
      assert.equal(
        fs.readFileSync(file, "utf8"),
        execFileSync("git", ["show", `template-8:${file}`], {
          encoding: "utf8",
        }),
      );
    const roi = fs.readFileSync("src/components/RoiCalculator.tsx", "utf8"),
      oldRoi = execFileSync(
        "git",
        ["show", "template-8:src/components/RoiCalculator.tsx"],
        { encoding: "utf8" },
      );
    const fetches = (s) => {
      const sf = ts.createSourceFile(
          "file.tsx",
          s,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        ),
        calls = [];
      function walk(n) {
        if (ts.isCallExpression(n) && n.expression.getText(sf) === "fetch")
          calls.push(n.getText(sf));
        ts.forEachChild(n, walk);
      }
      walk(sf);
      return calls;
    };
    assert.deepEqual(fetches(roi), fetches(oldRoi));
    for (const file of fs
      .readdirSync("src/components/solar")
      .filter((f) => f.endsWith(".tsx")))
      assert.deepEqual(
        fetches(fs.readFileSync("src/components/solar/" + file, "utf8")),
        [],
      );
    const ico = fs.readFileSync("public/favicon.ico");
    assert.equal(ico.readUInt16LE(4), 3);
    assert.deepEqual([ico[6], ico[22], ico[38]], [16, 32, 48]);
    for (const [file, size] of [
      ["favicon-32.png", 32],
      ["apple-touch-icon.png", 180],
      ["icon-192.png", 192],
      ["icon-512.png", 512],
    ]) {
      const meta = await sharp("public/" + file).metadata();
      assert.equal(meta.width, size);
      assert.equal(meta.height, size);
    }
    const manifest = JSON.parse(fs.readFileSync("public/site.webmanifest"));
    assert.equal(manifest.theme_color, "#15803D");
    assert.equal(manifest.name, d.brand.name);
    report.integrity.push(
      "backend/API/env/server configuration hashes unchanged, LeadForm file byte-identical, old calculator fetch expressions byte-identical, no new component fetch calls, favicon dimensions and ICO frames correct",
    );
    fs.writeFileSync(
      output + "/browser-results.json",
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  server.kill();
  process.exitCode = 1;
});
