import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
test("locale event during hydration is handled before passive effects (no lost first click)", () => {
  const source = readFileSync(resolve("src/i18n/LangProvider.tsx"), "utf8");
  const passive: (() => unknown)[] = [], layout: (() => unknown)[] = [];
  const listeners = new Set<(locale: string) => void>();
  const document = { cookie: "", documentElement: { lang: "vi" } };
  let reloads = 0;
  const compiled = { exports: {} as { LangProvider: (props: object) => unknown } };
  const react = { createContext: () => ({ Provider: "provider" }), useContext() {}, useState: (value: unknown) => [value, () => {}],
    useCallback: (fn: unknown) => fn, useMemo: (fn: () => unknown) => fn(), useEffect: (fn: () => unknown) => passive.push(fn), useLayoutEffect: (fn: () => unknown) => layout.push(fn) };
  const mocks: Record<string, unknown> = { react,
    "@/config/site.config": { siteConfig: { i18n: { enabled: true, defaultLang: "vi" } } },
    "@/i18n/text": { pickText: (value: unknown) => value },
    "@solar/sections": { onSetSiteLocale: (handler: (locale: string) => void) => { listeners.add(handler); return () => listeners.delete(handler); } },
  };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module: compiled, exports: compiled.exports, require: (name: string) => mocks[name] ?? require(name), document,
    localStorage: { setItem() {} }, window: { location: { reload: () => reloads++ } },
  });
  compiled.exports.LangProvider({ children: null, defaultLocale: "vi", locales: ["vi", "en"], serverLocale: true });
  const cleanups = layout.map(effect => effect());
  // React can replay the header's click after commit but before passive useEffect listeners run.
  listeners.forEach(handler => handler("en"));
  assert.equal(reloads, 1);
  assert.match(document.cookie, /^solar-locale=en;/);
  passive.forEach(effect => effect());
  assert.equal(listeners.size, 1);
  cleanups.forEach(cleanup => { if (typeof cleanup === "function") cleanup(); });
  assert.equal(listeners.size, 0);
});
