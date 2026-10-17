import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

test("unhydrated SSR animates finitely without changing React attributes, polling or timers", () => {
  const source = readFileSync(resolve("../../packages/ui/src/SectionReveal.tsx"), "utf8");
  let callback!: (entries: object[]) => void;
  let cleanup: (() => void) | undefined;
  let writes = 0, canceled = 0, disconnected = 0;
  let motionChanged!: () => void;
  const media = { matches: false, addEventListener: (_name: string, handler: () => void) => { motionChanged = handler; }, removeEventListener() {} };
  const played: { frames: unknown; options: KeyframeAnimationOptions }[] = [];
  const element = { isConnected: true, dataset: { reveal: "up" }, parentElement: null,
    setAttribute() { writes++; }, removeAttribute() { writes++; },
    animate(frames: unknown, options: KeyframeAnimationOptions) { played.push({ frames, options }); return { cancel() { canceled++; } }; } };
  const compiled = { exports: {} as { SectionReveal: () => void } };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module: compiled, exports: compiled.exports, require: () => ({ useEffect: (effect: () => () => void) => { cleanup = effect(); } }),
    window: { matchMedia: () => media, setTimeout: () => 1 },
    HTMLElement: class { animate() {} },
    requestAnimationFrame: () => assert.fail("never poll React hydration"), cancelAnimationFrame() {}, clearTimeout() {},
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    document: { head: { appendChild: (value: unknown) => value }, createElement: () => ({ sheet: { cssRules: [], insertRule() {} } }), body: {},
      querySelectorAll: (selector: string) => selector === "[data-reveal-stagger]" ? [] : [element] },
    IntersectionObserver: class { constructor(fn: typeof callback) { callback = fn; } observe() {} unobserve() {} disconnect() { disconnected++; } },
    MutationObserver: class { observe() {} disconnect() {} },
  });
  compiled.exports.SectionReveal();
  const entering = { target: element, isIntersecting: true };
  callback([entering, entering]);
  assert.equal(played.length, 1);
  assert.equal(played[0].options.duration, 900);
  assert.equal(played[0].options.iterations ?? 1, 1);
  assert.equal(played[0].options.fill, "backwards", "SSR/base CSS takes over after the finite animation");
  callback([{ target: element, isIntersecting: false, rootBounds: { bottom: 900 }, boundingClientRect: { top: 1000 } }]);
  callback([entering]);
  assert.equal(played.length, 2, "scrolling back from below replays reveal");
  assert.equal(writes, 0, "React's SSR attributes are never mutated, even without a fiber");
  media.matches = true;
  motionChanged();
  assert.equal(canceled, 2, "switching to reduced motion cancels running animations");
  cleanup?.();
  assert.equal(canceled, 2);
  assert.equal(disconnected, 1);
});
