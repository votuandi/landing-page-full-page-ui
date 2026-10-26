import assert from "node:assert/strict";
import test from "node:test";
import { register } from "../../../instrumentation.ts";

test("web startup: single-site, multi-tenant, edge và build", () => {
  for (const env of [{ NEXT_RUNTIME: "nodejs" }, { NEXT_RUNTIME: "edge", MULTI_TENANT: "1" },
    { NEXT_RUNTIME: "nodejs", NEXT_PHASE: "phase-production-build", MULTI_TENANT: "1" }]) assert.doesNotThrow(() => register(env));
  let log = "";
  assert.throws(() => register({ NEXT_RUNTIME: "nodejs", MULTI_TENANT: "1" }, {
    exit: code => { throw new Error(`exit ${code}`); }, log: message => { log = message; },
  }), /exit 1/);
  assert.match(log, /DATABASE_URL/);
});
