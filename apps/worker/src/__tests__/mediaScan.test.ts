import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import sharp, { type Sharp } from "sharp";
import type { OutboxJob, MediaVariant } from "@solar/db";
import { readFile } from "node:fs/promises";
import { createMediaScan, type ScanMedia } from "../handlers/mediaScan.ts";
import { sniff, type StorageDriver } from "@solar/storage";

const tenantId = randomUUID(), id = randomUUID();
const job: OutboxJob = { id: randomUUID(), tenantId, topic: "media.scan", payload: { tenantId, id }, idempotencyKey: `media.scan:${id}`, attempts: 1, createdAt: new Date(), runAt: new Date() };
function setup(bytes: Uint8Array | null, mime = "image/jpeg", reserved = bytes?.byteLength ?? 100) {
  let row = { id, tenantId, key: `quarantine/${tenantId}/${id}`, mime, size: reserved, status: "quarantine", visibility: "private", variants: [] as MediaVariant[] };
  const files = new Map<string, Uint8Array>(); if (bytes) files.set(row.key, bytes);
  const rejected: string[] = [];
  const media: ScanMedia = {
    get: async () => row,
    promote: async (_tenant, _id, data) => { row = { ...row, ...data, status: "ready" }; return true; },
    reject: async (_tenant, _id, reason) => { row.status = "failed"; rejected.push(reason); return true; },
  };
  const storage: StorageDriver = { list: async function* () {}, publicUrl: () => { throw Error("private"); },
    get: async (key: string) => files.get(key) ?? null, head: async (key: string) => files.has(key) ? { size: files.get(key)!.byteLength } : null,
    put: async (key: string, b: Uint8Array) => { files.set(key, b); }, delete: async (key: string) => { files.delete(key); } };
  return { files, rejected, media, storage, row: () => row, scan: createMediaScan({ media, storage }) };
}

test("media.scan: html as jpeg, svg, oversize, kind mismatch and missing object are rejected and removed", async () => {
  for (const [bytes, mime, reserved] of [
    [Buffer.from("<html>fake.jpg</html>"), "image/jpeg", 100],
    [Buffer.from("<svg><script>alert(1)</script></svg>"), "image/png", 100],
    [Buffer.from("%PDF-1.7"), "image/jpeg", 100],
    [Buffer.from("%PDF-1.7"), "application/pdf", 2],
    [null, "image/jpeg", 100],
  ] as const) {
    const f = setup(bytes, mime, reserved); await f.scan(job);
    assert.equal(f.row().status, "failed"); assert.equal(f.files.size, 0); assert.equal(f.rejected.length, 1);
  }
});

test("variants: six AVIF/WebP widths", async () => {
  const jpeg = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "red" } }).jpeg().toBuffer();
  const f = setup(jpeg);
  const puts: Parameters<StorageDriver["put"]>[2][] = [];
  const put = f.storage.put;
  f.storage.put = async (key, body, options) => { puts.push(options); await put(key, body, options); };
  await f.scan(job);
  assert.equal(f.row().variants.length, 6);
  assert.equal(f.files.size, 7);
  for (const variant of f.row().variants) {
    assert.match(variant.key, new RegExp(`^private/${tenantId}/\\d{4}/\\d{2}/[a-f0-9-]{36}-w${variant.width}\\.${variant.format}$`));
    const bytes = f.files.get(variant.key)!;
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, variant.width); assert.equal(metadata.height, variant.height);
    assert.equal(bytes.byteLength, variant.size); assert.equal(sniff(bytes)?.mime, `image/${variant.format}`);
    assert.equal(metadata.exif, undefined);
  }
  assert.deepEqual(f.row().variants.map(v => v.width), [640, 640, 1280, 1280, 1920, 1920]);
  assert.ok(puts.every(p => p.cacheControl === "private, no-store"));
});

test("variants never upscale", async () => {
  const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: "red" } }).png().toBuffer();
  const f = setup(png, "image/png"); await f.scan(job);
  assert.equal(f.row().variants.length, 6);
  assert.deepEqual(f.row().variants.map(v => v.width), [640, 640, 800, 800, 800, 800]);
});

test("hero w1280 under 200 KB", async () => {
  const jpeg = await readFile(new URL("../../../web/public/images/solar-panels-hero.jpg", import.meta.url));
  const f = setup(jpeg); await f.scan(job);
  assert.equal(f.row().status, "ready");
  const variants = f.row().variants.filter(v => v.key.includes("-w1280."));
  assert.equal(variants.length, 2);
  for (const variant of variants) assert.ok(variant.size <= 200 * 1024, `${variant.format}: ${variant.size}`);
});

test("decompression bomb rejected, worker survives", async () => {
  const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
  png.writeUInt32BE(10000, 16); png.writeUInt32BE(10000, 20);
  let crc = 0xffffffff;
  for (const byte of png.subarray(12, 29)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  png.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 29);
  await assert.rejects(sharp(png, { limitInputPixels: 50_000_000 }).metadata(), /pixel limit/);
  const f = setup(png, "image/png"); await f.scan(job);
  assert.deepEqual(f.rejected, ["invalid or unsafe image"]); assert.equal(f.files.size, 0);
  const healthy = setup(await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).png().toBuffer(), "image/png");
  await healthy.scan(job); assert.equal(healthy.row().status, "ready"); assert.equal(healthy.row().variants.length, 6);
});

test("animated image keeps original only", async () => {
  const pixels = Buffer.concat([Buffer.alloc(4 * 3 * 3, 0), Buffer.alloc(4 * 3 * 3, 255)]);
  const gif = await sharp(pixels, { raw: { width: 4, height: 6, pageHeight: 3, channels: 3 } }).gif({ delay: [100, 100], loop: 0 }).toBuffer();
  assert.equal((await sharp(gif, { animated: true }).metadata()).pages, 2);
  const f = setup(gif, "image/gif"); await f.scan(job);
  assert.equal(f.row().status, "ready"); assert.deepEqual(f.row().variants, []); assert.equal(f.files.size, 1);
});

test("variant failure cleans partial output", async t => {
  const png = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).png().toBuffer();
  const f = setup(png, "image/png");
  const webp = sharp.prototype.webp; let calls = 0, variantWrites = 0;
  const put = f.storage.put;
  f.storage.put = async (key, body, opts) => { if (key.includes("-w")) variantWrites++; await put(key, body, opts); };
  t.mock.method(sharp.prototype, "webp", function (this: Sharp, ...args: Parameters<typeof webp>) {
    if (++calls === 2) throw Error("encoder failure");
    return webp.apply(this, args);
  });
  await f.scan(job);
  assert.equal(variantWrites, 3); assert.deepEqual(f.rejected, ["invalid or unsafe image"]); assert.equal(f.files.size, 0);
});

test("stale promote removes variants", async () => {
  const png = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).png().toBuffer();
  const f = setup(png, "image/png"); let count = 0;
  f.media.promote = async (_tenant, _id, data) => { count = data.variants?.length ?? 0; return false; };
  await f.scan(job); assert.equal(count, 6); assert.equal(f.files.size, 0);
});

test("image deadline covers all variants", async t => {
  const png = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).png().toBuffer();
  const f = setup(png, "image/png"), start = Date.now(); let writes = 0;
  const put = f.storage.put;
  t.mock.method(Date, "now", () => start + (writes > 0 ? 31_000 : 0));
  f.storage.put = async (key, body, opts) => { if (key.includes("-w")) writes++; await put(key, body, opts); };
  await f.scan(job);
  assert.deepEqual(f.rejected, ["invalid or unsafe image"]); assert.equal(f.files.size, 0);
});

test("variant storage and promote errors clean output, remain retryable and do not reject content", async () => {
  const png = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).png().toBuffer();
  for (const failure of ["put", "promote"]) {
    const f = setup(png, "image/png"), quarantine = f.row().key;
    if (failure === "put") {
      const put = f.storage.put;
      f.storage.put = async (key, body, opts) => { await put(key, body, opts); if (key.includes("-w1280")) throw Error("offline"); };
    } else f.media.promote = async () => { throw Error("offline"); };
    await assert.rejects(f.scan(job), /offline/);
    assert.deepEqual([...f.files.keys()], [quarantine]); assert.equal(f.rejected.length, 0);
  }
});

test("media.scan strips gps and all EXIF, trusts sniffed MIME, remains private and is idempotent", async () => {
  const jpeg = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).jpeg().withExif({
    IFD0: { Make: "GPS fixture" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "10/1 0/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "106/1 0/1 0/1" },
  }).toBuffer();
  assert.ok((await sharp(jpeg).metadata()).exif);
  const gps = (await sharp(jpeg).metadata()).exif!;
  assert.ok(gps.includes(Buffer.from([0x25, 0x88])) || gps.includes(Buffer.from([0x88, 0x25])), "fixture must contain a GPS IFD pointer");
  const f = setup(jpeg, "image/png"); await f.scan(job);
  assert.equal(f.row().status, "ready"); assert.equal(f.row().mime, "image/jpeg");
  assert.equal(f.row().visibility, "private"); assert.match(f.row().key, /^private\//);
  const bytes = f.files.get(f.row().key)!;
  assert.equal((await sharp(bytes).metadata()).exif, undefined);
  assert.equal((await sharp(bytes).metadata()).width, 8);
  assert.equal(f.files.size, 7);
  await f.scan(job); assert.equal(f.files.size, 7);
});

test("media.scan: failed retries only clean quarantine; stale scan cannot leave its private output", async () => {
  const f = setup(Buffer.from("%PDF-1.7"), "application/pdf");
  f.media.promote = async () => false;
  await f.scan(job); assert.equal(f.files.size, 0);
  const invalid = setup(Buffer.from("<html>"));
  await invalid.scan(job); await invalid.scan(job);
  assert.equal(invalid.rejected.length, 1); assert.equal(invalid.files.size, 0);
});

test("media.scan storage errors retry instead of rejecting content; foreign jobs fail", async () => {
  const f = setup(Buffer.from("%PDF-1.7"), "application/pdf");
  f.storage.get = async () => { throw Error("offline"); };
  await assert.rejects(f.scan(job), /offline/); assert.equal(f.rejected.length, 0);
  await assert.rejects(f.scan({ ...job, payload: { tenantId: randomUUID(), id } }));
});

test("media.scan accepts every allowlisted image encoding and strips metadata", async () => {
  for (const [format, mime] of [["png", "image/png"], ["gif", "image/gif"], ["webp", "image/webp"], ["avif", "image/avif"]] as const) {
    const bytes = await sharp({ create: { width: 4, height: 3, channels: 3, background: "red" } }).toFormat(format).toBuffer();
    const f = setup(bytes, mime); await f.scan(job);
    assert.equal(f.row().status, "ready", `${format}: ${f.rejected}`);
    assert.equal(f.row().mime, mime);
  }
});

test("I1: optimized palette PNG and low-quality JPEG grow after cleaning and become ready without padding", async () => {
  const raw = Buffer.alloc(64 * 64 * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 13 + (i >> 5)) % 256;
  for (const [format, mime] of [["png", "image/png"], ["jpeg", "image/jpeg"]] as const) {
    const image = sharp(raw, { raw: { width: 64, height: 64, channels: 3 } });
    const input = await (format === "png" ? image.png({ palette: true, colours: 8 }) : image.jpeg({ quality: 50 })).toBuffer();
    const output = await sharp(input).rotate().toBuffer();
    assert.ok(output.length > input.length, `${format}: fixture must reproduce growth`);
    const f = setup(input, mime); await f.scan(job);
    assert.equal(f.row().status, "ready", `${format}: ${f.rejected}`);
    assert.equal(f.row().size, f.files.get(f.row().key)!.byteLength);
  }
});
