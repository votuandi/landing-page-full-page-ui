import assert from "node:assert/strict";
import test from "node:test";
import { mediaStatus, filterMedia, altWarning } from "../lib/mediaLibrary.ts";

test("altWarning only for ready images", () => {
  for (const mime of ["image/png", "video/mp4", "application/pdf"]) for (const status of ["ready", "quarantine", "failed"]) {
    assert.equal(altWarning({ mime, status, alt: null }), mime === "image/png" && status === "ready");
    assert.equal(altWarning({ mime, status, alt: { vi: "  " } }), mime === "image/png" && status === "ready");
    assert.equal(altWarning({ mime, status, alt: { vi: "Ảnh mái nhà" } }), false);
  }
});

test("filterMedia searches Vietnamese name and both alt locales, ignores blank q and unknown kind", () => {
  const rows = [
    { name: "Mái nhà.jpg", alt: null, mime: "image/jpeg" },
    { name: null, alt: { vi: "Điện mặt trời", en: "Roof video" }, mime: "video/mp4" },
    { name: "Tài liệu.pdf", alt: null, mime: "application/pdf" },
  ];
  for (const [q, kind, expected] of [["MAI NHA", "", [rows[0]]], ["dien", "video", [rows[1]]], ["ROOF", "", [rows[1]]], ["  ", "other", rows], ["", "document", [rows[2]]], ["missing", "image", []]] as const) {
    assert.deepEqual(filterMedia(rows, { q, kind }), expected);
  }
});

test("media status labels quarantine, ready variants, failed and legacy JSON", () => {
  const variant = { key: "private/tenant/image-w640.avif", format: "avif", width: 640, height: 480, size: 60 };
  for (const [status, variants, label] of [
    ["quarantine", null, "Đang xử lý"], ["failed", [], "Lỗi"], ["ready", null, "Sẵn sàng"],
    ["ready", { thumbnail: { url: "legacy" } }, "Sẵn sàng"], ["ready", Array(6).fill(variant), "Sẵn sàng · 6 biến thể"],
  ] as const) assert.equal(mediaStatus({ status, variants }), label);
});
