import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import { pageConfigSchema } from "../page";
import { sectionRegistry } from "../registry";
import { PageRenderer } from "../render/PageRenderer";
import { LAYOUT_CLASSES, resolveLayout, spacingClass, surfaceClass, wrapperLayout, type SectionLayout } from "../layout";

const site = { tenantId: "sample", locale: "vi" as const, themeId: "t15" };
async function render(layout?: object, type = "faq", variant = "t15", builder = true) {
  await sectionRegistry.getVariant(type, variant)!.load();
  await Loadable.preloadAll();
  return renderToStaticMarkup(await PageRenderer({ site, canUse: feature => feature !== "builder" || builder,
    page: pageConfigSchema.parse({ sections: [{ id: "s", type, variant, enabled: true, anchor: "bang-gia", data: sectionRegistry.getType(type)!.defaults, layout }] }) }));
}

test("layout sai enum / key lạ bị từ chối", () => {
  for (const layout of [{ background: "red" }, { spacing: "huge" }, { align: "end" }, { hideOn: "tablet" }, { color: "red" }]) {
    assert.equal(pageConfigSchema.safeParse({ sections: [{ id: "s", type: "faq", variant: "t15", data: {}, layout }] }).success, false);
  }
});
test("không có layout thì HTML không đổi", async () => {
  const html = await render();
  assert.match(html, /^<div id="bang-gia" data-section-id="s" data-section-type="faq"><section class="t15-section bg-bg"/);
  assert.equal(await render({ background: "default", spacing: "normal", align: "start" }), html);
});
test("nền tint/sky/sun thay class nền của variant", async () => {
  for (const background of ["tint", "sky", "sun"]) {
    const html = await render({ background });
    assert.match(html, new RegExp(`<section class="[^"]*bg-bg-${background}`));
    assert.doesNotMatch(html.match(/<section class="([^"]*)"/)![1], /\bbg-bg(?:\s|$)/);
  }
});
test("deep/invert chỉ gắn data-surface", async () => {
  for (const background of ["deep", "invert"]) {
    const html = await render({ background });
    assert.match(html, new RegExp(`data-surface="${background}"`));
    assert.match(html, /class="bg-bg text-fg"/);
    assert.doesNotMatch(html, /bg-bg-deep/);
  }
});
test("spacing", () => {
  assert.equal(spacingClass("compact", "py-16"), "py-10 md:py-14");
  assert.equal(spacingClass("loose", "py-16"), "py-24 md:py-32");
  assert.equal(spacingClass("normal", "t15-section"), "t15-section");
  assert.equal(surfaceClass("invert", "bg-bg-elevated"), "bg-bg-elevated");
});
test("đổi spacing giữ min-height t15; HTML mặc định faq/t02 không thêm wrapper", async () => {
  for (const variant of ["t15", "t05", "t10"]) for (const spacing of ["compact", "loose"]) {
    assert.match(await render({ spacing }, "faq", variant), /<section[^>]*class="[^"]*min-h-section/);
  }
  const html = await render(undefined, "faq", "t02");
  assert.doesNotMatch(html, /<div><p class="text-xs/);
});
test("align", async () => {
  assert.match(await render({ align: "center" }, "faq", "t02"), /text-center mx-auto/);
  assert.equal(await render({ align: "center" }), await render());
});
test("hideOn SSR không cần JS", async () => {
  for (const [hideOn, className] of [["mobile", "max-md:hidden"], ["desktop", "md:hidden"]]) {
    assert.match(await render({ hideOn }, "hero"), new RegExp(`class="${className}"`));
  }
});
test("tùy chọn không hỗ trợ bị bỏ qua; đổi về variant cũ giữ layout", async () => {
  const layout = { background: "tint", spacing: "compact", align: "center" } as const;
  assert.equal(await render(layout, "hero"), await render(undefined, "hero"));
  assert.match(await render(layout), /bg-bg-tint/);
  assert.deepEqual(layout, { background: "tint", spacing: "compact", align: "center" });
  assert.deepEqual(resolveLayout({ ...layout, hideOn: "mobile" }, []), { hideOn: "mobile" });
  assert.equal(resolveLayout(undefined, []), undefined);
  assert.deepEqual(wrapperLayout(undefined), {});
  assert.deepEqual(sectionRegistry.layoutOf("faq", "unknown"), sectionRegistry.layoutOf("faq", "t15"));
  assert.deepEqual(sectionRegistry.layoutOf("unknown", "t15"), []);
  assert.match(await render(layout, "services", "t02"), /bg-bg-tint/);
  assert.equal(await render(layout, "services", "t15"), await render(undefined, "services", "t15"));
  assert.match(await render(layout, "services", "t02"), /bg-bg-tint/);
});
test("không có builder thì bỏ qua", async () => {
  assert.equal(await render({ background: "deep", spacing: "loose", hideOn: "mobile" }, "faq", "t15", false), await render());
});

test("AC1 lint:tokens trên HTML render", async () => {
  // Native import preserves the ESM matcher while this test suite compiles to CJS.
  const { findHardcoded } = await (new Function("return import('@solar/eslint-plugin/matchers')")() as Promise<{ findHardcoded(text: string): unknown[] }>);
  const classes = (html: string) => new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap(m => m[1].split(/\s+/)));
  for (const type of Object.keys(sectionRegistry.types)) for (const variant of sectionRegistry.variantsOf(type) ?? []) {
    const caps = sectionRegistry.layoutOf(type, variant);
    if (!caps.length) continue;
    const baseline = await render(undefined, type, variant), before = classes(baseline);
    const layouts: SectionLayout[] = [
      ...(["default", "tint", "sky", "sun", "deep", "invert"] as const).map(background => ({ background })),
      ...(["compact", "normal", "loose"] as const).map(spacing => ({ spacing })),
      { align: "start" }, { align: "center" }, { hideOn: "mobile" }, { hideOn: "desktop" },
      { background: "invert", spacing: "loose", align: "center", hideOn: "mobile" },
    ];
    for (const layout of layouts) {
      const html = await render(layout, type, variant);
      const added = [...classes(html)].filter(c => !before.has(c));
      assert.deepEqual([...html.matchAll(/style="([^"]*)"/g)].map(m => m[1]), [...baseline.matchAll(/style="([^"]*)"/g)].map(m => m[1]), `${type}/${variant}: layout không thêm style`);
      assert.deepEqual(findHardcoded(added.join(" ")), [], `${type}/${variant}`);
      assert.ok(added.every(c => (LAYOUT_CLASSES as readonly string[]).includes(c)), `${type}/${variant}: ${added}`);
      assert.doesNotMatch(html, /bg-bg-deep/);
    }
  }
});
