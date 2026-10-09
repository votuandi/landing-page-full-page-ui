import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../", import.meta.url));
const workflows = join(root, ".github", "workflows");

function workspacePackages() {
  return ["apps", "packages", "tooling"].flatMap((dir) =>
    existsSync(join(root, dir))
      ? readdirSync(join(root, dir))
          .map((name) => join(root, dir, name, "package.json"))
          .filter(existsSync)
          .map((file) => JSON.parse(readFileSync(file, "utf8")))
      : [],
  );
}

test("PR chỉ sửa packages/core không build package không phụ thuộc core (vd. apps/admin)", () => {
  const pkgs = workspacePackages();
  const deps = (pkg) => Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  // Tập dependents của @solar/core: cùng tập mà `--filter=...[origin/<base>]` chọn khi chỉ packages/core đổi.
  const dependents = new Set(["@solar/core"]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const pkg of pkgs) {
      if (dependents.has(pkg.name) || !deps(pkg).some((d) => dependents.has(d))) continue;
      dependents.add(pkg.name);
      grew = true;
    }
  }
  const unrelated = pkgs.map((p) => p.name).filter((n) => !dependents.has(n) && n !== "@solar/config");
  assert.ok(unrelated.length > 0, "cần ít nhất một package không phụ thuộc core để kiểm");

  const turbo = createRequire(join(root, "package.json")).resolve("turbo/bin/turbo");
  const result = spawnSync(process.execPath, [turbo, "run", "build", "--filter=...@solar/core", "--dry=json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  const built = new Set(JSON.parse(result.stdout).tasks.map((t) => t.package));

  for (const name of dependents) assert.ok(built.has(name), `${name} phải build`);
  for (const name of unrelated) assert.ok(!built.has(name), `${name} không được build`);
});

test("workspace.yml: PR chạy theo package bị ảnh hưởng, có cache Turborepo", () => {
  const yml = readFileSync(join(workflows, "workspace.yml"), "utf8");
  assert.match(yml, /fetch-depth: 0/);
  assert.match(yml, /--filter=\.\.\.\[origin\/\{0\}\]', github\.base_ref/);
  assert.match(yml, /path: \.turbo\/cache/);
  assert.match(yml, /TURBO_TOKEN: \$\{\{ secrets\.TURBO_TOKEN \}\}/);
  assert.match(yml, /TURBO_TEAM: \$\{\{ vars\.TURBO_TEAM \}\}/);
});

test("không còn workflow trigger theo branch template cũ", () => {
  for (const file of readdirSync(workflows)) {
    assert.doesNotMatch(readFileSync(join(workflows, file), "utf8"), /template-\d+|\bminwy\b|yarn/, file);
  }
});
