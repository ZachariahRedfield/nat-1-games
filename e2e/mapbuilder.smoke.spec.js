import { expect, test } from "@playwright/test";
import { gotoRepro } from "./helpers/nav.js";

test("mapbuilder repro loads with root + tool controls", async ({ page }) => {
  await gotoRepro(page, "mapBuilder");

  await expect(page.getByTestId("mapbuilder-root")).toBeVisible();
  await expect(page.getByTestId("tool-stamp")).toBeVisible();
});
