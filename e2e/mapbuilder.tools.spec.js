import { expect, test } from "@playwright/test";
import { gotoRepro } from "./helpers/nav.js";

test.describe("mobile tool switching", () => {
  test.skip(({ project }) => project.name !== "Mobile Chromium", "mobile-only regression check");

  test("stamp -> pan toggles active tool", async ({ page }) => {
    await gotoRepro(page, "mapBuilder");

    const stamp = page.getByTestId("tool-stamp");
    await expect(stamp).toBeVisible();
    await stamp.click();
    await expect(stamp).toHaveAttribute("data-active", "true");

    await stamp.click();
    const pan = page.getByTestId("tool-pan");
    await expect(pan).toBeVisible();
    await pan.click();
    await expect(pan).toHaveAttribute("data-active", "true");
  });
});
