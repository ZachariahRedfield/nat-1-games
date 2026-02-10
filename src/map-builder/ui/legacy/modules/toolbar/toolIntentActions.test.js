import test from "node:test";
import assert from "node:assert/strict";

import { buildToolIntentActions } from "./toolIntentActions.js";

function createSpy(label, calls) {
  return (value) => {
    calls.push([label, value]);
  };
}

test("stamp intent applies draw/grid tool selection through toolbar state setters", () => {
  const calls = [];
  const actions = buildToolIntentActions({
    assetGroup: "image",
    setZoomToolActive: createSpy("setZoomToolActive", calls),
    setPanToolActive: createSpy("setPanToolActive", calls),
    setInteractionMode: createSpy("setInteractionMode", calls),
    setEngine: createSpy("setEngine", calls),
  });

  actions.stamp();

  assert.deepEqual(calls, [
    ["setZoomToolActive", false],
    ["setPanToolActive", false],
    ["setInteractionMode", "draw"],
    ["setEngine", "grid"],
  ]);
});

test("canvas intent is blocked for token assets", () => {
  const calls = [];
  const actions = buildToolIntentActions({
    assetGroup: "token",
    setZoomToolActive: createSpy("setZoomToolActive", calls),
    setPanToolActive: createSpy("setPanToolActive", calls),
    setInteractionMode: createSpy("setInteractionMode", calls),
    setEngine: createSpy("setEngine", calls),
  });

  actions.canvas();

  assert.equal(calls.length, 0);
});
