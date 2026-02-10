import { test, expect } from "@playwright/test";
import { gotoRepro } from "./helpers/nav";

test.describe("mobile tool switching", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "Mobile Chromium",
      "mobile-only regression check"
    );
  });

  test("stamp -> pan toggles active tool", async ({ page }) => {
    await gotoRepro(page, "mapBuilder");
    // ...rest of your test unchanged...
  });
});
