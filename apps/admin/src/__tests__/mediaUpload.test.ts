import assert from "node:assert/strict";
import test from "node:test";
import { uploadMediaFiles } from "../lib/mediaUpload.ts";

test("upload batch continues after unsupported file and quota 413, preserving server messages", async () => {
  const files = [new File(["a"], "Mái nhà.png", { type: "image/png" }), new File(["b"], "invalid.exe", { type: "application/octet-stream" }), new File(["c"], "second.png", { type: "image/png" }), new File(["d"], "quota.png", { type: "image/png" })];
  const progress = new Map<number, { message: string; error: boolean }>(), names: string[] = [], completed: string[] = [];
  const request: typeof fetch = async (url, options) => {
    if (url === "/api/media") {
      const input = JSON.parse(String(options?.body)); names.push(input.name);
      if (input.mime !== "image/png") return Response.json({ error: "Loại hoặc kích thước tệp không được hỗ trợ." }, { status: 400 });
      if (input.name === "quota.png") return Response.json({ error: "Vượt dung lượng media của gói dịch vụ." }, { status: 413 });
      return Response.json({ id: input.name, upload: { url: `/put/${input.name}`, method: "PUT", headers: { "Content-Type": input.mime } } }, { status: 201 });
    }
    if (String(url).startsWith("/put/")) { assert.ok(options?.body instanceof File); return new Response(null, { status: 204 }); }
    completed.push(String(url)); return Response.json({}, { status: 202 });
  };
  await uploadMediaFiles(files, (index, message, error = false) => progress.set(index, { message, error }), request);
  assert.deepEqual(names, files.map(file => file.name)); assert.equal(completed.length, 2);
  assert.equal(progress.get(0)?.error, false); assert.equal(progress.get(2)?.error, false);
  assert.deepEqual(progress.get(1), { message: "Loại hoặc kích thước tệp không được hỗ trợ.", error: true });
  assert.deepEqual(progress.get(3), { message: "Vượt dung lượng media của gói dịch vụ.", error: true });
});

test("upload network errors stay Vietnamese, cancel reservations and do not stop the next file", async () => {
  const files = [new File(["a"], "put.png", { type: "image/png" }), new File(["b"], "complete.png", { type: "image/png" }), new File(["c"], "network.png", { type: "image/png" }), new File(["d"], "success.png", { type: "image/png" })];
  const progress = new Map<number, { message: string; error: boolean }>(), cancelled: string[] = [];
  let successes = 0;
  const request: typeof fetch = async (url, options) => {
    if (options?.method === "DELETE") { cancelled.push(String(url)); throw new TypeError("Failed to fetch private-key"); }
    if (url === "/api/media") {
      const { name } = JSON.parse(String(options?.body));
      if (name === "network.png") throw new TypeError("Failed to fetch");
      return Response.json({ id: name, upload: { url: `/put/${name}`, method: "PUT" } });
    }
    if (url === "/put/put.png" || url === "/api/media/complete.png/complete") throw new TypeError("Failed to fetch private-key");
    if (url === "/api/media/success.png/complete") successes++;
    return new Response(null, { status: 204 });
  };
  await uploadMediaFiles(files, (index, message, error = false) => progress.set(index, { message, error }), request);
  assert.equal(successes, 1); assert.deepEqual(cancelled, ["/api/media/put.png", "/api/media/complete.png"]);
  for (const index of [0, 1, 2]) assert.deepEqual(progress.get(index), { message: "Không thể tải tệp. Kiểm tra kết nối và thử lại.", error: true });
  assert.equal(progress.get(3)?.error, false);
});
