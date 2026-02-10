import { expect, test } from "@playwright/test";
import { gotoRepro } from "./helpers/nav.js";

test.describe("mobile compact controls", () => {
  test.skip(({ project }) => project.name !== "Mobile Chromium", "mobile-only regression check");

  test("map and layers compact controls open drawer sections", async ({ page }) => {
    await gotoRepro(page, "mapBuilder");

    const mapButton = page.getByTestId("compact-map");
    const layersButton = page.getByTestId("compact-layers");

    await expect(mapButton).toBeVisible();
    await expect(layersButton).toBeVisible();

    await mapButton.click();
    await expect(page.getByTestId("compact-drawer")).toHaveAttribute("data-map-open", "true");

    await layersButton.click();
    await expect(page.getByTestId("compact-drawer")).toHaveAttribute("data-layers-open", "true");
  });
});
