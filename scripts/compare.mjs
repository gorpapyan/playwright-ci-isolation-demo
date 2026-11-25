import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const cli = join(require.resolve('playwright/package.json'), '..', 'cli.js');
const reportDir = 'reports';
mkdirSync(reportDir, { recursive: true });
const rows = [];

for (const mode of ['shared', 'isolated']) {
  for (let run = 1; run <= 3; run++) {
    const store = mkdtempSync(join(tmpdir(), 'playwright-isolation-'));
    try {
      const result = spawnSync(process.execPath, [cli, 'test', '--reporter=json'], {
        encoding: 'utf8',
        env: { ...process.env, SLOT_MODE: mode, SLOT_STORE: store, FORCE_COLOR: '0' },
        timeout: 30_000,
      });
      if (result.error) throw result.error;
      if (!result.stdout) throw Error(result.stderr || 'Playwright produced no report');

      const report = JSON.parse(result.stdout);
      const { expected: passed, unexpected: failed, skipped, flaky } = report.stats;
      const valid = mode === 'shared'
        ? result.status === 1 && passed === 1 && failed === 1 && result.stdout.replace(/\\u001b\[[0-9;]*m/g, '').includes('already reserved')
        : result.status === 0 && passed === 2 && failed === 0;
      if (!valid || skipped || flaky || report.config.workers !== 2) {
        throw Error(`${mode} run ${run} did not show the expected behavior: ${JSON.stringify(report.stats)}`);
      }

      const row = { mode, run, passed, failed, workers: report.config.workers };
      rows.push(row);
      console.log(`${mode.padEnd(8)} run ${run}: ${passed} passed, ${failed} failed (${row.workers} workers)`);
    } finally {
      rmSync(store, { recursive: true });
    }
  }
}

writeFileSync(join(reportDir, 'results.json'), JSON.stringify({
  node: process.version,
  playwright: require('playwright/package.json').version,
  rows,
}, null, 2) + '\n');
