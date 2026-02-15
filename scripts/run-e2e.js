#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

import { resolveE2eExecutionMode } from '../src/app/shared/e2eAvailability.js';

const chromiumPath = chromium.executablePath();
const executionMode = resolveE2eExecutionMode({
  chromiumInstalled: existsSync(chromiumPath),
  ciEnv: process.env.CI,
});

if (executionMode === 'skip') {
  console.warn(
    `[test:e2e] Skipping Playwright e2e tests because Chromium is not installed at ${chromiumPath}.`,
  );
  console.warn('[test:e2e] Install it with: npx playwright install chromium');
  process.exit(0);
}

if (executionMode === 'fail') {
  console.error(
    `[test:e2e] Chromium is required in CI but was not found at ${chromiumPath}.`,
  );
  console.error('[test:e2e] Install it with: npx playwright install chromium');
  process.exit(1);
}

const result = spawnSync('npx', ['playwright', 'test'], {
  stdio: 'inherit',
  shell: true,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
