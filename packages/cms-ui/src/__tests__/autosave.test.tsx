import { mount, byPath, type as typeInput, type Mounted } from "./dom.ts";
import assert from "node:assert/strict";
import { afterEach, test, mock } from "node:test";
import { act, useState } from "react";
import { useAutosave } from "../preview/useAutosave.ts";
import { SchemaForm, validate } from "../SchemaForm.tsx";
import { z } from "zod";

let mounted: Mounted | undefined;
afterEach(() => { mounted?.unmount(); mounted = undefined; mock.timers.reset(); });
type Result = { ok: true } | { ok: false; error: string; conflict?: boolean };
async function setup(save: (v: string) => Promise<Result> = async () => ({ ok: true })) {
  mock.timers.enable({ apis: ["setTimeout"] });
  let set!: (v: string) => void;
  let state!: ReturnType<typeof useAutosave<string>>;
  const calls: string[] = [];
  function Harness() {
    const [value, update] = useState("initial"); set = update;
    state = useAutosave(value, { save: v => { calls.push(v); return save(v); }, valid: v => v !== "invalid" });
    return null;
  }
  mounted = await mount(<Harness />);
  return { calls, state: () => state, set: async (v: string) => { await act(async () => set(v)); },
    tick: async (ms = 800) => { await act(async () => mock.timers.tick(ms)); } };
}
test("debounces to one save with latest value", async () => {
  const s = await setup();
  for (let i = 0; i < 5; i++) { await s.set(String(i)); await s.tick(100); }
  assert.equal(s.calls.length, 0); await s.tick(700);
  assert.deepEqual(s.calls, ["4"]); assert.equal(s.state().status, "saved");
});
test("serializes saves and keeps latest", async () => {
  const resolves: (() => void)[] = [];
  const s = await setup(() => new Promise(resolve => resolves.push(() => resolve({ ok: true }))));
  await s.set("one"); await s.tick(); await s.set("two"); await s.set("three"); await s.tick();
  assert.deepEqual(s.calls, ["one"]);
  await act(async () => resolves.shift()!()); await s.tick();
  assert.deepEqual(s.calls, ["one", "three"]);
  await act(async () => resolves.shift()!()); assert.equal(s.state().status, "saved");
});
test("does not save invalid value", async () => {
  const s = await setup(); await s.set("invalid"); await s.tick();
  assert.deepEqual(s.calls, []); assert.equal(s.state().status, "invalid"); assert.equal(s.state().dirty, true);
});
test("stops on conflict", async () => {
  const s = await setup(async () => ({ ok: false, error: "Conflict", conflict: true }));
  await s.set("one"); await s.tick(); await s.set("two"); await s.tick();
  assert.equal(s.calls.length, 1); assert.equal(s.state().status, "conflict"); assert.equal(s.state().dirty, true);
});
test("keeps dirty on error", async () => {
  const s = await setup(async () => ({ ok: false, error: "Offline" }));
  await s.set("one"); await s.tick(); assert.equal(s.state().status, "error"); assert.equal(s.state().dirty, true);
  await s.tick(10000); assert.equal(s.calls.length, 1);
});
test("no save when value returns to saved", async () => {
  const s = await setup(); await s.set("changed"); await s.set("initial"); await s.tick();
  assert.deepEqual(s.calls, []); assert.equal(s.state().status, "saved");
});
test("reverting during a save restores the original after the in-flight write", async () => {
  const resolves: (() => void)[] = [];
  const s = await setup(() => new Promise(resolve => resolves.push(() => resolve({ ok: true }))));
  await s.set("changed"); await s.tick(); await s.set("initial");
  assert.equal(s.state().dirty, true);
  await act(async () => resolves.shift()!()); await s.tick();
  assert.deepEqual(s.calls, ["changed", "initial"]);
  await act(async () => resolves.shift()!()); assert.equal(s.state().status, "saved");
});
test("unmount cancels debounce and never starts a queued save after completion", async () => {
  let finish!: () => void;
  const s = await setup(() => new Promise(resolve => { finish = () => resolve({ ok: true }); }));
  await s.set("one"); await s.tick(); await s.set("two");
  mounted!.unmount(); mounted = undefined;
  await act(async () => finish()); await s.tick(10000); assert.deepEqual(s.calls, ["one"]);
});
test("flush saves immediately, thrown errors stay dirty", async () => {
  const s = await setup(async () => { throw new Error("private"); });
  await s.set("changed"); await act(async () => s.state().flush());
  assert.deepEqual(s.calls, ["changed"]); assert.equal(s.state().status, "error"); assert.equal(s.state().dirty, true);
});
test("synchronous saver throws release the queue and allow retry", async () => {
  let attempt = 0;
  const s = await setup(() => { if (attempt++ === 0) throw new Error("sync failure"); return Promise.resolve({ ok: true }); });
  await s.set("changed"); await s.tick(); assert.equal(s.state().status, "error");
  await act(async () => s.state().flush()); assert.equal(s.state().status, "saved"); assert.equal(s.calls.length, 2);
});
test("raw invalid numeric input blocks autosave and stays dirty until corrected", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const schema = z.object({ amount: z.number() }), calls: unknown[] = [];
  let status!: ReturnType<typeof useAutosave>;
  function Form() {
    const [value, setValue] = useState({ amount: 1 }), [valid, setValid] = useState(true);
    status = useAutosave(value, { valid: v => valid && validate(schema, v).success, save: async v => { calls.push(v); return { ok: true }; } });
    return <SchemaForm schema={schema} value={value} onChange={setValue} onValidityChange={setValid} />;
  }
  mounted = await mount(<Form />);
  const input = byPath<HTMLInputElement>(mounted.container, "amount");
  await typeInput(input, "bad"); assert.equal(status.status, "invalid"); assert.equal(status.dirty, true);
  await typeInput(input, "2"); await typeInput(input, "bad");
  await act(async () => mock.timers.tick(1000)); assert.deepEqual(calls, []);
  await typeInput(input, "2"); await act(async () => mock.timers.tick(800));
  assert.deepEqual(calls, [{ amount: 2 }]); assert.equal(status.status, "saved");
});
