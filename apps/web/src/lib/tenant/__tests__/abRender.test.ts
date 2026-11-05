import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { sectionRegistry } from "@solar/sections";
import type { AbTest } from "@solar/db";
import { AbTestContent } from "../../../components/tenant/AbTestContent";

const ab: AbTest = { id: "e8000000-0000-4000-8000-000000000003", status: "running", title: { lead: { vi: "COPY-B-ONLY" }, highlight: { vi: "" }, sub: { vi: "" }, subHighlight: { vi: "" } }, ctaLabel: { vi: "CTA-B-ONLY" } };
test("A/B render cả hai, id DOM không trùng, thắng B render server; hero tắt/không hero chỉ A", async t => {
  const globals = globalThis as typeof globalThis & { React?: typeof React };
  const previous = globals.React; globals.React = React;
  t.after(() => { globals.React = previous; });
  const a = sectionRegistry.types.hero.defaults;
  const hero = { id: "hero", anchor: "hero-anchor", type: "hero", variant: "t15", enabled: true, data: { ...a, title: { ...a.title, lead: { vi: "COPY-A-ONLY" } } } };
  const render = async (test: AbTest | null, sections = [hero]) => renderToStaticMarkup(React.createElement(React.Fragment, null, await AbTestContent({ abTest: test, page: { sections }, site: { tenantId: "test", themeId: "t15", locale: "vi" } })));
  const html = await render(ab);
  assert.match(html, /data-ab-variant="A"/); assert.match(html, /data-ab-variant="B"/);
  assert.match(html, /COPY-A-ONLY/); assert.match(html, /COPY-B-ONLY/); assert.match(html, /CTA-B-ONLY/);
  assert.match(html, /html:not\(\[data-ab="B"\]\) \[data-ab-variant="B"\]/);
  assert.match(html, /<script>/); assert.match(html, /data-section-id="hero-b"/);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length); assert.equal(ids.filter(id => id === "hero-anchor").length, 1);
  for (const winner of ["A", "B"] as const) {
    const ended = await render({ ...ab, status: "ended", winner });
    assert.match(ended, new RegExp(`COPY-${winner}-ONLY`));
    assert.doesNotMatch(ended, new RegExp(`COPY-${winner === "A" ? "B" : "A"}-ONLY`));
    assert.doesNotMatch(ended, /data-ab-variant|sendBeacon/);
  }
  assert.doesNotMatch(await render(ab, []), /data-ab-variant|sendBeacon/);
  assert.doesNotMatch(await render(ab, [{ ...hero, enabled: false }]), /data-ab-variant|sendBeacon/);
  assert.doesNotMatch(await render(null), /data-ab-variant|sendBeacon|COPY-B-ONLY/);
});
test("cached.tsx giữ ISR; không đọc cookies/headers", () => {
  const source = readFileSync(new URL("../../../components/tenant/cached.tsx", import.meta.url), "utf8");
  assert.match(source, /"use cache"/); assert.doesNotMatch(source, /\b(cookies|headers)\s*\(/);
});
