import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NextResponse } from "next/server";
import { z } from "zod";
import ts from "typescript";

test("login completion, logout and password reset expire production session/challenge cookies with Secure and Path=/", async () => {
  const source = readFileSync(new URL("../app/actions.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const production of [true, false]) {
    const prefix = production ? "__Host-" : "";
    const options = { name: `${prefix}site_sid`, httpOnly: true, secure: production, sameSite: "lax", path: "/", maxAge: 3600 };
    for (const action of ["loginAction", "logoutAction", "resetPasswordAction"]) {
      const response = new NextResponse(null);
      const realm = { cookieOptions: () => options, logout: async () => {}, login: async () => ({ ok: true, cookie: { ...options, value: "session" }, session: {} }) };
      const imports: Record<string, unknown> = {
        zod: { z }, "next/headers": { cookies: async () => response.cookies }, "next/navigation": { redirect: () => {} },
        "../lib/action.ts": { action: (_permission: unknown, _schema: unknown, handler: unknown) => handler },
        "../lib/runtime.ts": { getRuntime: () => ({ realm }) },
        "../lib/auth.ts": { requestInfo: async () => ({}), setSessionCookie: async () => {} },
        "../lib/challenge.ts": {}, "../lib/accounts.ts": { createAccounts: () => ({ setPassword: async () => {} }) },
      };
      const actions: Record<string, (input: unknown, context: unknown) => Promise<unknown>> = {};
      new Function("require", "exports", "process", compiled)((name: string) => {
        assert.ok(name in imports, `Unexpected import ${name}`);
        return imports[name];
      }, actions, { env: { NODE_ENV: production ? "production" : "development" } });
      await actions[action]({ next: "password", confirm: "password" }, { tenantId: "a" });
      for (const name of action === "loginAction" ? [`${prefix}admin_challenge`] : [options.name, `${prefix}admin_challenge`]) {
        const cookie = response.cookies.get(name)!;
        assert.ok(cookie, `${action}: ${name}`);
        assert.equal(cookie.value, "");
        assert.equal(cookie.maxAge, 0);
        assert.equal(cookie.secure, production);
        assert.equal(cookie.httpOnly, true);
        assert.equal(cookie.path, "/");
        assert.equal(cookie.sameSite, name.endsWith("challenge") ? "strict" : "lax");
        assert.equal(cookie.domain, undefined);
      }
      const serialized = response.headers.get("set-cookie")!;
      assert.match(serialized, /Path=\//);
      if (production) assert.match(serialized, /; Secure/);
    }
  }
});
