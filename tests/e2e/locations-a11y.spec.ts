import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("locations", () => {
  test("filters outlets and selects from the map", async ({ page }) => {
    await page.goto("/locations");
    await expect(page.getByText("10 outlets")).toBeVisible();
    await page.getByRole("button", { name: "Workshops" }).click();
    await expect(page.getByText("4 outlets")).toBeVisible();
    await page.getByRole("button", { name: "Showrooms" }).click();
    await page.getByRole("button", { name: "Sarkhej showroom" }).click();
    await expect(page.locator("#showroom-sarkhej")).toHaveClass(/shadow-lift/);
    await expect(page.locator("#showroom-sarkhej").getByRole("link", { name: "Directions" })).toHaveAttribute("href", /google\.com\/maps\/dir/);
  });

  test("hash deep links highlight an outlet", async ({ page }) => {
    await page.goto("/locations#workshop-navapura");
    await expect(page.locator("#workshop-navapura")).toHaveClass(/shadow-lift/);
  });
});

test.describe("accessibility (axe, WCAG 2.1 AA)", () => {
  for (const path of ["/", "/cars", "/cars/xev-9e", "/service", "/locations", "/test-drive", "/contact", "/testimonials"]) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
    });
  }
});
