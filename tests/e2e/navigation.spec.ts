import { expect, test } from "@playwright/test";

test.describe("home & navigation", () => {
  test("hero model switcher and range tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Every Mahindra");

    const featured = page.getByRole("tablist", { name: "Featured models" });
    await featured.getByRole("tab", { name: "XEV 9S" }).click();
    await expect(featured.getByRole("tab", { name: "XEV 9S" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: "Explore the XEV 9S" })).toHaveAttribute("href", "/cars/xev-9s");

    const range = page.getByRole("tablist", { name: "Vehicle categories" });
    await range.getByRole("tab", { name: /Electric SUVs/ }).click();
    const panel = page.getByRole("tabpanel").filter({ has: page.getByText("BE 6 SPORTEQ") });
    await expect(panel).toBeVisible();
    await range.getByRole("tab", { name: /Commercial/ }).click();
    await expect(page.getByRole("tabpanel").filter({ hasText: "Veero" })).toBeVisible();
  });

  test("mega menu opens, lists models and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Vehicles" });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: /Thar ROXX/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("legacy URLs redirect to the new routes", async ({ page }) => {
    await page.goto("/new-cars/mahindra-thar-roxx.html");
    await expect(page).toHaveURL(/\/cars\/thar-roxx$/);
    await page.goto("/outlet/workshop.html");
    await expect(page).toHaveURL(/\/locations$/);
  });

  test("unknown pages render the 404 page", async ({ page }) => {
    const res = await page.goto("/cars/not-a-model");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("doesn't go anywhere");
  });

  test("@mobile drawer navigation works on phones", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Locations" }).click();
    await expect(page).toHaveURL(/\/locations$/);
    await expect(drawer).toBeHidden();
  });

  test("@mobile key pages have no horizontal overflow", async ({ page }) => {
    for (const path of ["/", "/cars", "/cars/xuv-7xo", "/commercial/veero", "/service", "/locations", "/contact", "/gallery"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });
});
