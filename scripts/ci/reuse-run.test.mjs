import assert from "node:assert/strict";
import test from "node:test";
import { docsOnly, reusable } from "./reuse-run.mjs";

const green = [{ status: "completed", conclusion: "success" }];
const base = { action: "synchronize", ancestor: true, files: ["roadmap/epics/E12-builder.md"], runs: green };

test("push chỉ đổi *.md sau lần chạy xanh của cùng workflow → dùng lại", () => {
  assert.equal(reusable(base), true);
  assert.equal(reusable({ ...base, files: ["README.md", "packages/ui/README.md", ".agents/skills/x/SKILL.md"] }), true);
});

test("có file không phải *.md (kể cả json/yml trong roadmap) → chạy lại", () => {
  for (const files of [["roadmap/story-history.json"], ["roadmap/a.md", "apps/web/src/x.ts"], [".github/workflows/visual.yml"], []]) {
    assert.equal(reusable({ ...base, files }), false, files.join(","));
  }
  assert.equal(docsOnly([]), false);
});

test("*.md là đầu vào của kiểm tra CI (plans:table, ERD) → chạy lại", () => {
  for (const file of ["roadmap/README.md", "packages/db/ERD.md"]) {
    assert.equal(reusable({ ...base, files: ["roadmap/epics/E12-builder.md", file] }), false, file);
  }
});

test("PR có nhãn regression → luôn chạy đủ", () => {
  assert.equal(reusable({ ...base, regression: true }), false);
});

test("lần chạy trước chưa xong, đỏ, bị hủy hoặc không có → chạy lại", () => {
  for (const runs of [[], [{ status: "in_progress", conclusion: "" }], [{ status: "completed", conclusion: "failure" }],
    [{ status: "completed", conclusion: "cancelled" }], [{ status: "completed", conclusion: "skipped" }]]) {
    assert.equal(reusable({ ...base, runs }), false, JSON.stringify(runs));
  }
});

test("không phải push thêm vào PR (mở PR, gắn nhãn, dispatch) hoặc force-push → chạy lại", () => {
  for (const action of ["opened", "reopened", "labeled", ""]) assert.equal(reusable({ ...base, action }), false, action);
  assert.equal(reusable({ ...base, ancestor: false }), false);
});
