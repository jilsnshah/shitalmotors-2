import { expect, test } from "@playwright/test";

test.describe("vehicles", () => {
  test("listing filters by type and keeps the URL in sync", async ({ page }) => {
    await page.goto("/cars");
    await expect(page.getByText(/Showing 13 of 13 models/)).toBeVisible();
    await page.getByText("Electric", { exact: true }).first().click();
    await expect(page.getByText(/Showing 5 of 13 models/)).toBeVisible();
    await expect(page).toHaveURL(/segment=electric/);
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByText(/Showing 13 of 13 models/)).toBeVisible();
  });

  test("listing honours ?segment= deep links", async ({ page }) => {
    await page.goto("/cars?segment=electric");
    await expect(page.getByText(/Showing 5 of 13 models/)).toBeVisible();
  });

  test("model page: colours, variant filters, specs and gallery", async ({ page }) => {
    await page.goto("/cars/thar-roxx");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thar ROXX");

    // Colour configurator
    const swatches = page.getByRole("radiogroup", { name: /colours/ });
    await swatches.getByRole("radio", { name: "Tango Red" }).click();
    await expect(swatches.getByRole("radio", { name: "Tango Red" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Tango Red", { exact: true }).first()).toBeVisible();

    // Variant table: filter + expand
    const table = page.locator("#variants table");
    await page.getByRole("button", { name: "Show all 21 variants" }).click();
    await expect(table.locator("tbody tr")).toHaveCount(21);
    await page.locator("#variants").getByRole("button", { name: "Petrol", exact: true }).click();
    await expect(table.locator("tbody tr")).toHaveCount(6);
    await expect(table.locator("tbody tr").first()).toContainText("₹12.52 lakh");

    // Spec sheet variant switch
    const select = page.getByLabel("Specifications for");
    await select.selectOption({ label: "AX7L RWD AT" });
    await expect(page.locator("#specifications")).toContainText("1997 cc");

    // Lightbox
    await page.locator("#gallery").getByRole("button").first().click();
    const viewer = page.getByRole("dialog", { name: "Image viewer" });
    await expect(viewer).toBeVisible();
    await expect(viewer).toContainText("1 / 9");
    await page.keyboard.press("ArrowRight");
    await expect(viewer).toContainText("2 / 9");
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("on-road price CTA deep-links the form with model and variant", async ({ page }) => {
    await page.goto("/cars/thar-roxx");
    await page.locator("#variants table tbody tr").first().getByRole("link", { name: /On-road price/ }).click();
    await expect(page).toHaveURL(/\/get-price\?model=thar-roxx&variant=/);
    await expect(page.getByLabel("Model", { exact: true })).toHaveValue("thar-roxx");
    await expect(page.getByLabel(/Variant/)).toHaveValue("MX1 RWD");
  });

  test("commercial vehicle page lists variants", async ({ page }) => {
    await page.goto("/commercial/veero");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Veero");
    await expect(page.locator("#variants table tbody tr")).toHaveCount(8);
    await page.getByRole("button", { name: "Show all 10 variants" }).click();
    await expect(page.locator("#variants table tbody tr")).toHaveCount(10);
  });
});
