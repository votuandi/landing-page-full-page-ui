"use client";

import { useEffect } from "react";
export function useLeaveGuard(active: boolean, message = "Bạn có thay đổi chưa lưu. Rời trang?") {
  useEffect(() => {
    if (!active) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof window.Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const next = new URL(link.href, window.location.href), current = new URL(window.location.href);
      if (next.origin !== current.origin || (next.pathname === current.pathname && next.search === current.search)) return;
      if (!window.confirm(message)) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    // shortcut: App Router popstate cannot be cancelled; links and document exits are guarded.
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); };
  }, [active, message]);
}
