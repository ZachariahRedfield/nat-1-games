#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const chromiumPath = chromium.executablePath();

if (!existsSync(chromiumPath)) {
  console.warn(
    `[test:e2e] Skipping Playwright e2e tests because Chromium is not installed at ${chromiumPath}.`,
  );
  console.warn('[test:e2e] Install it with: npx playwright install chromium');
  process.exit(0);
}

const result = spawnSync('playwright', ['test'], {
  stdio: 'inherit',
  shell: true,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
