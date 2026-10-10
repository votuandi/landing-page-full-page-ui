import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveCalculatorAction, withSegmentParam } from "../state/logic";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SegmentsT15 from "../segments/t15";
import { segments } from "../segments/schema";
import { SiteStateProvider, useSegment } from "../state/SiteState";

test("segment query adds, replaces and removes the filter while preserving other parameters", () => {
  assert.equal(withSegmentParam("", "farm"), "?phan-khuc=farm");
  assert.equal(withSegmentParam("?lang=en&phan-khuc=household&hoa-don=100", "farm"), "?lang=en&phan-khuc=farm&hoa-don=100");
  assert.equal(withSegmentParam("?lang=en&phan-khuc=farm", null), "?lang=en");
  assert.equal(withSegmentParam("?phan-khuc=farm", null), "");
});

test("segment cards retain server-rendered hrefs with and without a provider", () => {
  const cards = createElement(SegmentsT15, {
    data: segments.defaults, sectionId: "segments", site: { tenantId: "state-test", locale: "vi", themeId: "t15" },
  });
  for (const tree of [cards, <SiteStateProvider key="provider">{cards}</SiteStateProvider>]) {
    assert.match(renderToStaticMarkup(tree), /href="\?phan-khuc=trang-trai#video-cong-trinh"/);
  }
  function DefaultSegment() { return String(useSegment().segment); }
  assert.equal(renderToStaticMarkup(createElement(DefaultSegment)), "null");
});

test("calculator on page always uses the bus; absent calculator navigates with prefill or opens consult", () => {
  const prefill = { segment: "farm", bill: 100, topic: "Trại nhỏ", source: "story-cta" } as const;
  assert.deepEqual(resolveCalculatorAction(true, null, prefill), { kind: "bus" });
  assert.deepEqual(resolveCalculatorAction(false, undefined, prefill), {
    kind: "navigate", href: "/?phan-khuc=farm&hoa-don=100&nhu-cau=Tr%E1%BA%A1i+nh%E1%BB%8F&nguon=story-cta#du-toan",
  });
  assert.deepEqual(resolveCalculatorAction(false, "/bang-gia", { segment: "farm" }), { kind: "navigate", href: "/bang-gia?phan-khuc=farm#du-toan" });
  assert.deepEqual(resolveCalculatorAction(false, undefined, {}), { kind: "navigate", href: "/#du-toan" });
  for (const href of [null, "//evil.com", "https://evil.com", "/\\evil.com", "/\nevil.com"]) {
    assert.deepEqual(resolveCalculatorAction(false, href, {}), { kind: "consult" });
  }
});
