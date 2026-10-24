import assert from "node:assert/strict";
import test from "node:test";
import { mediaStatus } from "../lib/mediaLibrary.ts";

test("media status labels quarantine, ready variants, failed and legacy JSON", () => {
  const variant = { key: "private/tenant/image-w640.avif", format: "avif", width: 640, height: 480, size: 60 };
  for (const [status, variants, label] of [
    ["quarantine", null, "Đang xử lý"], ["failed", [], "Lỗi"], ["ready", null, "Sẵn sàng"],
    ["ready", { thumbnail: { url: "legacy" } }, "Sẵn sàng"], ["ready", Array(6).fill(variant), "Sẵn sàng · 6 biến thể"],
  ] as const) assert.equal(mediaStatus({ status, variants }), label);
});
