import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { request as httpsRequest } from "node:https";
import { assertPublicUrl, safeRequest } from "../safeRequest.ts";

const publicDns = async () => [{ address: "93.184.216.34", family: 4 }];
test("chỉ https, cổng 443, không credentials", async () => {
  for (const url of ["http://127.0.0.1/x", "https://host:8443", "https://u:p@host"]) {
    await assert.rejects(assertPublicUrl(url, publicDns));
  }
});
test("metadata, loopback dạng khác, DNS nội bộ và một IP nội bộ là đủ chặn", async () => {
  for (const address of ["169.254.169.254", "::1", "::ffff:127.0.0.1", "10.0.0.5", "192.168.1.2", "100.64.0.1", "fd00::1", "fe80::1", "0.0.0.0", "2001:db8::1", "224.0.0.1"]) {
    await assert.rejects(assertPublicUrl("https://host", async () => [...await publicDns(), { address, family: address.includes(":") ? 6 : 4 }]));
  }
  for (const url of ["https://[::1]", "https://[::ffff:127.0.0.1]", "https://2130706433", "https://169.254.169.254/latest"]) {
    await assert.rejects(assertPublicUrl(url, publicDns));
    const t = transport(200);
    await assert.rejects(safeRequest(url, {}, { ...t, resolve: publicDns }));
    assert.equal(t.calls(), 0, "địa chỉ literal bị chặn trước tạo request/socket");
  }
});
function transport(status: number, body = "ok", location?: string, hang = false) {
  let calls = 0;
  const request = ((_url: unknown, options: { lookup: (host: string, opts: object, cb: (err: unknown, ip: string, family: number) => void) => void }, cb: (res: unknown) => void) => {
    calls++;
    const req = new EventEmitter() as EventEmitter & { end(): void; destroy(err: Error): void };
    req.destroy = err => { queueMicrotask(() => req.emit("error", err)); };
    req.end = () => {
      options.lookup("host", {}, (err, ip) => {
        if (err) { req.emit("error", err); return; }
        assert.equal(ip, "93.184.216.34");
        if (hang) return;
        const res = new PassThrough();
        Object.assign(res, { statusCode: status, headers: { location } });
        cb(res); res.end(body);
      });
    };
    return req;
  }) as unknown as typeof httpsRequest;
  return { request, calls: () => calls };
}
test("rebinding: kiểm lại DNS lúc gửi và socket ghim IP đã kiểm", async () => {
  await assertPublicUrl("https://host", publicDns);
  const t = transport(200);
  await assert.rejects(safeRequest("https://host", {}, { ...t, resolve: async () => [{ address: "127.0.0.1", family: 4 }] }));
  assert.equal((await safeRequest("https://host", {}, { ...t, resolve: publicDns })).status, 200);
});
test("không theo redirect webhook", async () => {
  for (const location of ["https://127.0.0.1", "https://other.example"]) {
    const t = transport(302, "", location);
    await assert.rejects(safeRequest("https://host", {}, { ...t, resolve: publicDns }), /chuyển hướng/);
    assert.equal(t.calls(), 1);
  }
});
test("timeout và giới hạn kích thước phản hồi", async () => {
  await assert.rejects(safeRequest("https://host", {}, { ...transport(200, "", undefined, true), resolve: publicDns, timeoutMs: 10 }), /thời gian/);
  await assert.rejects(safeRequest("https://host", {}, { ...transport(200, "x".repeat(1_000_000)), resolve: publicDns }), /kích thước/);
});

test("socket lookup hỗ trợ Node autoSelectFamily (all:true) và ghim toàn bộ IP đã kiểm", async () => {
  const request = ((_url: unknown, options: { lookup: (host: string, opts: object, cb: (err: unknown, ips: unknown) => void) => void }, cb: (res: unknown) => void) => {
    const req = new EventEmitter() as EventEmitter & { end(): void };
    req.end = () => options.lookup("host", { all: true }, (err, ips) => {
      assert.equal(err, null); assert.deepEqual(ips, [{ address: "93.184.216.34", family: 4 }]);
      const res = new PassThrough(); Object.assign(res, { statusCode: 200, headers: {} }); cb(res); res.end("ok");
    });
    return req;
  }) as unknown as typeof httpsRequest;
  assert.equal((await safeRequest("https://host", {}, { request, resolve: publicDns, timeoutMs: 50 })).body, "ok");
});
