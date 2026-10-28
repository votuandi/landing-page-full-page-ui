import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { register } from "../instrumentation.ts";

// Next only inlines the literal `process.env.NEXT_RUNTIME`; the gate must read it, not the injected env.
function withRuntime(runtime: string | undefined, phase: string | undefined, run: () => void) {
  const before = { NEXT_RUNTIME: process.env.NEXT_RUNTIME, NEXT_PHASE: process.env.NEXT_PHASE };
  const set = (key: keyof typeof before, value: string | undefined) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; };
  set("NEXT_RUNTIME", runtime); set("NEXT_PHASE", phase);
  try { run(); } finally { set("NEXT_RUNTIME", before.NEXT_RUNTIME); set("NEXT_PHASE", before.NEXT_PHASE); }
}

test("register thoát khi env sai", () => withRuntime("nodejs", undefined, () => {
  const messages: string[] = [];
  assert.throws(() => register({}, {
    exit: code => { throw new Error(`exit ${code}`); }, log: message => messages.push(message),
  }), /exit 1/);
  assert.match(messages.join("\n"), /DATABASE_URL/);
}));
test("register bỏ qua edge và build", () => {
  withRuntime("edge", undefined, () => assert.doesNotThrow(() => register({})));
  withRuntime("nodejs", "phase-production-build", () => assert.doesNotThrow(() => register({})));
});
test("register đọc nguyên văn process.env.NEXT_RUNTIME (Next chỉ inline chuỗi này)", () => {
  const source = readFileSync(new URL("../instrumentation.ts", import.meta.url), "utf8");
  assert.match(source, /process\.env\.NEXT_RUNTIME === "nodejs"/);
  assert.doesNotMatch(source, /(?<!process\.)env\.NEXT_(RUNTIME|PHASE)/);
});
