import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

export const docFiles = file => /^(?:[^/]+\.md|(?:apps|packages|tooling|infra)\/[^/]+\/[^/]+\.md|docs-public\/.*\.md)$/.test(file);

export function checkDocs(root, files) {
  const packages = new Map();
  for (const dir of ['', ...['apps', 'packages', 'tooling'].flatMap(group =>
    existsSync(resolve(root, group)) ? readdirSync(resolve(root, group)).map(name => `${group}/${name}`) : [])]) {
    const path = resolve(root, dir, 'package.json');
    if (!existsSync(path)) continue;
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    packages.set(dir ? basename(dir) : '', pkg.scripts ?? {});
    if (pkg.name) packages.set(pkg.name, pkg.scripts ?? {});
  }
  const errors = [];
  for (const file of files) {
    let fence;
    readFileSync(resolve(root, file), 'utf8').split('\n').forEach((line, index) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
        return;
      }
      const fail = message => errors.push(`${file}:${index + 1}: ${message}`);
      for (const match of (fence ? '' : line).matchAll(/\[[^\]]*\]\(<?([^)>]+)>?\)/g)) {
        const target = match[1].trim().replace(/\s+["'][^]*$/, '').split('#')[0];
        if (!target || /^(?:[a-z][\w+.-]*:|\/)/i.test(target)) continue;
        try {
          if (!existsSync(resolve(root, dirname(file), decodeURIComponent(target)))) fail(`link không tồn tại: ${target}`);
        } catch { fail(`link không hợp lệ: ${target}`); }
      }
      if (!['README.md', 'docs-public/runbook.md'].includes(file)) return;
      for (const match of line.matchAll(/\bpnpm\s+(?:--filter\s+([^\s`]+)\s+)?([\w:-]+)/g)) {
        const [, filter, script] = match;
        if (['install', 'exec', 'dlx', 'add'].includes(script)) continue;
        if (!Object.hasOwn(packages.get(filter ?? '') ?? {}, script)) fail(`script không tồn tại: pnpm ${filter ? `--filter ${filter} ` : ''}${script}`);
      }
    });
  }
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(docFiles);
  const errors = checkDocs(process.cwd(), files);
  console.log(errors.length ? errors.join('\n') : 'docs-check: 0 lỗi');
  process.exitCode = errors.length ? 1 : 0;
}
