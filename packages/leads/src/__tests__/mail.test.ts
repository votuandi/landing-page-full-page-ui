import assert from "node:assert/strict";
import test from "node:test";
import { ChannelError } from "../errors.ts";
import { sendMail } from "../mail.ts";
import { authMail, notifyMail } from "../mailTemplates.ts";

const env = { RESEND_API_KEY: "secret", MAIL_FROM: "Solar <mail@example.vn>" };
const mail = { to: "owner@example.vn", ...authMail("invite", "http://site.localhost:3300/moi?token=secret") };

test("retry repeats identical request with key, timeout and no redirects", async () => {
  const calls: { body: string; key: string | null }[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options?.redirect, "error");
    assert.ok(options?.signal instanceof AbortSignal);
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer secret");
    calls.push({ body: String(options?.body), key: new Headers(options?.headers).get("Idempotency-Key") });
    return new Response("{}", { status: 200 });
  };
  await sendMail(mail, "auth:token-id", env, fetcher);
  await sendMail(mail, "auth:token-id", env, fetcher);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0].key, "auth:token-id");
  const body = JSON.parse(calls[0].body);
  assert.equal(body.from, env.MAIL_FROM);
  assert.match(body.text, /site.localhost:3300/);
  assert.match(body.html, /http:\/\/site.localhost:3300\/moi\?token=secret/);
});

test("never leaks url in errors including timeout and response cancellation", async () => {
  for (const fetcher of [
    async () => { throw Error("https://private/?token=secret"); },
    async () => { throw new DOMException("secret", "TimeoutError"); },
    async () => new Response(new ReadableStream({ cancel() { throw Error("secret"); } })),
  ] satisfies (typeof fetch)[]) {
    await assert.rejects(sendMail(mail, "key", env, fetcher), error => {
      assert.ok(error instanceof ChannelError);
      assert.equal(error.permanent, false);
      assert.doesNotMatch(error.message, /secret|private|https:/);
      return true;
    });
  }
});

test("maps provider status and missing env", async () => {
  for (const status of [200, 400, 401, 408, 409, 429, 500]) {
    const send = () => sendMail(mail, "key", env, async () => new Response("secret-provider-body", { status }));
    if (status === 200) await send();
    else await assert.rejects(send(), error => error instanceof ChannelError && error.permanent === [400, 401, 409].includes(status) && !error.message.includes("secret"));
  }
  for (const missing of [{}, { MAIL_FROM: env.MAIL_FROM }, { RESEND_API_KEY: "secret" }]) {
    await assert.rejects(sendMail(mail, "key", missing, async () => { assert.fail("must not send"); }), error => error instanceof ChannelError && !error.permanent);
  }
});

test("notification templates use Vietnamese and Vietnam date, unknown kind is null", () => {
  const expiry = "2040-01-15T20:30:00.000Z";
  const renewal = notifyMail("renewal", { days: 7, expiresAt: expiry }, "Solar")!;
  assert.match(renewal.text, /7 ngày/);
  assert.match(renewal.text, /16\/01\/2040/);
  assert.match(renewal.text, /03:30/);
  assert.match(notifyMail("plan-changed", { from: "pro", to: "basic" }, "Solar")!.text, /pro.*basic/);
  assert.match(notifyMail("suspended", { expiresAt: expiry }, "Solar")!.text, /tạm khóa/);
  assert.match(notifyMail("domain-warning", { hostname: "site.vn", reason: "Thiếu DNS" }, "Solar")!.text, /site.vn[\s\S]*Thiếu DNS/);
  assert.equal(notifyMail("unknown", {}, "Solar"), null);
});

test("escapes html and subject without changing plaintext url", () => {
  const url = 'https://site.vn/moi?token="<>&';
  const auth = authMail("invite", url);
  assert.ok(auth.text.includes(url));
  assert.ok(auth.html.includes("&quot;&lt;&gt;&amp;"));
  assert.doesNotMatch(auth.html, /"<>&/);
  const notice = notifyMail("domain-warning", { hostname: "site.vn", reason: "<script>&" }, "<script>\r\nInjected")!;
  assert.doesNotMatch(notice.subject, /[\r\n]/);
  assert.doesNotMatch(notice.html, /<script>/);
  assert.match(notice.html, /&lt;script&gt;/);
});
