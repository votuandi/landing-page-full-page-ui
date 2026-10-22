import { mount, button, click, type } from "./dom.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, useState } from "react";
import { UpgradeDialog } from "../UpgradeDialog.tsx";

test("dialog gửi message, báo lỗi và cho thử lại rồi báo thành công", async () => {
  let message = "", calls = 0;
  const m = await mount(<UpgradeDialog open label="Video Shorts" onClose={() => {}} submit={async value => { message = value; calls++; return calls === 1 ? { error: "Thử lại" } : { ok: true, message: "Đã gửi" }; }} />);
  try {
    assert.equal(m.container.querySelector('[role="dialog"]')?.getAttribute("aria-modal"), "true");
    const field = m.container.querySelector("textarea")!; assert.equal(field.maxLength, 1000);
    await type(field, "Tư vấn gói");
    await act(async () => { button(m.container, "Gửi yêu cầu").click(); });
    assert.equal(message, "Tư vấn gói"); assert.match(m.container.textContent!, /Thử lại/);
    await act(async () => { button(m.container, "Gửi yêu cầu").click(); });
    assert.match(m.container.querySelector('[role="status"]')!.textContent!, /Đã gửi/);
    assert.equal(m.container.querySelector("textarea"), null);
  } finally { m.unmount(); }
});

test("Esc đóng và trả focus về nút mở", async () => {
  function Controlled() {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>Nâng cấp</button><UpgradeDialog open={open} label="Video Shorts" onClose={() => setOpen(false)} submit={async () => ({ ok: true })} /></>;
  }
  const m = await mount(<Controlled />);
  try {
    const opener = button(m.container, "Nâng cấp"); opener.focus(); await click(opener);
    await new Promise(resolve => setTimeout(resolve, 15));
    assert.equal(document.activeElement?.tagName, "TEXTAREA");
    await act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    assert.equal(m.container.querySelector('[role="dialog"]'), null);
    assert.equal(document.activeElement, opener);
  } finally { m.unmount(); }
});
