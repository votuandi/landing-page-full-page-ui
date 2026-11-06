import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { withCoverage } from './coverage.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const helper = fileURLToPath(new URL('./coverage.mjs', import.meta.url));

test('không khớp --test-concurrency', () => {
  const command = withCoverage('node --test-concurrency=2 --test a.js', 70, ['src/**']);
  assert.match(command, /--test-concurrency=2 --test --experimental-test-coverage/);
  assert.match(command, /--test-coverage-lines=70/);
  assert.match(command, /--test-coverage-include="src\/\*\*"/);
  assert.match(command, /--test-coverage-exclude="\*\*\/__tests__\/\*\*"/);
  assert.match(command, /--test-coverage-exclude="\*\*\/\*\.test\.\*"/);
});
test('chỉ đổi đoạn node --test', () => {
  assert.ok(withCoverage('tsc -p tsconfig.test.json && node --test x', 70, ['src/**']).startsWith('tsc -p tsconfig.test.json && node --test --experimental-test-coverage'));
});
test('chèn mọi --test', () => {
  assert.equal(withCoverage('node --test a && node --test b', 70, ['src/**']).match(/--test-coverage-lines=70/g).length, 2);
});
test('không có --test thì lỗi', () => {
  assert.throws(() => withCoverage('node scripts/test.mjs', 70, ['src/**']), /không tìm thấy node --test/);
});
test('tham số sai thì lỗi', () => {
  for (const threshold of ['abc', 0, 101, NaN, '', Infinity]) {
    assert.throws(() => withCoverage('node --test x', threshold, ['src/**']), /usage/i);
  }
  assert.throws(() => withCoverage('node --test x', 70, []), /usage/i);
});

test('fixture dưới ngưỡng thì exit khác 0; include chỉ tính nguồn package', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'solar coverage space '));
  try {
    mkdirSync(join(cwd, 'source space'));
    writeFileSync(join(cwd, 'source space/logic.mjs'), 'export function choose(value) {\n  if (value) {\n    return 1;\n  }\n  return 2;\n}\nchoose(true);\n');
    writeFileSync(join(cwd, 'outside.mjs'), 'export const outside = 1;\n');
    writeFileSync(join(cwd, 'fixture.test.mjs'), 'import "./source space/logic.mjs";\nimport "./outside.mjs";\n');
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { test: 'node --test fixture.test.mjs' } }));
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const run = (threshold, extra = []) => spawnSync(process.execPath, [helper, String(threshold), 'source space/**', ...extra], { cwd, env, encoding: 'utf8' });
    const high = run(90);
    assert.notEqual(high.status, 0, high.stdout + high.stderr);
    assert.match(high.stdout + high.stderr, /coverage.*threshold|threshold.*coverage/i);
    const low = run(10);
    assert.equal(low.status, 0, low.stdout + low.stderr);
    assert.match(low.stdout, /logic.mjs/);
    assert.doesNotMatch(low.stdout, /outside.mjs|fixture.test.mjs\s*\|/);
    assert.equal(run(10, ['--', 'node --test fixture.test.mjs']).status, 0);
    assert.equal(run(10, ['--', 'node --test fixture.test.mjs && node -e "process.exit(7)"']).status, 7);
    assert.notEqual(run(10, ['--', 'node -e "process.exit(0)"']).status, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

const packages = () => readdirSync(join(root, 'packages'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => JSON.parse(readFileSync(join(root, 'packages', entry.name, 'package.json'), 'utf8')));
test('mọi package trong packages/* có test thì có test:coverage', () => {
  for (const pkg of packages()) {
    if (pkg.scripts?.test) assert.ok(pkg.scripts['test:coverage'], `${pkg.name} thiếu test:coverage`);
  }
});
test('TESTING.md liệt kê mọi package có test:coverage', () => {
  const documentation = readFileSync(join(root, 'TESTING.md'), 'utf8');
  for (const pkg of packages()) {
    if (pkg.scripts?.['test:coverage']) assert.ok(documentation.includes(pkg.name), `${pkg.name} thiếu trong TESTING.md`);
  }
});

test('cache coverage được invalidated khi helper đổi', () => {
  const { tasks } = JSON.parse(readFileSync(join(root, 'turbo.json'), 'utf8'));
  assert.ok(tasks['test:coverage'].inputs?.includes('$TURBO_ROOT$/scripts/ci/coverage.mjs'));
});
