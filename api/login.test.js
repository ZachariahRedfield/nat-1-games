import test from "node:test";
import assert from "node:assert/strict";

import { getJwtSecretOrThrow, normalizeUsernameForKey } from "./login.js";

test("normalizeUsernameForKey trims and lowercases usernames", () => {
  assert.equal(normalizeUsernameForKey("  Alice  "), "alice");
  assert.equal(normalizeUsernameForKey("BOB"), "bob");
  assert.equal(normalizeUsernameForKey("   "), "");
});

test("getJwtSecretOrThrow returns configured secret", () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "secret-value";
  try {
    assert.equal(getJwtSecretOrThrow(), "secret-value");
  } finally {
    process.env.JWT_SECRET = previous;
  }
});

test("getJwtSecretOrThrow throws when JWT secret is missing", () => {
  const previous = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    assert.throws(() => getJwtSecretOrThrow(), /JWT_SECRET is not configured/);
  } finally {
    process.env.JWT_SECRET = previous;
  }
});
