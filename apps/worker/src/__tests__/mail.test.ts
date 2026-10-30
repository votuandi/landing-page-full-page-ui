import assert from "node:assert/strict";
import test from "node:test";
import { ChannelError, sendMail } from "@solar/leads";
import type { OutboxJob } from "@solar/db";
import { createMailSend } from "../handlers/mail.ts";
import { PermanentError } from "../loop.ts";

const createdAt = new Date("2040-01-01T00:00:00Z");
const job = (template = "invite"): OutboxJob => ({
  id: "job", tenantId: null, topic: "mail.send", attempts: 1, createdAt, runAt: createdAt,
  idempotencyKey: "auth:token-id", payload: { to: "member@example.vn", template, url: "http://solar.localhost:3300/moi?token=private-token" },
});

test("sends each auth template and accepts payload written by accounts", async () => {
  for (const template of ["invite", "reset_password", "magic_link"]) {
    const requests: string[] = [];
    const send = createMailSend({ now: () => createdAt.getTime(), send: (mail, key) => sendMail(mail, key,
      { MAIL_FROM: "mail@example.vn", RESEND_API_KEY: "test" }, async (_url, options) => {
        assert.equal(new Headers(options?.headers).get("Idempotency-Key"), "auth:token-id");
        const body = JSON.parse(String(options?.body));
        assert.equal(body.to, "member@example.vn");
        assert.match(body.text, /http:\/\/solar.localhost:3300\/moi\?token=private-token/);
        assert.match(body.html, /http:\/\/solar.localhost:3300\/moi\?token=private-token/);
        requests.push(String(options?.body));
        return new Response(null, { status: 200 });
      }) });
    await send(job(template));
    await send({ ...job(template), attempts: 2 });
    assert.equal(requests.length, 2);
    assert.equal(requests[0], requests[1], "retry repeats identical request");
  }
});

test("rejects invalid payload without reflecting values or calling sender", async () => {
  const handle = createMailSend({ send: async () => { assert.fail("invalid payload reached sender"); } });
  for (const payload of [null, {}, { to: "private", template: "invite", url: "https://solar.vn" },
    { to: "member@example.vn", template: "unknown-private", url: "https://solar.vn" },
    { to: "member@example.vn", template: "invite", url: "javascript:private" },
    { to: "member@example.vn", template: "invite", url: "file:///private" },
    { to: "member@example.vn", template: "invite", url: "garbage-private" },
    { to: "member@example.vn", template: "invite" }]) {
    await assert.rejects(handle({ ...job(), payload }), error => error instanceof PermanentError && !/private|member@/.test(error.message));
  }
});

test("skips expired link: exact TTL sends, one millisecond later skips, all auth purposes", async () => {
  for (const [template, ttl] of [["invite", 72 * 3600_000], ["reset_password", 3600_000], ["magic_link", 900_000]] as const) {
    let sends = 0, now = createdAt.getTime() + ttl;
    const handle = createMailSend({ now: () => now, send: async () => { sends++; } });
    await handle(job(template));
    assert.equal(sends, 1);
    now++;
    await handle(job(template));
    assert.equal(sends, 1);
  }
});

test("maps provider status permanent to dead and transient or missing env to retry", async () => {
  for (const permanent of [false, true]) {
    const error = new ChannelError("Email: dịch vụ trả mã 400", permanent);
    const handle = createMailSend({ now: () => createdAt.getTime(), send: async () => { throw error; } });
    await assert.rejects(handle(job()), received => permanent ? received instanceof PermanentError : received === error);
  }
});
