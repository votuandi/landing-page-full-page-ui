import { mount, setConfirm } from "./dom.ts";
import { dom } from "./domGlobals.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { useLeaveGuard } from "../preview/useLeaveGuard.ts";
function Guard({ active }: { active: boolean }) { useLeaveGuard(active); return <a href="/other">Other</a>; }
test("dirty blocks beforeunload and internal links; ignores clean, new tab, modifiers and same-page hash", async () => {
  const m = await mount(<Guard active />);
  try {
    const unload = new dom.window.Event("beforeunload", { cancelable: true }); window.dispatchEvent(unload); assert.equal(unload.defaultPrevented, true);
    const link = m.container.querySelector("a")!;
    setConfirm(false);
    function click(options: MouseEventInit = {}) { const e = new dom.window.MouseEvent("click", { bubbles: true, cancelable: true, ...options }); link.dispatchEvent(e); return e.defaultPrevented; }
    assert.equal(click(), true);
    const preventNavigation = (e: Event) => e.preventDefault();
    // Observe guard in capture phase before preventing jsdom's unsupported navigation.
    const observed: boolean[] = []; const observe = (e: Event) => { observed.push(e.defaultPrevented); preventNavigation(e); };
    link.addEventListener("click", observe);
    for (const modifier of ["ctrlKey", "metaKey", "shiftKey", "altKey"]) { click({ [modifier]: true }); assert.equal(observed.pop(), false); }
    click({ button: 1 }); assert.equal(observed.pop(), false);
    link.target = "_blank"; click(); assert.equal(observed.pop(), false); link.target = "";
    link.href = "/#anchor"; click(); assert.equal(observed.pop(), false);
    link.href = "/other"; link.download = "file"; click(); assert.equal(observed.pop(), false); link.removeAttribute("download");
    link.href = "https://other.test/"; click(); assert.equal(observed.pop(), false);
    link.href = "/other"; setConfirm(true); click(); assert.equal(observed.pop(), false); setConfirm(false);
    link.href = "/other"; await act(async () => m.root.render(<Guard active={false} />)); click(); assert.equal(observed.pop(), false);
    const clean = new dom.window.Event("beforeunload", { cancelable: true }); window.dispatchEvent(clean); assert.equal(clean.defaultPrevented, false);
  } finally { m.unmount(); setConfirm(true); }
});
