import { mount, type as typeInput } from "../../../../packages/cms-ui/src/__tests__/dom.ts";
import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act, createElement } from "react";
import LayoutFields from "../app/(admin)/trang/[pageId]/builder/LayoutFields.tsx";
import type { EditableSection } from "@solar/cms-ui";
Object.assign(globalThis, { React });

const faq: EditableSection = { id: "faq", type: "faq", variant: "t15", enabled: true, anchor: "hoi-dap" };
const input = (container: HTMLElement, label: string) => [...container.querySelectorAll("label")].find(l => l.textContent?.startsWith(label))!.querySelector<HTMLInputElement>("input,select")!;

test("fieldset Bố cục có label/enum, ẩn control không hỗ trợ và tôn trọng disabled", async () => {
  const props = { section: faq, sections: [faq], themeSupportsDark: true, disabled: false, onChange() {} };
  const m = await mount(createElement(LayoutFields, props));
  try {
    assert.equal(m.container.querySelector("legend")?.textContent, "Bố cục");
    assert.equal(input(m.container, "Nền").value, "default");
    assert.equal(input(m.container, "Ẩn trên").value, "");
    assert.equal(m.container.querySelectorAll("select").length, 3);
    await act(async () => m.root.render(createElement(LayoutFields, { ...props, section: { ...faq, type: "hero" }, disabled: true })));
    assert.equal(m.container.querySelectorAll("select").length, 1);
    assert.equal(m.container.querySelector("fieldset")!.disabled, true);
  } finally { m.unmount(); }
});
test("mã neo trùng/sai không lưu; blur/Enter lưu hợp lệ, rỗng xóa anchor", async () => {
  const writes: EditableSection[] = [];
  const m = await mount(createElement(LayoutFields, { section: faq, sections: [faq, { ...faq, id: "b", anchor: "bang-gia" }], themeSupportsDark: false, disabled: false, onChange: next => writes.push(next) }));
  const blur = async () => { await act(async () => input(m.container, "Mã neo").dispatchEvent(new window.FocusEvent("focusout", { bubbles: true }))); };
  try {
    assert.equal(m.container.querySelector('option[value="deep"]'), null);
    for (const [value, error] of [["bang-gia", "Mã neo đã dùng"], ["Sai Neo", "Chỉ dùng chữ thường, số và dấu gạch nối"]]) {
      await typeInput(input(m.container, "Mã neo"), value); await blur();
      assert.equal(m.container.querySelector('[role="alert"]')?.textContent, error);
      assert.equal(input(m.container, "Mã neo").getAttribute("aria-invalid"), "true");
    }
    assert.equal(writes.length, 0);
    await typeInput(input(m.container, "Mã neo"), "gia-moi");
    await act(async () => input(m.container, "Mã neo").dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    assert.equal(writes[0].anchor, "gia-moi");
    await typeInput(input(m.container, "Mã neo"), ""); await blur();
    assert.equal(Object.hasOwn(writes[1], "anchor"), false);
  } finally { m.unmount(); }
});
test("sửa layout giữ các trường khác và rollback từ parent cập nhật control", async () => {
  const writes: EditableSection[] = [];
  const section = { ...faq, layout: { spacing: "compact" as const } };
  const props = { section, sections: [section], themeSupportsDark: true, disabled: false, onChange: (next: EditableSection) => { writes.push(next); } };
  const m = await mount(createElement(LayoutFields, props));
  try {
    await typeInput(input(m.container, "Nền"), "tint");
    assert.deepEqual(writes[0], { ...section, layout: { spacing: "compact", background: "tint" } });
    await act(async () => m.root.render(createElement(LayoutFields, { ...props, section: writes[0] })));
    assert.equal(input(m.container, "Nền").value, "tint");
    await act(async () => m.root.render(createElement(LayoutFields, props)));
    assert.equal(input(m.container, "Nền").value, "default");
  } finally { m.unmount(); }
});
