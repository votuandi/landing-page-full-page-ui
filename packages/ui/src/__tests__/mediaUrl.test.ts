import assert from "node:assert/strict";
import test from "node:test";
import { encodeMediaUrl, parseMediaUrl } from "../mediaUrl";

const base = "https://cdn.example/tenants/a/image-w1920.webp";
test("variant url roundtrips and selects smallest sufficient variant", () => {
  const src = encodeMediaUrl(base, [640, 1280, 1920], { x: 0.2, y: 0.8 });
  assert.equal(src, `${base}#m=640,1280,1920&f=0.2,0.8`);
  const media = parseMediaUrl(src)!;
  assert.deepEqual(media.widths, [640, 1280, 1920]);
  assert.deepEqual(media.focal, { x: 0.2, y: 0.8 });
  const tinyFocal = { x: 0.0000001, y: 1 };
  assert.deepEqual(parseMediaUrl(encodeMediaUrl(base, [640, 1280, 1920], tinyFocal))?.focal, tinyFocal);
  for (const [width, expected] of [[1, 640], [640, 640], [641, 1280], [1280, 1280], [1281, 1920], [4096, 1920]]) {
    for (const format of ["avif", "webp"] as const) assert.equal(media.url(width, format), base.replace("w1920.webp", `w${expected}.${format}`));
  }
});
test("small image picks smallest variant", () => {
  const media = parseMediaUrl(encodeMediaUrl(base, [500, 500, 500]))!;
  assert.equal(media.url(500, "avif"), base.replace("w1920.webp", "w640.avif"));
  assert.equal(media.url(1280, "webp"), base.replace("w1920.webp", "w640.webp"));
  assert.equal(media.focal, undefined);
});
test("rejects malformed", () => {
  for (const src of [base, "https://x/a-w640.webp", `${base}#m=abc`, `${base}#m=1,2`, `${base}#m=0,2,3`, `${base}#m=1.5,2,3`, `${base}#m=-1,2,3`, `${base}#m=3,2,1`, `${base}#m=1,2,3&f=1.1,0`, `${base}#m=1,2,3&f=0`, `${base}#m=1,2,3&f=NaN,1`, `${base}#m=1,2,3&f=1e999,0`, `${base}#m=1,2,3&f=-0.1,0`, `${base}#old-w1920.webp#m=1,2,3`, `${base}#m=1,2,3&extra=x`, `https://x/a.webp#m=1,2,3`]) assert.equal(parseMediaUrl(src), null, src);
});
