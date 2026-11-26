import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkDocs, docFiles } from './docs-check.mjs';

function fixture(t, markdown) {
  const root = mkdtempSync(join(tmpdir(), 'docs-check-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'apps/web'), { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { test: '' } }));
  writeFileSync(join(root, 'apps/web/package.json'), JSON.stringify({ name: '@solar/web', scripts: { dev: '' } }));
  writeFileSync(join(root, 'README.md'), markdown);
  return root;
}
test('reports missing link with file and line', t => {
  assert.match(checkDocs(fixture(t, '\n[x](./khong-co.md)'), ['README.md'])[0], /^README.md:2:/);
});
test('commands exist and resolves filter by name', t => {
  const root = fixture(t, '`pnpm --filter web dev` `pnpm --filter @solar/web dev` `pnpm test` `pnpm install --frozen-lockfile`');
  assert.deepEqual(checkDocs(root, ['README.md']), []);
  writeFileSync(join(root, 'README.md'), '`pnpm --filter web khong-co`\n`pnpm khong-co`');
  assert.equal(checkDocs(root, ['README.md']).length, 2);
});
for (const [name, md] of [
  ['anchor stripped', '[x](package.json#lenh)'],
  ['ignores fenced code', '```md\n[x](missing)\n```\n~~~md\n[x](missing)\n~~~'],
  ['skips external links', '[x](https://example.com) [x](mailto:a@b.com) [x](#a) [x](/absolute)'],
  ['decodes url-encoded paths', '[x](hello%20world.md) [x](<hello world.md>)'],
]) test(name, t => {
  const root = fixture(t, md);
  writeFileSync(join(root, 'hello world.md'), '');
  assert.deepEqual(checkDocs(root, ['README.md']), []);
});
const root = process.cwd();
test('checks commands inside fenced examples', t => {
  assert.equal(checkDocs(fixture(t, '```sh\npnpm --filter web missing\n```'), ['README.md']).length, 1);
});
const workspaces = ['apps', 'packages'].flatMap(dir => readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => `${dir}/${e.name}`));
test('every workspace has README', () => {
  for (const dir of workspaces) assert.ok(readFileSync(join(root, dir, 'README.md'), 'utf8'));
});
test('repo docs have no broken links and commands exist', () => {
  // Include new, unignored docs before the first commit as well as tracked docs.
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(docFiles);
  assert.deepEqual(checkDocs(root, files), []);
});
test('docs-public is tracked and indexed', () => {
  const index = readFileSync('docs-public/cms/README.md', 'utf8');
  for (const file of ['dang-nhap', 'trang-va-noi-dung', 'media', 'lead', 'giao-dien-ten-mien']) {
    const path = `docs-public/cms/${file}.md`;
    assert.ok(index.includes(`${file}.md`));
    assert.throws(() => execFileSync('git', ['check-ignore', '--quiet', path]));
  }
});
test('runbook covers required sections', () => {
  const text = readFileSync('docs-public/runbook.md', 'utf8');
  for (const heading of ['Deploy', 'Rollback', 'Khôi phục', 'Tên miền lỗi']) assert.ok(text.includes(`## ${heading}`));
});
test('AGENTS.md lists every workspace', () => {
  const text = readFileSync('AGENTS.md', 'utf8').split('## 3.')[0];
  for (const dir of workspaces) assert.ok(text.includes(dir), dir);
});
