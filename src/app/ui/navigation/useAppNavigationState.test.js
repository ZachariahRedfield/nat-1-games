import test from "node:test";
import assert from "node:assert/strict";

import { performLogout } from "./useAppNavigationState.js";
import { SCREENS } from "../../screens.js";

test("performLogout clears local session and navigates to login when signOut rejects", async () => {
  let clearSessionCalls = 0;
  const setSessionValues = [];
  const setScreenValues = [];
  const rejection = new Error("network fail");

  const originalWarn = console.warn;
  const warnCalls = [];
  console.warn = (...args) => {
    warnCalls.push(args);
  };

  try {
    await performLogout({
      clearSession: () => {
        clearSessionCalls += 1;
      },
      supabase: {
        auth: {
          signOut: () => Promise.reject(rejection),
        },
      },
      setSessionState: (value) => {
        setSessionValues.push(value);
      },
      setScreen: (value) => {
        setScreenValues.push(value);
      },
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(clearSessionCalls, 1);
  assert.deepEqual(setSessionValues, [null]);
  assert.deepEqual(setScreenValues, [SCREENS.LOGIN]);
  assert.equal(warnCalls.length, 1);
  assert.equal(warnCalls[0][0], "Supabase signOut failed");
  assert.equal(warnCalls[0][1], rejection);
});

test("performLogout awaits signOut before clearing local navigation state", async () => {
  const timeline = [];
  let resolveSignOut;

  const signOutPromise = new Promise((resolve) => {
    resolveSignOut = () => {
      timeline.push("signOut-resolved");
      resolve();
    };
  });

  const logoutPromise = performLogout({
    clearSession: () => {
      timeline.push("clearSession");
    },
    supabase: {
      auth: {
        signOut: () => {
          timeline.push("signOut-called");
          return signOutPromise;
        },
      },
    },
    setSessionState: () => {
      timeline.push("setSessionState");
    },
    setScreen: () => {
      timeline.push("setScreen");
    },
  });

  timeline.push("after-call");
  resolveSignOut();
  await logoutPromise;

  assert.deepEqual(timeline, [
    "clearSession",
    "signOut-called",
    "after-call",
    "signOut-resolved",
    "setSessionState",
    "setScreen",
  ]);
});
