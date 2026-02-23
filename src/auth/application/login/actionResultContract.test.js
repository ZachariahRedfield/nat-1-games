import test from "node:test";
import assert from "node:assert/strict";

import {
  actionSuccess as loginActionSuccess,
  actionError as loginActionError,
} from "../../../../api/login.js";
import {
  actionSuccess as signupActionSuccess,
  actionError as signupActionError,
} from "../../../../api/signup.js";

test("login API action helpers return ActionResult contract", () => {
  assert.deepEqual(loginActionSuccess({ token: "abc" }), {
    ok: true,
    data: { token: "abc" },
  });
  assert.deepEqual(loginActionError("bad"), {
    ok: false,
    error: "bad",
  });
});

test("signup API action helpers return ActionResult contract", () => {
  assert.deepEqual(signupActionSuccess({ user: { username: "demo" } }), {
    ok: true,
    data: { user: { username: "demo" } },
  });
  assert.deepEqual(signupActionError("exists"), {
    ok: false,
    error: "exists",
  });
});
