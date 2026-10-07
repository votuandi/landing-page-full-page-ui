"use client";

import { useEffect } from "react";

const SELECTOR = ".t13-no-scrollbar";
const THRESHOLD = 6;

/**
 * Kéo bằng chuột cho mọi dải cuộn ngang ẩn thanh cuộn (.t13-no-scrollbar: carousel video, sản phẩm, chứng chỉ…).
 * Chỉ áp dụng chuột (cảm ứng đã vuốt được sẵn); kéo quá 6px thì chặn cú click để không mở nhầm thẻ.
 */
export default function DragScroll() {
  useEffect(() => {
    let el: HTMLElement | null = null;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;

    const scrollable = (node: HTMLElement) => {
      const o = getComputedStyle(node).overflowX;
      return (o === "auto" || o === "scroll") && node.scrollWidth > node.clientWidth + 1;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, select, textarea, [contenteditable]")) return;
      const box = target.closest<HTMLElement>(SELECTOR);
      if (!box || !scrollable(box)) return;
      el = box;
      startX = e.clientX;
      startLeft = box.scrollLeft;
      dragging = false;
    };

    const onMove = (e: PointerEvent) => {
      if (!el) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) < THRESHOLD) return;
      if (!dragging) { dragging = true; el.classList.add("is-dragging"); }
      e.preventDefault();
      el.scrollLeft = startLeft - dx;
    };

    const onUp = () => {
      if (!el) return;
      const box = el;
      el = null;
      if (!dragging) return;
      // chặn click ngay sau khi thả chuột (tránh mở video/thẻ khi đang kéo)
      const block = (ev: MouseEvent) => { ev.preventDefault(); ev.stopPropagation(); };
      window.addEventListener("click", block, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", block, { capture: true }), 0);
      box.classList.remove("is-dragging");
      dragging = false;
    };

    // ảnh/link trong dải cuộn không bị kéo-thả kiểu trình duyệt (Firefox)
    const onDragStart = (e: DragEvent) => { if ((e.target as HTMLElement).closest?.(SELECTOR)) e.preventDefault(); };

    // con trỏ "bàn tay" chỉ khi dải đó thật sự cuộn được
    const onOver = (e: MouseEvent) => {
      const box = (e.target as HTMLElement).closest?.<HTMLElement>(SELECTOR);
      if (box) box.classList.toggle("can-drag", scrollable(box));
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return null;
}
