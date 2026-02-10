import { test, expect } from "@playwright/test";
import { gotoRepro } from "./helpers/nav";

test.describe("mobile compact controls", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "Mobile Chromium",
      "mobile-only regression check"
    );
  });

  test("map and layers compact controls open drawer sections", async ({ page }) => {
    await gotoRepro(page, "mapBuilder");
    // ...rest of your test unchanged...
  });
});
