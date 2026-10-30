import assert from "node:assert/strict";
import test from "node:test";
import { intendedFrom, judge } from "./visual-intended.mjs";

const diff = "Screenshot comparison failed:\n\n  2120 pixels (ratio 0.01 of all image pixels) are different.";
const report = (tests) => ({ suites: [{ specs: tests.map(([title, status, message]) => ({ title, tests: [{ status, results: [{ errors: message ? [{ message }] : [] }] }] })) }] });

test("PR body: one `Visual intended:` line, comma separated, case and spacing tolerant", () => {
  assert.deepEqual(intendedFrom("## Story\n\nvisual intended:  lead-form, calculator ,/lien-he\n"), ["lead-form", "calculator", "/lien-he"]);
  assert.deepEqual(intendedFrom("no declaration"), []);
  assert.deepEqual(intendedFrom(undefined), []);
});

test("only declared screenshot diffs pass: section type prefix or exact route", () => {
  const intended = ["lead-form", "/lien-he"];
  assert.equal(judge(report([["lead-form/t01", "unexpected", diff], ["/lien-he", "unexpected", diff], ["hero/t01", "expected"]]), intended).ok, true);
  // Prefix must be a whole section type: `lead-form-x/t01` is not `lead-form`.
  assert.equal(judge(report([["lead-form-x/t01", "unexpected", diff]]), intended).ok, false);
  // Route match is exact: a subpage is not declared by its parent.
  assert.equal(judge(report([["/lien-he/khac", "unexpected", diff]]), intended).ok, false);
});

test("a declared cell failing for another reason (timeout, contrast, off-token) still fails", () => {
  const result = judge(report([["lead-form/t01", "unexpected", "Test timeout of 60000ms exceeded."]]), ["lead-form"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.unintended, ["lead-form/t01"]);
});

test("nothing declared, or no failure at all", () => {
  assert.equal(judge(report([["lead-form/t01", "unexpected", diff]]), []).ok, false);
  assert.equal(judge(report([["lead-form/t01", "flaky", diff], ["hero/t01", "expected"]]), []).ok, true);
});
