import test from "node:test";
import assert from "node:assert/strict";

import { getRightAssetsPanelPointerEventClasses } from "./rightAssetsPanelPointerEvents.js";

test("right assets overlay stays non-hit-testable while open panel is hit-testable", () => {
  const openState = getRightAssetsPanelPointerEventClasses({ collapsed: false });

  assert.equal(openState.overlayClassName.includes("pointer-events-none"), true);
  assert.equal(openState.panelClassName.includes("pointer-events-auto"), true);
});

test("right assets panel disables panel hit testing when collapsed", () => {
  const collapsedState = getRightAssetsPanelPointerEventClasses({ collapsed: true });

  assert.equal(collapsedState.overlayClassName.includes("pointer-events-none"), true);
  assert.equal(collapsedState.panelClassName.includes("pointer-events-none"), true);
});
