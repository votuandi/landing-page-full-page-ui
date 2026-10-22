// Bất biến chạy trên MỌI dữ liệu đi kèm sản phẩm (seed demo; preset × gói ở presets.test.mjs "every preset … every plan").
// `codegraph impact` không thấy file dữ liệu, nên quy tắc/validator/fallback mới dễ làm hỏng dữ liệu có sẵn mà không test
// nào của story chạm tới (E7-S04: maxPerPage chặn preset t08; E6-S04: seed t12 gói pro + theme signature → fallback).
// Story thêm quy tắc như vậy → thêm một test ở đây (plan mục "Dữ liệu có sẵn chịu ảnh hưởng").
import assert from "node:assert/strict";
import test from "node:test";
import { loadPreset } from "@solar/presets";
import { themeAllowed } from "@solar/plans";
import { buildDemo } from "../../prisma/seed-data.ts";

test("seed demo: theme được gói cho phép, render không rơi về theme fallback (E6-S04)", () => {
  for (const id of ["t15", "t12"] as const) {
    const demo = buildDemo(id);
    assert.ok(themeAllowed(demo.planId, loadPreset(id).theme.meta.group), `${id}: ${demo.themeId} on ${demo.planId}`);
  }
});
