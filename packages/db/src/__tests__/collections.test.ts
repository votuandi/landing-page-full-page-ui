import assert from "node:assert/strict";
import test from "node:test";
import { COLLECTIONS, collectionDefs, collectionInputSchema, slugify } from "../collections.ts";
import { buildDemo } from "../../prisma/seed-data.ts";

test("slugify vietnamese", () => {
  assert.equal(slugify("Hệ thống Điện mặt trời Đà Nẵng"), "he-thong-dien-mat-troi-da-nang");
  assert.equal(slugify(" ☀️ / Đà & Nẵng! "), "da-nang");
  assert.equal(slugify("☀️"), "");
  assert.ok(slugify("a".repeat(300)).length <= 200);
});
test("every collection default validates", () => {
  assert.equal(COLLECTIONS.length, 12);
  for (const name of COLLECTIONS) assert.ok(collectionInputSchema(name).safeParse({ ...collectionDefs[name].defaults, status: "published" }).success, name);
});
test("seed rows parse with shared schemas", () => {
  const names = { categories: "productCategory", brands: "brand", products: "product", projects: "project", posts: "post", services: "service", branches: "branch", certificates: "certificate", pressItems: "pressItem", stories: "story", testimonials: "testimonial", faqs: "faq" } as const;
  for (const id of ["t12", "t15"] as const) {
    for (const [key, rows] of Object.entries(buildDemo(id).collections)) {
      const def = collectionDefs[names[key as keyof typeof names]];
      for (const row of rows) assert.ok(def.data.safeParse(row.data).success, `${id}/${key}/${row.slug}`);
    }
  }
});
test("product sale price rule", () => {
  const input = { ...collectionDefs.product.defaults, status: "draft" };
  for (const salePrice of [100, 101]) {
    const result = collectionInputSchema("product").safeParse({ ...input, columns: { ...input.columns, price: 100, salePrice } });
    assert.equal(result.success, false);
    if (!result.success) assert.match(result.error.message, /Giá giảm phải nhỏ hơn giá gốc/);
  }
  assert.ok(collectionInputSchema("product").safeParse({ ...input, columns: { price: null, salePrice: null } }).success);
  assert.ok(collectionInputSchema("product").safeParse({ ...input, columns: { price: 100, salePrice: 50 } }).success);
});
test("story source providers", () => {
  for (const [provider, good, bad] of [["youtube", "abcdef12345", "!"], ["tiktok", "123456789", "abc"], ["file", "/video/demo.mp4", "/../demo.mp4"], ["bunny", "https://example.com/video", "http://example.com/video"]]) {
    const data = collectionDefs.story.defaults.data as object;
    assert.ok(collectionDefs.story.data.safeParse({ ...data, source: { provider, idOrSrc: good } }).success);
    assert.equal(collectionDefs.story.data.safeParse({ ...data, source: { provider, idOrSrc: bad } }).success, false);
  }
});
test("writes reject content that the public collection would discard", () => {
  const product = { ...collectionDefs.product.defaults, status: "published" };
  const data = product.data as { images: string[] };
  assert.equal(collectionInputSchema("product").safeParse({ ...product, data: { ...data, images: Array(9).fill(data.images[0]) } }).success, false);
  assert.equal(collectionInputSchema("product").safeParse({ ...product, data: { ...data, warranty: "" } }).success, false);
  for (const [name, field] of [["project", "location"], ["post", "excerpt"]] as const) {
    const value = collectionDefs[name].defaults;
    assert.equal(collectionInputSchema(name).safeParse({ ...value, status: "published", data: { ...value.data as object, [field]: "" } }).success, false);
  }
});
