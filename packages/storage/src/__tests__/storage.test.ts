import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ESLint } from "eslint";
import { CreateBucketCommand, DeleteBucketCommand, GetObjectCommand, HeadObjectCommand, PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { assertKey, createLocalDriver, createS3Driver, InvalidKeyError, mediaKey, storageFromEnv, sniff, kindOf, UPLOAD_LIMITS, quarantineKey, privateKey } from "../index.ts";
import { badKeys, collect, runContract } from "./contract.ts";

const publicBase = "https://cdn.example.com/m/";
const tenant = "019a06e0-1234-7000-8000-000000000001";

test("sniff: allowlisted magic bytes, never HTML or SVG", () => {
  const cases: Array<[Uint8Array, string]> = [
    [Buffer.from([255, 216, 255]), "image/jpeg"], [Buffer.from("89504e470d0a1a0a", "hex"), "image/png"],
    [Buffer.from("GIF89a"), "image/gif"], [Buffer.from("RIFF0000WEBP"), "image/webp"],
    [Buffer.from("000000186674797061766966", "hex"), "image/avif"],
    [Buffer.from("000000186674797069736f6d", "hex"), "video/mp4"],
    [Buffer.from("000000186674797071742020", "hex"), "video/quicktime"],
    [Buffer.from("1a45dfa3", "hex"), "video/webm"], [Buffer.from("%PDF-1.7"), "application/pdf"],
  ];
  for (const [bytes, mime] of cases) assert.equal(sniff(bytes)?.mime, mime);
  for (const bytes of [Buffer.from("<html>bad.jpg"), Buffer.from("<svg><script/></svg>"), Buffer.alloc(0), Buffer.from("ftyp")]) assert.equal(sniff(bytes), null);
  assert.equal(kindOf("image/svg+xml"), null);
  assert.deepEqual(UPLOAD_LIMITS, { image: 15 * 1024 ** 2, video: 200 * 1024 ** 2, pdf: 20 * 1024 ** 2 });
});

test("publicUrl prefix: quarantine and private are never public", () => {
  for (const driver of [createLocalDriver({ root: "./unused", publicBase }), createS3Driver({ bucket: "unused", region: "auto", publicBase })]) {
    for (const key of [quarantineKey(tenant), privateKey(tenant, "jpg"), "other/file"]) assert.throws(() => driver.publicUrl(key), InvalidKeyError);
    assert.match(driver.publicUrl(mediaKey(tenant, "jpg")), /\/tenants\//);
  }
  assert.throws(() => quarantineKey("../bad"));
  assert.throws(() => privateKey(tenant, "../bad"));
});

test("signedUploadUrl binds length and content type with a 15 minute expiry", async () => {
  const driver = createS3Driver({ bucket: "test", region: "us-east-1", publicBase, endpoint: "http://localhost:9000", forcePathStyle: true, credentials: { accessKeyId: "test", secretAccessKey: "test" } });
  const result = await driver.signedUploadUrl!(quarantineKey(tenant), { contentType: "image/png", contentLength: 123 });
  const url = new URL(result.url);
  assert.equal(url.host, "localhost:9000");
  assert.equal(url.searchParams.get("X-Amz-Expires"), "900");
  assert.ok(url.searchParams.get("X-Amz-SignedHeaders")?.includes("content-length"));
  assert.ok(url.searchParams.get("X-Amz-SignedHeaders")?.includes("content-type"));
  assert.equal(url.searchParams.has("x-amz-checksum-crc32"), false, "presign must not bind the checksum of an empty body");
  assert.deepEqual(result.headers, { "Content-Type": "image/png" });
});

test("mediaKey: UUID, normalized extension, UTC and uniqueness", () => {
  const now = new Date("2026-02-01T06:30:00+07:00");
  const key = mediaKey(tenant, "JPG", now);
  assert.match(key, new RegExp(`^tenants/${tenant}/2026/01/[0-9a-f-]{36}\\.jpg$`));
  assert.notEqual(key, mediaKey(tenant, "JPG", now));
  assert.doesNotThrow(() => assertKey(key));
});
test("mediaKey từ chối tenant, extension and date invalid", () => {
  for (const id of ["../a", "", "not-a-uuid", `${tenant}/x`, `${tenant}\n`]) assert.throws(() => mediaKey(id, "jpg"));
  for (const ext of ["ph p", "", "exe.js", ".jpg", "abcdefghi", "x/y", "jpg\n", "jpg\r"]) assert.throws(() => mediaKey(tenant, ext));
  assert.throws(() => mediaKey(tenant, "jpg", new Date(NaN)));
});
test("assertKey blocks traversal and invalid characters; list accepts empty/trailing slash", () => {
  for (const key of badKeys) assert.throws(() => assertKey(key), InvalidKeyError);
  for (const prefix of ["", "tenants/", "tenants/a"]) assert.doesNotThrow(() => assertKey(prefix, { prefix: true }));
  for (const prefix of ["/", "a//", "../", "a/./"]) assert.throws(() => assertKey(prefix, { prefix: true }), InvalidKeyError);
});

runContract("local", async () => {
  const root = await mkdtemp(join(tmpdir(), "solar-storage-"));
  return {
    driver: createLocalDriver({ root, publicBase }),
    read: key => readFile(join(root, key)),
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
});

test("local nguyên tử: temporary files hidden and cleaned on success and rename failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "solar-atomic-"));
  try {
    const driver = createLocalDriver({ root, publicBase });
    const key = `tenants/${tenant}/file.txt`;
    await driver.put(key, Buffer.from("complete"), { contentType: "text/plain" });
    assert.deepEqual(await readdir(join(root, ".tmp")), []);
    await mkdir(join(root, ".internal"));
    await mkdir(join(root, "blocked"));
    await assert.rejects(() => driver.put("blocked", Buffer.from("partial"), { contentType: "text/plain" }));
    assert.deepEqual(await readdir(join(root, "blocked")), []);
    assert.deepEqual(await readdir(join(root, ".tmp")), []);
    assert.deepEqual(await collect(driver.list("")), [key]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test("local propagates filesystem errors instead of reporting missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "solar-errors-"));
  try {
    const driver = createLocalDriver({ root: join(root, "file"), publicBase });
    const valid = createLocalDriver({ root, publicBase });
    await valid.put("file", Buffer.from("x"), { contentType: "text/plain" });
    // Windows reports ENOENT for file/child; POSIX reports ENOTDIR.
    if (process.platform !== "win32") {
      await assert.rejects(() => driver.head("child"));
      await assert.rejects(() => driver.delete("child"));
    }
    await mkdir(join(root, "directory"));
    await assert.rejects(() => valid.delete("directory"));
    await assert.rejects(() => collect(driver.list("")));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("config selects local by default, s3 explicitly and accepts IAM credential chain", () => {
  const local = storageFromEnv({ STORAGE_LOCAL_ROOT: "./media", MEDIA_PUBLIC_BASE: publicBase });
  assert.equal(local.publicUrl("tenants/t/k.jpg"), `${publicBase}tenants/t/k.jpg`);
  for (const credentials of [{}, { S3_ACCESS_KEY_ID: "access", S3_SECRET_ACCESS_KEY: "secret" }]) {
    const s3 = storageFromEnv({ STORAGE_DRIVER: "s3", MEDIA_PUBLIC_BASE: publicBase, S3_BUCKET: "media", S3_ENDPOINT: "http://localhost:9000", S3_FORCE_PATH_STYLE: "true", ...credentials });
    assert.equal(s3.publicUrl("tenants/t/k.jpg"), `${publicBase}tenants/t/k.jpg`);
  }
});
test("config errors name missing/invalid env variables without leaking values", () => {
  const secret = "do-not-leak-this-secret";
  const cases: Array<[Record<string, string>, string[]]> = [
    [{}, ["MEDIA_PUBLIC_BASE", "STORAGE_LOCAL_ROOT"]],
    [{ STORAGE_DRIVER: "bad", MEDIA_PUBLIC_BASE: publicBase }, ["STORAGE_DRIVER"]],
    [{ MEDIA_PUBLIC_BASE: secret, STORAGE_LOCAL_ROOT: "media" }, ["MEDIA_PUBLIC_BASE"]],
    [{ STORAGE_DRIVER: "s3", MEDIA_PUBLIC_BASE: publicBase, S3_SECRET_ACCESS_KEY: secret }, ["S3_BUCKET", "S3_ACCESS_KEY_ID"]],
    [{ STORAGE_DRIVER: "s3", MEDIA_PUBLIC_BASE: publicBase, S3_BUCKET: "media", S3_ACCESS_KEY_ID: secret }, ["S3_SECRET_ACCESS_KEY"]],
    [{ STORAGE_DRIVER: "s3", MEDIA_PUBLIC_BASE: publicBase, S3_BUCKET: "media", S3_ENDPOINT: secret, S3_FORCE_PATH_STYLE: "yes" }, ["S3_ENDPOINT", "S3_FORCE_PATH_STYLE"]],
  ];
  for (const [env, names] of cases) {
    assert.throws(() => storageFromEnv(env), (error: unknown) => {
      assert.ok(error instanceof Error);
      for (const name of names) assert.ok(error.message.includes(name), `${name}: ${error.message}`);
      assert.ok(!error.message.includes(secret));
      return true;
    });
  }
});

test("luật fs: ESLint rejects all fs imports outside local and tests", async () => {
  const cwd = fileURLToPath(new URL("../../", import.meta.url));
  const eslint = new ESLint({ cwd });
  for (const source of ["fs", "node:fs", "fs/promises", "node:fs/promises"]) {
    for (const file of ["src/key.ts", "src/drivers/s3.ts"]) {
      const [result] = await eslint.lintText(`import * as fs from "${source}"; void fs;`, { filePath: resolve(cwd, file) });
      assert.ok(result.messages.some(m => m.ruleId === "no-restricted-imports"), `${source}: ${file}`);
    }
    for (const file of ["src/drivers/local.ts", "src/__tests__/sample.ts"]) {
      const [result] = await eslint.lintText(`import * as fs from "${source}"; void fs;`, { filePath: resolve(cwd, file) });
      assert.ok(!result.messages.some(m => m.ruleId === "no-restricted-imports"));
    }
  }
});

test("s3 validates every key before I/O without a running endpoint", async () => {
  const driver = createS3Driver({ bucket: "unused", region: "auto", endpoint: "http://127.0.0.1:1", credentials: { accessKeyId: "test", secretAccessKey: "test" }, publicBase });
  for (const key of badKeys) {
    await assert.rejects(async () => driver.put(key, new Uint8Array(), { contentType: "text/plain" }), InvalidKeyError);
    await assert.rejects(async () => driver.head(key), InvalidKeyError);
    await assert.rejects(async () => driver.get(key), InvalidKeyError);
    await assert.rejects(async () => driver.delete(key), InvalidKeyError);
    assert.throws(() => driver.publicUrl(key), InvalidKeyError);
    if (key !== "" && key !== "a/") await assert.rejects(() => collect(driver.list(key)), InvalidKeyError);
  }
});
test("s3 head: only 404/NotFound becomes null; access and transport errors propagate", async () => {
  // SDK middleware stubs the remote boundary, keeping the real command/error handling.
  const client = new S3Client({ region: "auto" });
  let failure: Error & { $metadata?: { httpStatusCode: number } } = new Error("missing");
  client.middlewareStack.add(() => async () => { throw failure; }, { step: "initialize" });
  const driver = createS3Driver({ bucket: "test", region: "auto", publicBase, client });
  try {
    failure = Object.assign(new Error("missing"), { $metadata: { httpStatusCode: 404 } });
    assert.equal(await driver.head("tenants/t/key"), null);
    failure = Object.assign(new Error("missing"), { name: "NotFound" });
    assert.equal(await driver.head("tenants/t/key"), null);
    for (const code of [403, 500]) {
      failure = Object.assign(new Error("denied"), { $metadata: { httpStatusCode: code } });
      await assert.rejects(() => driver.head("tenants/t/key"), error => error === failure);
    }
    failure = new Error("network unavailable");
    await assert.rejects(() => driver.head("tenants/t/key"), error => error === failure);
  } finally { client.destroy(); }
});

test("s3 get returns bytes or null; access and transport errors propagate", async () => {
  const client = new S3Client({ region: "auto" });
  let failure: Error | undefined;
  client.middlewareStack.add(() => async () => {
    if (failure) throw failure;
    return { response: {}, output: { $metadata: {}, Body: { transformToByteArray: async () => new Uint8Array([0, 255]) } } };
  }, { step: "initialize" });
  const driver = createS3Driver({ bucket: "test", region: "auto", publicBase, client });
  try {
    assert.deepEqual(await driver.get("tenants/t/key"), new Uint8Array([0, 255]));
    for (const error of [Object.assign(new Error("missing"), { name: "NoSuchKey" }), Object.assign(new Error("missing"), { $metadata: { httpStatusCode: 404 } })]) {
      failure = error; assert.equal(await driver.get("tenants/t/key"), null);
    }
    for (const error of [Object.assign(new Error("denied"), { $metadata: { httpStatusCode: 403 } }), new Error("network")]) {
      failure = error; await assert.rejects(() => driver.get("tenants/t/key"), e => e === error);
    }
  } finally { client.destroy(); }
});

const endpoint = process.env.STORAGE_S3_TEST_ENDPOINT;
test("contract s3: policy denies private/quarantine; signedUploadUrl enforces length and MIME", { skip: !endpoint, timeout: 60_000 }, async () => {
  const bucket = `solar-upload-${randomUUID()}`;
  const client = new S3Client({ endpoint, region: "us-east-1", forcePathStyle: true,
    credentials: { accessKeyId: process.env.STORAGE_S3_TEST_ACCESS_KEY_ID ?? "minioadmin", secretAccessKey: process.env.STORAGE_S3_TEST_SECRET_ACCESS_KEY ?? "minioadmin" } });
  const driver = createS3Driver({ bucket, client, region: "us-east-1", publicBase: `${endpoint}/${bucket}` });
  const keys = [mediaKey(tenant, "pdf"), privateKey(tenant, "pdf"), quarantineKey(tenant)];
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    const policy = (await readFile(new URL("../../public-read-policy.json", import.meta.url), "utf8")).replaceAll("BUCKET", bucket);
    await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }));
    for (const key of keys) await driver.put(key, Buffer.from("%PDF-1.7"), { contentType: "application/pdf" });
    for (const [index, key] of keys.entries()) assert.equal((await fetch(`${endpoint}/${bucket}/${key}`)).status, index === 0 ? 200 : 403);
    const signed = await driver.signedUploadUrl!(keys[2], { contentType: "application/pdf", contentLength: 8 });
    assert.equal((await fetch(signed.url, { method: "PUT", headers: signed.headers, body: Buffer.from("%PDF-1.7") })).status, 200);
    assert.equal((await fetch(signed.url, { method: "PUT", headers: signed.headers, body: Buffer.from("%PDF-1.7x") })).status, 403);
    assert.equal((await fetch(signed.url, { method: "PUT", headers: { "Content-Type": "text/html" }, body: Buffer.from("%PDF-1.7") })).status, 403);
    const video = await driver.signedUploadUrl!(keys[2], { contentType: "video/mp4", contentLength: 200 * 1024 ** 2 });
    assert.equal(new URL(video.url).host, new URL(endpoint!).host);
  } finally {
    try { for (const key of keys) await driver.delete(key); await client.send(new DeleteBucketCommand({ Bucket: bucket })); }
    finally { client.destroy(); }
  }
});
test("s3 endpoint is mandatory when STORAGE_REQUIRE_S3=1", () => {
  if (process.env.STORAGE_REQUIRE_S3 === "1") assert.ok(endpoint, "STORAGE_S3_TEST_ENDPOINT is required when STORAGE_REQUIRE_S3=1");
});
runContract("s3", async () => {
  const bucket = process.env.STORAGE_S3_TEST_BUCKET ?? "solar-storage-test";
  const client = new S3Client({
    endpoint, region: "us-east-1", forcePathStyle: true,
    credentials: { accessKeyId: process.env.STORAGE_S3_TEST_ACCESS_KEY_ID ?? "minioadmin", secretAccessKey: process.env.STORAGE_S3_TEST_SECRET_ACCESS_KEY ?? "minioadmin" },
  });
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch (error) {
    if (!(error instanceof Error && error.name === "BucketAlreadyOwnedByYou")) { client.destroy(); throw error; }
  }
  return {
    driver: createS3Driver({ bucket, region: "us-east-1", publicBase, client, maxKeys: 2 }),
    read: async key => {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const meta = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      assert.equal(meta.CacheControl, "public, max-age=31536000, immutable");
      return object.Body!.transformToByteArray();
    },
    cleanup: async () => { client.destroy(); },
  };
}, endpoint ? undefined : "STORAGE_S3_TEST_ENDPOINT chưa cấu hình; Claude/CI chạy MinIO");
