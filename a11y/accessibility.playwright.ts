import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/questionnaire", "/dashboard", "/compte"];
const viewports = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "mobile-landscape", width: 844, height: 390 },
];

for (const viewport of viewports) {
  test.describe(viewport.name, () => {
    test.use({ viewport });

    for (const route of routes) {
      test(`${route} reste lisible et accessible`, async ({ page }) => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);

        const horizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(horizontalOverflow).toBeLessThanOrEqual(1);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  });
}

test.describe("thème clair", () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: "light" });

  for (const route of routes) {
    test(`${route} conserve ses contrastes`, async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("theme", "light"));
      await page.goto(route, { waitUntil: "domcontentloaded" });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});

test("le focus clavier reste visible dans le questionnaire", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/questionnaire", { waitUntil: "domcontentloaded" });

  await page.locator("main").waitFor();
  for (let index = 0; index < 3; index += 1) {
    await page.keyboard.press("Tab");
    const hasInteractiveFocus = await page.evaluate(
      () => document.activeElement !== document.body,
    );
    if (hasInteractiveFocus) break;
  }
  await expect
    .poll(() =>
      page.evaluate(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) return false;
        const style = getComputedStyle(active);
        return style.outlineStyle !== "none" && style.outlineWidth !== "0px";
      }),
    )
    .toBe(true);
});

test("le dashboard ne présente qu’une action principale", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  await page.locator("#overview").waitFor();
  await expect(page.locator(".carbon-button--accent:visible")).toHaveCount(1);
});
