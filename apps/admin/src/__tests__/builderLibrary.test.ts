import { mount, button, click, byPath, type as typeInput } from "../../../../packages/cms-ui/src/__tests__/dom.ts";
import { dom } from "../../../../packages/cms-ui/src/__tests__/domGlobals.ts";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import * as React from "react";
import { act, createElement } from "react";
import { sectionRegistry } from "@solar/sections";
import type { BuilderEditor, PageSectionResult } from "../lib/pageSections.ts";

Object.assign(globalThis, { React, Element: dom.window.Element,
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
});
// Mock only the server-action network boundary; render the real Builder, queue, panel and library.
const require = createRequire(import.meta.url);
let save: (form: FormData) => Promise<PageSectionResult> = async () => ({ ok: true, revision: 3 });
const actionsPath = require.resolve("../app/(admin)/trang/actions.ts");
require.cache[actionsPath] = { id: actionsPath, filename: actionsPath, loaded: true, exports: {
  saveSectionsDraft: (_: unknown, form: FormData) => save(form),
  saveSectionContent: (_: unknown, form: FormData) => save(form),
  builderPreviewLink: async () => ({ ok: false }),
} } as NodeJS.Module;
const Builder = (require("../app/(admin)/trang/[pageId]/builder/Builder.tsx") as typeof import("../app/(admin)/trang/[pageId]/builder/Builder.tsx")).default;

function editor(overrides: Partial<BuilderEditor> = {}): BuilderEditor {
  return { page: { id: "page", title: "Trang mẫu", revision: 2 },
    sections: [{ id: "hero", type: "hero", variant: "t15", enabled: true }],
    forms: { hero: { data: sectionRegistry.types.hero.defaults, recovered: false, readOnly: undefined } },
    canReorder: true, canEditContent: true, bilingual: false, previewUrl: "http://localhost/frame", themeId: "t15", themeSupportsDark: true,
    allowedTypes: Object.values(sectionRegistry.types).map(def => def.type), lockedTypes: [], ...overrides };
}
const ids = (container: HTMLElement) => [...container.querySelectorAll("li[data-section-id]")].map(el => el.getAttribute("data-section-id"));

test("bố cục dùng queue, hoàn nguyên select khi 400/409 và hiện lỗi", async () => {
  for (const status of [400, 409]) {
    const writes: FormData[] = [];
    save = async form => { writes.push(form); return { ok: false, status, error: `Không thể lưu ${status}` }; };
    const initial = editor({ sections: [{ id: "faq", type: "faq", variant: "t15", enabled: true }], forms: { faq: { data: sectionRegistry.types.faq.defaults, recovered: false, readOnly: undefined } } });
    const m = await mount(createElement(Builder, { editor: initial }));
    try {
      const background = (m.container.querySelector(`[id="${[...m.container.querySelectorAll("label")].find(l => l.textContent === "Nền")!.htmlFor}"]`) as HTMLSelectElement);
      await typeInput(background, "tint");
      assert.equal(writes.length, 1);
      assert.equal(writes[0].get("revision"), "2");
      assert.equal(JSON.parse(writes[0].get("sections") as string)[0].layout.background, "tint");
      assert.equal(background.value, "default");
      assert.match(m.container.querySelector('[role="alert"]')!.textContent!, new RegExp(String(status)));
      if (status === 409) assert.equal(background.closest("fieldset")!.disabled, true);
    } finally { m.unmount(); }
  }
});

test("inline đi qua cùng form: quá max chặn lưu, sửa đúng mới lưu nháp", async () => {
  const writes: FormData[] = []; save = async form => { writes.push(form); return { ok: true, revision: 2 + writes.length }; };
  const initial = editor();
  initial.sections.push({ id: "faq", type: "faq", variant: "t15", enabled: true });
  initial.forms.faq = { data: sectionRegistry.types.faq.defaults, recovered: false, readOnly: undefined };
  const m = await mount(createElement(Builder, { editor: initial }));
  try {
    const source = m.container.querySelector("iframe")!.contentWindow!, sent: { action: string; fields?: { path: (string | number)[] }[] }[] = [];
    source.postMessage = data => { sent.push(data); };
    const receive = async (data: unknown) => { await act(async () => { window.dispatchEvent(new dom.window.MessageEvent("message", { data, origin: "http://localhost", source })); }); };
    await receive({ type: "solar-preview", action: "ready" });
    assert.ok(sent.find(message => message.action === "fields")?.fields?.some(field => field.path.join(".") === "title.highlight"));
    const edit = { type: "solar-preview", action: "inline", sectionId: "hero", path: ["title", "highlight"], locale: "vi", text: "x".repeat(61) };
    await receive(edit);
    assert.equal(byPath(m.container, "title.highlight").value, edit.text);
    assert.match(m.container.textContent!, /Có lỗi cần sửa — chưa lưu/);
    await click(button(m.container, "Chọn Câu hỏi thường gặp"));
    assert.equal(writes.length, 0); assert.equal(button(m.container, "Chọn Banner chính").getAttribute("aria-pressed"), "true");
    await receive({ ...edit, sectionId: "faq", text: "Sai section" });
    assert.equal(byPath(m.container, "title.highlight").value, edit.text);
    await receive({ ...edit, text: "  Điện\n mặt trời  " });
    assert.equal(byPath(m.container, "title.highlight").value, "Điện mặt trời");
    await click(button(m.container, "Chọn Câu hỏi thường gặp"));
    assert.equal(writes.length, 1); assert.equal(writes[0].get("sectionId"), "hero");
    assert.equal(JSON.parse(String(writes[0].get("data"))).title.highlight.vi, "Điện mặt trời");
  } finally { m.unmount(); }
});

test("Builder gửi fields rỗng và bỏ inline khi không quyền, readOnly hoặc conflict", async () => {
  for (const gate of ["permission", "readOnly", "conflict"]) {
    const initial = editor({ canEditContent: gate !== "permission" });
    if (gate === "readOnly") initial.forms.hero.readOnly = "Nội dung chỉ đọc";
    let writes = 0; save = async () => { writes++; return { ok: false, status: 409, error: "Trang đã thay đổi" }; };
    const m = await mount(createElement(Builder, { editor: initial }));
    try {
      const source = m.container.querySelector("iframe")!.contentWindow!, sent: { action: string; fields?: unknown[] }[] = [];
      source.postMessage = data => { sent.push(data); };
      const receive = async (data: unknown) => { await act(async () => { window.dispatchEvent(new dom.window.MessageEvent("message", { data, origin: "http://localhost", source })); }); };
      await receive({ type: "solar-preview", action: "ready" });
      if (gate === "conflict") {
        await typeInput(byPath(m.container, "badge"), "Nháp");
        await click(button(m.container, "Thêm Câu hỏi thường gặp"));
        assert.equal(writes, 1);
      }
      assert.deepEqual(sent.filter(message => message.action === "fields").at(-1)?.fields, [], gate);
      const field = byPath(m.container, "title.highlight"), before = field.value;
      await receive({ type: "solar-preview", action: "inline", sectionId: "hero", path: ["title", "highlight"], locale: "vi", text: "Không được ghi" });
      assert.equal(field.value, before, gate);
      assert.equal(writes, gate === "conflict" ? 1 : 0, gate);
    } finally { m.unmount(); }
  }
});

test("mục khóa không kéo, không bấm được", async () => {
  let writes = 0; save = async () => { writes++; return { ok: true, revision: 3 }; };
  const m = await mount(createElement(Builder, { editor: editor({ lockedTypes: ["press"] }) }));
  try {
    const row = m.container.querySelector('li[data-library-type="press"]')!;
    assert.equal(row.getAttribute("data-library-status"), "locked");
    const add = button(row as HTMLElement, /^Thêm /);
    assert.equal(add.disabled, true); assert.equal(add.getAttribute("aria-disabled"), "true");
    assert.match(row.textContent!, /Khóa theo gói/); assert.match(row.textContent!, /Cần nâng cấp gói/);
    await click(add); assert.equal(writes, 0);
    assert.ok(add.getAttribute("aria-describedby")!.split(" ").some(id => document.getElementById(id)?.textContent?.includes("Cần nâng cấp gói")));
  } finally { m.unmount(); }
});

test("không có quyền cấu trúc thì chỉ xem", async () => {
  const m = await mount(createElement(Builder, { editor: editor({ canReorder: false }) }));
  try {
    const library = m.container.querySelector('aside[aria-label="Thư viện section"]')!;
    assert.equal(library.querySelectorAll("h3").length, 5);
    const buttons = [...library.querySelectorAll("button")];
    assert.ok(buttons.filter(button => button.getAttribute("aria-label")?.startsWith("Thêm ")).every(button => button.disabled));
    // Variants stay browsable without permission; only adding is blocked.
    assert.ok(buttons.filter(button => button.getAttribute("aria-label")?.startsWith("Kiểu của ")).every(button => !button.disabled));
    assert.match(library.textContent!, /Gói hoặc quyền hiện tại/);
  } finally { m.unmount(); }
});

test("hướng dẫn kéo thư viện cho trình đọc màn hình dùng tiếng Việt", async () => {
  const m = await mount(createElement(Builder, { editor: editor() }));
  try {
    assert.doesNotMatch(m.container.textContent!, /To pick up a draggable item/);
    assert.match(m.container.textContent!, /Bấm Thêm để chèn section/);
  } finally { m.unmount(); }
});

test("insert không mời bị bỏ qua", async () => {
  let writes = 0; save = async () => { writes++; return { ok: true, revision: 3 }; };
  const m = await mount(createElement(Builder, { editor: editor() }));
  try {
    const source = m.container.querySelector("iframe")!.contentWindow!;
    await act(async () => window.dispatchEvent(new dom.window.MessageEvent("message", {
      data: { type: "solar-preview", action: "insert", targetId: "hero", position: "before" }, origin: "http://localhost", source,
    })));
    assert.deepEqual(ids(m.container), ["hero"]); assert.equal(writes, 0);
  } finally { m.unmount(); }
});

test("kéo thư viện đổi tọa độ theo scale, chỉ nhận insert một lần sau drop; Esc hủy", async () => {
  const writes: FormData[] = []; save = async form => { writes.push(form); return { ok: true, revision: 2 + writes.length }; };
  const m = await mount(createElement(Builder, { editor: editor() }));
  try {
    const iframe = m.container.querySelector("iframe")!, source = iframe.contentWindow!, sent: { action: string; y?: number }[] = [];
    source.postMessage = data => { sent.push(data); };
    const receive = (data: unknown) => window.dispatchEvent(new dom.window.MessageEvent("message", { data, origin: "http://localhost", source }));
    receive({ type: "solar-preview", action: "ready" }); sent.length = 0;
    const rect = (left: number, top: number, width: number, height: number): DOMRect => ({ left, top, width, height, x: left, y: top, right: left + width, bottom: top + height, toJSON() {} });
    iframe.getBoundingClientRect = () => rect(400, 100, 720, 600);
    iframe.parentElement!.parentElement!.getBoundingClientRect = iframe.getBoundingClientRect;
    const add = button(m.container, "Thêm Dự toán chi phí"); add.getBoundingClientRect = () => rect(0, 200, 200, 140);
    const mouse = async (target: EventTarget, type: string, clientX: number, clientY: number) => {
      await act(async () => { target.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, button: 0, clientX, clientY })); });
    };
    const start = async () => {
      await mouse(add, "mousedown", 100, 250);
      await mouse(document, "mousemove", 110, 250);
      await mouse(document, "mousemove", 500, 300);
    };
    await start();
    assert.ok(iframe.classList.contains("pointer-events-none"));
    assert.deepEqual(sent.at(-1), { type: "solar-preview", action: "drag", y: 400 });
    await mouse(document, "mousemove", 150, 300);
    assert.equal(sent.at(-1)!.action, "drag-cancel");
    const cancellations = sent.filter(message => message.action === "drag-cancel").length;
    await mouse(document, "mousemove", 160, 300);
    assert.equal(sent.filter(message => message.action === "drag-cancel").length, cancellations);
    await mouse(document, "mouseup", 160, 300);
    const insert = { type: "solar-preview", action: "insert", targetId: "hero", position: "before" };
    await act(async () => { receive(insert); }); assert.equal(writes.length, 0);
    await start();
    await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { code: "Escape", key: "Escape", bubbles: true })));
    assert.equal(sent.at(-1)!.action, "drag-cancel"); assert.equal(writes.length, 0);
    assert.ok(!iframe.classList.contains("pointer-events-none"));
    await start();
    await mouse(document, "mouseup", 500, 300);
    assert.equal(sent.at(-1)!.action, "drop"); assert.equal(writes.length, 0);
    await act(async () => { receive(insert); });
    assert.equal(writes.length, 1);
    assert.match(ids(m.container)[0]!, /^calculator-/); assert.equal(ids(m.container)[1], "hero");
    await act(async () => { receive(insert); }); assert.equal(writes.length, 1);
  } finally { m.unmount(); }
});

test("lưu lỗi thì hoàn nguyên", async () => {
  for (const failure of [{ ok: false, status: 400, error: "Vượt giới hạn" }, { ok: false, status: 409, error: "Trang đã thay đổi" }]) {
    let writes = 0; save = async () => { writes++; return failure; };
    const m = await mount(createElement(Builder, { editor: editor() }));
    try {
      await click(button(m.container, "Thêm Dự toán chi phí"));
      assert.equal(writes, 1); assert.deepEqual(ids(m.container), ["hero"]);
      assert.match(m.container.querySelector('[role="alert"]')!.textContent!, new RegExp(failure.error));
      if (failure.status === 409) {
        await click(button(m.container, "Thêm Dự toán chi phí")); assert.equal(writes, 1);
      }
    } finally { m.unmount(); }
  }
});

test("bấm Thêm chèn sau lựa chọn, flush form cũ và chặn calculator thứ hai", async () => {
  const writes: FormData[] = []; save = async form => { writes.push(form); return { ok: true, revision: 2 + writes.length }; };
  const m = await mount(createElement(Builder, { editor: editor() }));
  try {
    await typeInput(byPath(m.container, "badge"), "Nháp đang sửa");
    await click(button(m.container, "Thêm Dự toán chi phí"));
    const sectionIds = ids(m.container);
    assert.equal(sectionIds[0], "hero"); assert.match(sectionIds[1]!, /^calculator-/);
    assert.equal(writes.length, 2); assert.equal(writes[0].get("revision"), "2"); assert.equal(writes[1].get("revision"), "3");
    assert.equal(writes[1].get("sectionId"), "hero");
    assert.match(writes[1].get("data") as string, /Nháp đang sửa/);
    assert.equal(button(m.container, "Chọn Dự toán chi phí").getAttribute("aria-pressed"), "true");
    assert.equal(button(m.container, "Thêm Dự toán chi phí").disabled, true);
    assert.match(m.container.querySelector('li[data-library-type="calculator"]')!.textContent!, /Chỉ được có tối đa 1/);
    assert.ok(m.container.querySelector('section[aria-label="Thuộc tính section"] h2')!.textContent!.includes("Dự toán chi phí"));
  } finally { m.unmount(); }
});

test("thư viện mở mọi variant theo theme và thiếu thumbnail hiện ô giữ chỗ", async () => {
  const m = await mount(createElement(Builder, { editor: editor() }));
  try {
    const row = m.container.querySelector('li[data-library-type="process"]')!;
    const label = sectionRegistry.types.process.meta.label.vi;
    assert.ok(row.querySelector('img[src^="/section-thumbs/t15/process--"]'));
    await click(button(m.container, `Kiểu của ${label}`));
    for (const variant of sectionRegistry.variantsOf("process")!) assert.ok(button(m.container, `Thêm ${label} kiểu ${variant}`));
    await act(async () => m.root.render(createElement(Builder, { editor: editor({ themeId: "missing" }) })));
    const add = button(m.container, `Thêm ${label}`);
    assert.equal(add.querySelector("img"), null);
    assert.match(add.textContent!, new RegExp(sectionRegistry.variantsOf("process")![0]));
  } finally { m.unmount(); }
});
