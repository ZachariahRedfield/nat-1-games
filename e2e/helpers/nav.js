import { expect } from "@playwright/test";

export async function gotoRepro(page, screen) {
  await page.goto(`/?repro=${encodeURIComponent(screen)}`);

  const notNowButton = page.getByTestId("assets-folder-not-now");
  if (await notNowButton.isVisible().catch(() => false)) {
    await notNowButton.click();
    await expect(notNowButton).toBeHidden();
  }
}
