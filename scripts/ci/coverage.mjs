import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function withCoverage(command, minLines, include) {
  const threshold = Number(minLines);
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100 || !include?.length || include.some(glob => !glob)) {
    throw new Error('Usage: coverage.mjs <minLines:1–100> <include>... [-- <command>]');
  }
  let found = false;
  const flags = [
    '--experimental-test-coverage', `--test-coverage-lines=${threshold}`,
    ...include.map(glob => `--test-coverage-include="${glob}"`),
    '--test-coverage-exclude="**/__tests__/**"', '--test-coverage-exclude="**/*.test.*"',
  ].join(' ');
  const result = command.replace(/(^|\s)--test(?=\s|$)/g, (_match, space) => {
    found = true;
    return `${space}--test ${flags}`;
  });
  if (!found) throw new Error('không tìm thấy node --test');
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [minLines, ...args] = process.argv.slice(2);
  const separator = args.indexOf('--');
  const include = separator === -1 ? args : args.slice(0, separator);
  const command = separator === -1
    ? JSON.parse(readFileSync('package.json', 'utf8')).scripts.test
    : args.slice(separator + 1).join(' ');
  const result = spawnSync(withCoverage(command, minLines, include), { shell: true, stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
