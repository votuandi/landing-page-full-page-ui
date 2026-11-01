import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSenderHostname, senderFrom, mapResendStatus, createResendDomain, getResendDomain, verifyResendDomain, deleteResendDomain } from "../senderDomains.ts";
import { ChannelError } from "../errors.ts";

const env = { RESEND_DOMAINS_API_KEY: "secret-key" };
const id = "00000000-0000-4000-8000-000000000001";
const domain = { id, name: "mail.congty.vn", status: "pending", records: [{ record: "DKIM", name: "resend._domainkey", type: "TXT", value: "public-key", ttl: "Auto", status: "pending" }, { record: "SPF", name: "send", type: "MX", value: "feedback.example", priority: 10 }] };

test("normalize: hostname, IP, reserved, IDN và chuỗi không hợp lệ", () => {
  assert.equal(normalizeSenderHostname(" Mail.CongTy.VN. ", []), "mail.congty.vn");
  assert.match(normalizeSenderHostname("điện.vn", []), /^xn--[a-z0-9-]+\.vn$/);
  for (const value of ["", "a".repeat(254), "a..b", "-a.vn", "a-.vn", "localhost", "127.0.0.1", "[::1]", "https://a.vn", "a.vn:443", "a.vn/path", "a@b.vn", "a_b.vn", "a.vn\nBcc:x", "a.vn?x", "a.vn..", "1.2.3.999"]) {
    assert.throws(() => normalizeSenderHostname(value, []), ChannelError, value);
  }
  for (const value of ["platform.vn", "x.platform.vn", "mail.platform.vn", "x.mail.system.vn"]) {
    assert.throws(() => normalizeSenderHostname(value, ["platform.vn", "mail.system.vn"]), ChannelError);
  }
  assert.equal(normalizeSenderHostname("notplatform.vn", ["platform.vn"]), "notplatform.vn");
});

test("senderFrom: tên đã lọc không chèn header, emoji, rỗng và giới hạn 78 ký tự", () => {
  assert.equal(senderFrom('"Solar" <VN>\\\r\nBcc:', "mail.vn"), '"Solar VNBcc:" <no-reply@mail.vn>');
  assert.equal(senderFrom('"<>\\\u0000', "mail.vn"), "no-reply@mail.vn");
  assert.equal(senderFrom("", "mail.vn"), "no-reply@mail.vn");
  assert.equal(senderFrom("🌞".repeat(100), "mail.vn"), `"${"🌞".repeat(78)}" <no-reply@mail.vn>`);
});

test("mapResendStatus fail-closed", () => {
  for (const value of ["pending", "not_started", "temporary_failure", "VERIFIED", "unknown", undefined]) assert.equal(mapResendStatus(value), "pending");
  assert.equal(mapResendStatus("verified"), "verified"); assert.equal(mapResendStatus("failed"), "failed");
});

test("Resend domains: endpoint, auth, không đặt tracking, DNS priority, verify và delete 404", async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  const fetcher = (async (url, init) => { requests.push({ url: String(url), init }); return Response.json(domain); }) as typeof fetch;
  assert.deepEqual((await createResendDomain("mail.congty.vn", env, fetcher)).records[1], domain.records[1]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.resend.com/domains");
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { name: "mail.congty.vn" });
  assert.equal(new Headers(requests[0].init?.headers).get("Authorization"), "Bearer secret-key");
  assert.equal(requests[0].init?.redirect, "error"); assert.ok(requests[0].init?.signal);
  await getResendDomain(id, env, fetcher); await verifyResendDomain(id, env, fetcher);
  assert.equal(requests[2].url, `https://api.resend.com/domains/${id}/verify`);
  assert.equal(requests[2].init?.method, "POST");
  await deleteResendDomain(id, env, (async () => new Response(null, { status: 404 })) as typeof fetch);
});

test("Resend sai dạng/lỗi mạng: thông báo chung, không lộ URL/khóa/body", async () => {
  for (const fetcher of [async () => Response.json({ ...domain, records: [{ type: "TXT" }] }), async () => Response.json({ ...domain, status: {} }),
    async () => new Response("secret-key api.resend.com", { status: 403 }), async () => { throw new Error("secret-key api.resend.com"); }]) {
    await assert.rejects(getResendDomain(id, env, fetcher as typeof fetch), error => error instanceof ChannelError && !/secret-key|api.resend.com/.test(error.message));
  }
  await assert.rejects(createResendDomain("mail.vn", {}, fetch), /chưa cấu hình/);
});
