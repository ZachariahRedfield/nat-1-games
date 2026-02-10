import test from "node:test";
import assert from "node:assert/strict";

import { SCREENS } from "../screens.js";
import { createDevSeedSession, getDevAuthDebugConfig, isDevAuthDebugEnabled } from "./devAuthDebug.js";

test("isDevAuthDebugEnabled requires DEV and VITE_DEBUG_AUTH=1", () => {
  assert.equal(isDevAuthDebugEnabled({ DEV: true, VITE_DEBUG_AUTH: "1" }), true);
  assert.equal(isDevAuthDebugEnabled({ DEV: true, VITE_DEBUG_AUTH: "0" }), false);
  assert.equal(isDevAuthDebugEnabled({ DEV: false, VITE_DEBUG_AUTH: "1" }), false);
});

test("getDevAuthDebugConfig maps autologin and repro params", () => {
  const env = { DEV: true, VITE_DEBUG_AUTH: "1" };

  assert.deepEqual(getDevAuthDebugConfig("?autologin=1", env), {
    enabled: true,
    shouldShowPanel: false,
    targetScreen: SCREENS.MAP_BUILDER,
    shouldAutoLogin: true,
  });

  assert.deepEqual(getDevAuthDebugConfig("?repro=startSession&debug=1", env), {
    enabled: true,
    shouldShowPanel: true,
    targetScreen: SCREENS.START_SESSION,
    shouldAutoLogin: true,
  });

  assert.deepEqual(getDevAuthDebugConfig("?repro=nope", env), {
    enabled: true,
    shouldShowPanel: false,
    targetScreen: null,
    shouldAutoLogin: false,
  });
});

test("createDevSeedSession returns DM-compatible session", () => {
  assert.deepEqual(createDevSeedSession(), {
    userId: "dev-codex",
    username: "codex",
    role: "DM",
    user: {
      username: "codex",
    },
  });
});
