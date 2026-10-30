import assert from "node:assert/strict";
import test from "node:test";
import { intendedFrom, judge } from "./visual-intended.mjs";

const diff = "Error: expect(locator).toHaveScreenshot(expected) failed\n\n  Expected an image 1440px by 1223px, received 1440px by 1251px. 47180 pixels (ratio 0.03 of all image pixels) are different.";
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

test("nothing declared keeps real diffs red; a flaky test is not a failure", () => {
  assert.equal(judge(report([["lead-form/t01", "unexpected", diff]]), []).ok, false);
  assert.equal(judge(report([["lead-form/t01", "unexpected", diff], ["hero/t01", "flaky", diff]]), ["lead-form"]).ok, true);
});

// Called only after Playwright exited non-zero: "no failed test" then means the run itself broke (build, webServer, stale report).
test("fail closed: a run with no declared diff to explain the failure stays red", () => {
  assert.equal(judge({ suites: [] }, ["lead-form"]).ok, false);
  assert.equal(judge(report([["hero/t01", "expected"]]), ["lead-form"]).ok, false);
  const broken = { ...report([["lead-form/t01", "unexpected", diff]]), errors: [{ message: "Timed out waiting 60000ms from config.webServer." }] };
  assert.equal(judge(broken, ["lead-form"]).ok, false);
});

test("a size-only mismatch is a screenshot diff too (real message of calculator/t12--t10.png)", () => {
  const size = "Error: expect(locator).toHaveScreenshot(expected) failed\n\n  Expected an image 1440px by 1221px, received 1440px by 1249px. \n\n  Snapshot: calculator/t12--t10.png";
  assert.equal(judge(report([["calculator/t10", "unexpected", size]]), ["calculator"]).ok, true);
});

test("toHaveScreenshot failures that are not a pixel diff stay red", () => {
  const unstable = "Error: expect(page).toHaveScreenshot(expected) failed\n\n  Timeout: 15000ms\n  Failed to take two consecutive stable screenshots.";
  assert.equal(judge(report([["lead-form/t01", "unexpected", unstable]]), ["lead-form"]).ok, false);
  const colored = diff.replace("47180 pixels", "\u001b[31m47180 pixels\u001b[39m");
  assert.equal(judge(report([["lead-form/t01", "unexpected", colored]]), ["lead-form"]).ok, true);
});
