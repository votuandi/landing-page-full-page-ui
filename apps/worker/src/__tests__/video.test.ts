import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { spawn } from "node:child_process";
import { probeVideo, posterFrame, runVideoTool, InvalidVideoError } from "../video.ts";

test("spawn args: no shell; file paths stay one argument; probe rejects missing/invalid streams", async () => {
  const path = "/tmp/server path;$(bad)/input";
  const calls: string[][] = [];
  const runner = async (_command: string, args: string[]) => {
    calls.push(args);
    return Buffer.from(JSON.stringify({ format: { duration: "2.4" }, streams: [{ codec_type: "video", width: 720, height: 1280 }] }));
  };
  assert.deepEqual(await probeVideo(path, runner), { duration: 2.4, width: 720, height: 1280 });
  await posterFrame(path, 1, runner);
  assert.ok(calls.every(args => args.includes(path))); assert.ok(calls[1].includes("image2pipe"));
  for (const data of ["broken", {}, { format: { duration: "2" }, streams: [{ codec_type: "audio" }] },
    ...["NaN", "Infinity", "0", "-1"].map(duration => ({ format: { duration }, streams: [{ codec_type: "video", width: 720, height: 1280 }] })),
    { format: { duration: "2" }, streams: [{ codec_type: "video", width: 10000, height: 10000 }] }]) {
    await assert.rejects(probeVideo(path, async () => Buffer.from(JSON.stringify(data))), InvalidVideoError);
  }
});

test("ffmpeg timeout kills process, stdout bounded, ENOENT retries", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const mode of ["timeout", "overflow", "missing", "exit", "ok"]) {
    let killed = false;
    const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), kill: (signal: string) => {
      assert.equal(signal, "SIGKILL"); killed = true; queueMicrotask(() => child.emit("close", null)); return true;
    } });
    const spawnFake = ((_cmd: string, args: string[], options: { shell?: boolean }) => {
      assert.deepEqual(args, ["safe path"]); assert.equal(options.shell, false); return child;
    }) as unknown as typeof spawn;
    const running = runVideoTool("ffmpeg", ["safe path"], { spawn: spawnFake });
    const checked = mode === "ok" ? running.then(bytes => assert.equal(bytes.toString(), "png"))
      : assert.rejects(running, mode === "missing" ? { code: "ENOENT" } : InvalidVideoError);
    if (mode === "timeout") t.mock.timers.tick(60_001);
    if (mode === "overflow") child.stdout.emit("data", Buffer.alloc(50 * 1024 * 1024 + 1));
    if (mode === "missing") child.emit("error", Object.assign(Error("missing"), { code: "ENOENT" }));
    if (mode === "exit") child.emit("close", 1);
    if (mode === "ok") { child.stdout.emit("data", Buffer.from("png")); child.emit("close", 0); }
    await checked; assert.equal(killed, mode === "timeout" || mode === "overflow");
  }
});
