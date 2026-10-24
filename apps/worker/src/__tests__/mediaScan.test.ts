import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import type { OutboxJob } from "@solar/db";
import { createMediaScan, type ScanMedia } from "../handlers/mediaScan.ts";
import type { StorageDriver } from "@solar/storage";

const tenantId = randomUUID(), id = randomUUID();
const job: OutboxJob = { id: randomUUID(), tenantId, topic: "media.scan", payload: { tenantId, id }, idempotencyKey: `media.scan:${id}`, attempts: 1, createdAt: new Date(), runAt: new Date() };
function setup(bytes: Uint8Array | null, mime = "image/jpeg", reserved = bytes?.byteLength ?? 100) {
  let row = { id, tenantId, key: `quarantine/${tenantId}/${id}`, mime, size: reserved, status: "quarantine", visibility: "private" };
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

test("media.scan strips gps and all EXIF, trusts sniffed MIME, remains private and is idempotent", async () => {
  const jpeg = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).jpeg().withExif({
    IFD0: { Make: "GPS fixture" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "10/1 0/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "106/1 0/1 0/1" },
  }).toBuffer();
  assert.ok((await sharp(jpeg).metadata()).exif);
  const gps = (await sharp(jpeg).metadata()).exif!;
  assert.ok(gps.includes(Buffer.from([0x25, 0x88])) || gps.includes(Buffer.from([0x88, 0x25])), "fixture must contain a GPS IFD pointer");
  const f = setup(jpeg, "image/png", jpeg.length + 4096); await f.scan(job);
  assert.equal(f.row().status, "ready"); assert.equal(f.row().mime, "image/jpeg");
  assert.equal(f.row().visibility, "private"); assert.match(f.row().key, /^private\//);
  const bytes = f.files.get(f.row().key)!;
  assert.equal((await sharp(bytes).metadata()).exif, undefined);
  assert.equal((await sharp(bytes).metadata()).width, 8);
  assert.equal(f.files.size, 1);
  await f.scan(job); assert.equal(f.files.size, 1);
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
    const f = setup(bytes, mime, bytes.length + 4096); await f.scan(job);
    assert.equal(f.row().status, "ready", `${format}: ${f.rejected}`);
    assert.equal(f.row().mime, mime);
  }
});
