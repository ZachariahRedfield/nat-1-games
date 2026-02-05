import test from "node:test";
import assert from "node:assert/strict";

import { buildHeaderNavItems } from "./headerNavItems.js";
import { SCREENS } from "../../../app/screens.js";

test("buildHeaderNavItems marks all items disabled for non-DM sessions", () => {
  const items = buildHeaderNavItems(SCREENS.MENU, false);
  assert.equal(items.length, 3);
  assert.ok(items.every((item) => item.disabled === true));
  assert.ok(items.every((item) => item.title.includes("DM only")));
});

test("buildHeaderNavItems enables items for DM sessions and marks active item", () => {
  const items = buildHeaderNavItems(SCREENS.MAP_BUILDER, true);
  const active = items.find((item) => item.key === SCREENS.MAP_BUILDER);
  assert.ok(active);
  assert.equal(active.active, true);
  assert.equal(active.disabled, false);
  assert.equal(active.title, active.label);
  assert.ok(items.every((item) => item.disabled === false));
});
