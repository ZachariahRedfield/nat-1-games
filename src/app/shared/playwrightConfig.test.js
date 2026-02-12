import test from "node:test";
import assert from "node:assert/strict";
import playwrightConfig from "../../../playwright.config.js";

test("Mobile Chromium project is configured to launch chromium", () => {
  const projects = playwrightConfig?.projects ?? [];
  const mobileProject = projects.find((project) => project?.name === "Mobile Chromium");

  assert.ok(mobileProject, "expected Mobile Chromium project to exist");
  assert.equal(mobileProject.use?.browserName, "chromium");
});
