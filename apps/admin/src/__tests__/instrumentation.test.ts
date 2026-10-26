import assert from "node:assert/strict";
import test from "node:test";
import { register } from "../instrumentation.ts";

test("register thoát khi env sai", () => {
  const messages: string[] = [];
  assert.throws(() => register({ NEXT_RUNTIME: "nodejs" }, {
    exit: code => { throw new Error(`exit ${code}`); }, log: message => messages.push(message),
  }), /exit 1/);
  assert.match(messages.join("\n"), /DATABASE_URL/);
});
test("register bỏ qua edge và build", () => {
  for (const env of [{ NEXT_RUNTIME: "edge" }, { NEXT_RUNTIME: "nodejs", NEXT_PHASE: "phase-production-build" }])
    assert.doesNotThrow(() => register(env));
});
