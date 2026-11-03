import { mount } from "../../../../../../packages/cms-ui/src/__tests__/dom.ts";
import { dom } from "../../../../../../packages/cms-ui/src/__tests__/domGlobals.ts";
import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act, createElement, createRef } from "react";
import BuilderCanvas, { type BuilderCanvasHandle } from "../../../components/preview/BuilderCanvas.tsx";

async function inlineCanvas(run: (fixture: {
  parent: HTMLElement; text: Text; icon: HTMLElement; main: HTMLElement; handle: React.RefObject<BuilderCanvasHandle | null>;
  events: unknown[]; container: HTMLElement; begin(): Promise<void>; render(pending: boolean): Promise<void>; fire(type: string, options?: Record<string, unknown>): Event;
}) => Promise<void>) {
  const globals = globalThis as Record<string, unknown>;
  const names = ["React", "Element", "ResizeObserver", "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame"];
  const originals = Object.fromEntries(names.map(name => [name, globals[name]]));
  Object.assign(globals, { React, Element: dom.window.Element, MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} disconnect() {} }, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {} });
  const rangeRect = dom.window.Range.prototype.getBoundingClientRect;
  dom.window.Range.prototype.getBoundingClientRect = () => ({ top: 10, bottom: 30, height: 20, left: 10, right: 110, width: 100, x: 10, y: 10, toJSON() {} });
  const main = document.createElement("main"), section = document.createElement("section"), parent = document.createElement("h2");
  section.dataset.sectionId = "hero";
  const text = document.createTextNode("Tiêu đề"), icon = document.createElement("span"); icon.textContent = "→";
  parent.append(text, icon); section.append(parent); main.append(section); document.body.append(main);
  const handle = createRef<BuilderCanvasHandle>(), events: unknown[] = [];
  const props = { handle, selectedId: "hero", reorder: true, onSelect() {}, onEvent(event: unknown) { events.push(event); } };
  const mounted = await mount(createElement(BuilderCanvas, props));
  const render = async (pending: boolean) => { await act(async () => mounted.root.render(createElement(BuilderCanvas, { ...props, pending }))); };
  const fire = (type: string, options: Record<string, unknown> = {}) => {
    const event = new dom.window.Event(type, { bubbles: true, cancelable: true });
    for (const [key, value] of Object.entries(options)) Object.defineProperty(event, key, { value });
    parent.dispatchEvent(event); return event;
  };
  const begin = async () => { await act(async () => {
    handle.current!.fields("hero", [{ path: ["title", "highlight"], text: { vi: "Tiêu đề" } }]);
    fire("dblclick", { clientX: 20, clientY: 20 });
  }); assert.ok(mounted.container.querySelector('[data-builder-inline][data-path="title.highlight"]')); assert.ok(parent.hasAttribute("contenteditable")); };
  try { await run({ parent, text, icon, main, handle, events, container: mounted.container, begin, render, fire }); }
  finally { mounted.unmount(); main.remove(); Object.assign(globals, originals); dom.window.Range.prototype.getBoundingClientRect = rangeRect; document.documentElement.lang = "vi"; }
}

test("dán chỉ chèn text vào nút chữ", () => inlineCanvas(async ({ parent, text, icon, events, begin, fire }) => {
  await begin();
  const range = document.createRange(); range.setStart(text, 0); range.setEnd(text, text.length);
  window.getSelection()!.removeAllRanges(); window.getSelection()!.addRange(range);
  await act(async () => {
    const paste = fire("paste", { clipboardData: { getData: (format: string) => format === "text/plain" ? "Đậm\nnhạt" : "<b>Đậm</b>" } });
    assert.equal(paste.defaultPrevented, true);
    assert.equal(text.nodeValue, "Đậm nhạt");
    fire("keydown", { key: "Enter" });
  });
  assert.deepEqual([...parent.childNodes], [text, icon]); assert.equal(parent.querySelector("b"), null);
  assert.deepEqual(events.at(-1), { type: "solar-preview", action: "inline", sectionId: "hero", path: ["title", "highlight"], locale: "vi", text: "Đậm nhạt" });
  assert.equal(parent.hasAttribute("contenteditable"), false);
}));

test("giữ nguyên cấu trúc DOM, chỉ đổi nodeValue", () => inlineCanvas(async ({ parent, text, icon, begin, fire }) => {
  parent.setAttribute("contenteditable", "false"); await begin();
  await act(async () => {
    for (const inputType of ["formatBold", "historyUndo", "insertFromDrop"]) assert.equal(fire("beforeinput", { inputType }).defaultPrevented, true);
    const outside = document.createRange(); outside.selectNodeContents(parent);
    assert.equal(fire("beforeinput", { inputType: "deleteContentBackward", getTargetRanges: () => [outside] }).defaultPrevented, true);
    text.nodeValue = "Đúng"; fire("input");
    parent.append(document.createElement("br")); icon.remove(); text.nodeValue = "Sai"; fire("input");
    assert.deepEqual([...parent.childNodes], [text, icon]); assert.equal(text.nodeValue, "Đúng");
    fire("compositionstart"); text.nodeValue = "Tiếng Việt"; fire("input", { isComposing: true }); fire("compositionend");
    assert.deepEqual([...parent.childNodes], [text, icon]); assert.equal(text.nodeValue, "Tiếng Việt");
    fire("keydown", { key: "a", ctrlKey: true });
    const selection = window.getSelection()!;
    assert.equal(selection.anchorNode, text); assert.equal(selection.focusNode, text);
    assert.equal(fire("beforeinput", { inputType: "insertParagraph" }).defaultPrevented, true);
  });
  assert.equal(parent.getAttribute("contenteditable"), "false");
  assert.deepEqual([...parent.childNodes], [text, icon]);
}));

test("Escape hoàn nguyên", () => inlineCanvas(async ({ text, parent, events, begin, fire, container }) => {
  await begin(); await act(async () => { text.nodeValue = "Đổi"; fire("input"); fire("keydown", { key: "Escape" }); });
  assert.equal(text.nodeValue, "Tiêu đề"); assert.equal(events.length, 0);
  assert.equal(parent.hasAttribute("contenteditable"), false); assert.equal(container.querySelector("[data-builder-inline]"), null);
}));

test("commit gửi chữ đang gõ", () => inlineCanvas(async ({ text, handle, events, begin, fire }) => {
  document.documentElement.lang = "en";
  await begin(); await act(async () => { text.nodeValue = "  New\n title  "; fire("input"); handle.current!.commit(); handle.current!.commit(); });
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { type: "solar-preview", action: "inline", sectionId: "hero", path: ["title", "highlight"], locale: "en", text: "New title" });
}));

test("chữ không khớp hoặc trùng thì không sửa", () => inlineCanvas(async ({ parent, handle, fire, container }) => {
  await act(async () => {
    handle.current!.fields("hero", [{ path: ["long"], text: { vi: "Dài" } }]); fire("dblclick");
    assert.equal(container.querySelector("[data-builder-inline]"), null);
    handle.current!.fields("hero", [{ path: ["a"], text: { vi: "Tiêu đề" } }, { path: ["b"], text: { vi: "Tiêu đề" } }]); fire("dblclick");
  });
  assert.equal(container.querySelector("[data-builder-inline]"), null); assert.equal(parent.hasAttribute("contenteditable"), false);
}));

test("hover và nhấp đơn không bật sửa; pending, drag, fields rỗng khóa sửa", () => inlineCanvas(async ({ parent, handle, fire, container, render }) => {
  const field = { path: ["title"], text: { vi: "Tiêu đề" } };
  const point = { clientX: 20, clientY: 20 };
  await act(async () => { handle.current!.fields("hero", [field]); fire("mousemove", point); });
  assert.ok(container.querySelector("[data-builder-editable]"));
  await act(async () => { fire("click", point); });
  assert.equal(parent.hasAttribute("contenteditable"), false);
  await render(true);
  await act(async () => { fire("dblclick", point); });
  assert.equal(parent.hasAttribute("contenteditable"), false);
  await render(false);
  await act(async () => { handle.current!.dragAt(20); fire("dblclick", point); });
  assert.equal(parent.hasAttribute("contenteditable"), false);
  await act(async () => { handle.current!.cancel(); handle.current!.fields("hero", []); fire("dblclick", point); });
  assert.equal(parent.hasAttribute("contenteditable"), false);
}));

test("fields section khác và focusout chốt trước khi bỏ hộp", () => inlineCanvas(async ({ text, parent, handle, events, begin, fire, container }) => {
  await begin();
  await act(async () => { text.nodeValue = "Một"; fire("input"); handle.current!.fields("faq", []); });
  assert.deepEqual((events[0] as { text: string }).text, "Một");
  assert.equal(parent.hasAttribute("contenteditable"), false);
  assert.equal(container.querySelector("[data-builder-inline]"), null);
  await act(async () => { handle.current!.fields("hero", [{ path: ["title"], text: { vi: "Một" } }]); fire("dblclick", { clientX: 20, clientY: 20 }); text.nodeValue = "Hai"; fire("input"); fire("focusout"); });
  assert.deepEqual((events[1] as { text: string }).text, "Hai");
  assert.equal(events.length, 2);
}));

test("canvas handle kéo thư viện, hủy và chèn cuối trang trống; không có reorder thì bỏ qua", async () => {
  const globals = globalThis as Record<string, unknown>;
  const names = ["React", "Element", "ResizeObserver", "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame"];
  const originals = Object.fromEntries(names.map(name => [name, globals[name]]));
  const frames = new Map<number, FrameRequestCallback>(); let sequence = 0, scrolls = 0;
  Object.assign(globals, { React, Element: dom.window.Element, MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  const originalScroll = window.scrollTo; window.scrollTo = () => { scrolls++; };
  const main = document.createElement("main"), faq = document.createElement("section");
  faq.dataset.sectionId = "faq";
  faq.getBoundingClientRect = () => ({ top: 400, bottom: 800, height: 400, left: 0, right: 390, width: 390, x: 0, y: 400, toJSON() {} });
  main.append(faq); document.body.append(main);
  const handle = createRef<BuilderCanvasHandle>();
  const props = { handle, selectedId: null, reorder: true, onSelect() {}, onEvent() {} };
  const mounted = await mount(createElement(BuilderCanvas, props));
  try {
    await act(async () => { handle.current!.dragAt(420); });
    assert.ok(mounted.container.querySelector("[data-builder-drop]"));
    let destination: unknown;
    await act(async () => { destination = handle.current!.drop(700); });
    assert.deepEqual(destination, { targetId: "faq", position: "after", top: 800 });
    assert.equal(mounted.container.querySelector("[data-builder-drop]"), null);
    for (let round = 1; round <= 2; round++) {
      await act(async () => { handle.current!.dragAt(window.innerHeight - 1); });
      await act(async () => { const queued = [...frames]; frames.clear(); queued.forEach(([, callback]) => callback(0)); });
      assert.equal(scrolls, round);
      await act(async () => { handle.current!.cancel(); });
      assert.equal(mounted.container.querySelector("[data-builder-drop]"), null);
    }
    faq.remove();
    await act(async () => { handle.current!.dragAt(100); destination = handle.current!.drop(100); });
    assert.equal(destination, null);
    main.append(faq);
    await act(async () => mounted.root.render(createElement(BuilderCanvas, { ...props, reorder: false })));
    await act(async () => { handle.current!.dragAt(420); destination = handle.current!.drop(420); });
    assert.equal(destination, null); assert.equal(mounted.container.querySelector("[data-builder-drop]"), null);
  } finally { mounted.unmount(); main.remove(); window.scrollTo = originalScroll; Object.assign(globals, originals); }
});

test("canvas tự cuộn ở mép trong cả hai lần kéo sau khi hủy", async () => {
  const globals = globalThis as Record<string, unknown>;
  const names = ["React", "Element", "ResizeObserver", "MutationObserver", "requestAnimationFrame", "cancelAnimationFrame"];
  const originals = Object.fromEntries(names.map(name => [name, globals[name]]));
  let sequence = 0, scrolls = 0;
  const frames = new Map<number, FrameRequestCallback>();
  Object.assign(globals, { React, Element: dom.window.Element, MutationObserver: dom.window.MutationObserver,
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++sequence, callback); return sequence; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  const originalScroll = window.scrollTo;
  window.scrollTo = () => { scrolls++; };
  const main = document.createElement("main");
  for (const [id, top] of [["hero", 0], ["faq", 500]] as const) {
    const section = document.createElement("div"); section.dataset.sectionId = id; section.dataset.sectionType = id;
    section.getBoundingClientRect = () => ({ top, bottom: top + 500, left: 0, right: 390, width: 390, height: 500, x: 0, y: top, toJSON() {} });
    main.append(section);
  }
  document.body.append(main);
  const mounted = await mount(createElement(BuilderCanvas, { selectedId: "hero", reorder: true, onSelect() {}, onEvent() {} }));
  const tick = async () => { await act(async () => {
    const queued = [...frames]; frames.clear(); for (const [, callback] of queued) callback(0);
  }); };
  const pointer = (target: EventTarget, type: string, clientY = 0) => {
    const event = new dom.window.MouseEvent(type, { bubbles: true, clientY, button: 0 });
    Object.defineProperty(event, "pointerId", { value: 1 }); target.dispatchEvent(event);
  };
  try {
    await tick();
    const handle = mounted.container.querySelector<HTMLButtonElement>("[data-builder-handle]")!;
    handle.setPointerCapture = () => {}; handle.hasPointerCapture = () => true; handle.releasePointerCapture = () => {};
    for (let round = 1; round <= 2; round++) {
      await act(async () => { pointer(handle, "pointerdown", 40); pointer(window, "pointermove", window.innerHeight - 1); });
      await tick();
      assert.equal(scrolls, round, "mỗi lần kéo phải tự cuộn được");
      await act(async () => { pointer(window, "pointercancel"); });
    }
  } finally {
    mounted.unmount(); main.remove(); window.scrollTo = originalScroll; Object.assign(globals, originals);
  }
});
