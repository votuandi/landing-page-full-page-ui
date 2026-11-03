import { mount } from "../../../../../../packages/cms-ui/src/__tests__/dom.ts";
import { dom } from "../../../../../../packages/cms-ui/src/__tests__/domGlobals.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import { act, createElement, useImperativeHandle } from "react";
import * as jsx from "react/jsx-runtime";
import ts from "typescript";
import * as protocol from "@solar/cms-ui/preview/protocol";
import * as mode from "../../../components/preview/builderMode.ts";
import type { BuilderCanvasHandle } from "../../../components/preview/BuilderCanvas.tsx";

test("bridge giữ fields trước canvas mount, commit trước refresh/select và bỏ nguồn lạ", async () => {
  const calls: unknown[] = [], frames: FrameRequestCallback[] = [];
  const parent = { postMessage(data: unknown) { calls.push(data); } };
  const descriptor = Object.getOwnPropertyDescriptor(window, "parent")!;
  const originalUrl = window.location.href;
  const originalFrame = globalThis.requestAnimationFrame, originalCancel = globalThis.cancelAnimationFrame;
  const originalScroll = window.scrollTo;
  const originalCss = globalThis.CSS;
  Object.assign(globalThis, { CSS: { escape: (value: string) => value } });
  Object.defineProperty(window, "parent", { value: parent, configurable: true });
  dom.reconfigure({ url: "http://tenant.preview.solar.localhost/?builder=1" });
  globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
  globalThis.cancelAnimationFrame = () => {};
  window.scrollTo = () => {};
  const api: BuilderCanvasHandle = { fields(sectionId, fields) { calls.push({ sectionId, fields }); }, commit() { calls.push("commit"); }, dragAt() {}, drop() { return null; }, cancel() {} };
  function Canvas({ handle }: { handle: React.Ref<BuilderCanvasHandle> }) { useImperativeHandle(handle, () => api, []); return null; }
  const router = { refresh() { calls.push("refresh"); } };
  const imports: Record<string, unknown> = { react: React, "react/jsx-runtime": jsx,
    "next/dynamic": { default: () => Canvas }, "next/navigation": { useRouter: () => router },
    "@solar/cms-ui/preview/protocol": protocol, "./builderMode": mode };
  const source = readFileSync(new URL("../../../components/preview/PreviewBridge.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exported: { PreviewBridge?: React.ComponentType } = {};
  new Function("require", "exports", compiled)((name: string) => { assert.ok(name in imports, name); return imports[name]; }, exported);
  const mounted = await mount(createElement(exported.PreviewBridge!));
  const receive = async (data: unknown, origin = "http://tenant.admin.solar.localhost", from: unknown = parent) => {
    await act(async () => { window.dispatchEvent(new dom.window.MessageEvent("message", { data, origin, source: from as Window })); });
  };
  try {
    assert.ok(calls.some(call => (call as { action?: string })?.action === "ready")); calls.length = 0;
    const fields = { type: "solar-preview", action: "fields", sectionId: "hero", fields: [{ path: ["title"], text: { vi: "Chữ" } }] };
    await receive(fields); assert.equal(calls.length, 0, "lưu fields khi dynamic canvas chưa mount");
    await act(async () => { frames.splice(0).forEach(callback => callback(0)); });
    assert.deepEqual(calls.at(-1), { sectionId: "hero", fields: fields.fields });
    calls.length = 0;
    await receive({ type: "solar-preview", action: "refresh" }, "http://evil.test");
    await receive({ type: "solar-preview", action: "refresh" }, undefined, window);
    assert.deepEqual(calls, []);
    await receive({ type: "solar-preview", action: "refresh" });
    assert.deepEqual(calls.slice(0, 2), ["commit", "refresh"]);
    calls.length = 0;
    await receive({ type: "solar-preview", action: "select", sectionId: "faq" });
    assert.equal(calls[0], "commit"); calls.length = 0;
    await receive({ ...fields, sectionId: "faq" });
    assert.deepEqual(calls, ["commit", { sectionId: "faq", fields: fields.fields }]);
  } finally {
    mounted.unmount(); Object.defineProperty(window, "parent", descriptor); dom.reconfigure({ url: originalUrl });
    globalThis.requestAnimationFrame = originalFrame; globalThis.cancelAnimationFrame = originalCancel; window.scrollTo = originalScroll;
    Object.assign(globalThis, { CSS: originalCss });
  }
});
