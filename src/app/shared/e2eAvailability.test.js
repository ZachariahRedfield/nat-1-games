import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveE2eExecutionMode } from './e2eAvailability.js';

test('resolveE2eExecutionMode runs when Chromium is installed', () => {
  assert.equal(
    resolveE2eExecutionMode({ chromiumInstalled: true, ciEnv: undefined }),
    'run',
  );
  assert.equal(
    resolveE2eExecutionMode({ chromiumInstalled: true, ciEnv: 'true' }),
    'run',
  );
});

test('resolveE2eExecutionMode skips locally when Chromium is missing', () => {
  assert.equal(
    resolveE2eExecutionMode({ chromiumInstalled: false, ciEnv: undefined }),
    'skip',
  );
  assert.equal(
    resolveE2eExecutionMode({ chromiumInstalled: false, ciEnv: '0' }),
    'skip',
  );
});

test('resolveE2eExecutionMode fails in CI when Chromium is missing', () => {
  assert.equal(
    resolveE2eExecutionMode({ chromiumInstalled: false, ciEnv: 'true' }),
    'fail',
  );
  assert.equal(
    resolveE2eExecutionMode({ chromiumInstalled: false, ciEnv: '1' }),
    'fail',
  );
});
