import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { defaultAnswers } from "../src/data/defaults";

async function seedAssessment(page: import("@playwright/test").Page) {
  await page.addInitScript((answers) => {
    localStorage.setItem("carbon-os-assessment-v1", JSON.stringify(answers));
  }, defaultAnswers);
}

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
        if (route === "/dashboard") await seedAssessment(page);
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(
          page.getByRole("heading", { level: 1 }).first(),
        ).toBeVisible();
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
      if (route === "/dashboard") await seedAssessment(page);
      await page.addInitScript(() => localStorage.setItem("theme", "light"));
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});

test("le focus clavier reste visible dans le questionnaire", async ({
  page,
}) => {
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
  await seedAssessment(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  await page.locator("#overview").waitFor();
  await expect(page.locator(".carbon-button--accent:visible")).toHaveCount(1);
});

for (const route of ["/questionnaire", "/resultat", "/dashboard"]) {
  test(`${route} ne bloque pas quand le stockage est refusé`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("Storage blocked", "SecurityError");
        },
      });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("le questionnaire se termine même si le stockage est refusé", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.goto("/questionnaire", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toContainText(
    "sauvegarde locale est bloquée ou saturée",
  );
  for (let step = 0; step < 11; step += 1) {
    const next = page.locator(".questionnaire-next");
    const last = (await next.innerText()).includes("Voir mon résultat");
    await next.click();
    if (last) break;
    await expect(next).toBeEnabled();
    await page.waitForTimeout(350);
  }
  await expect(page).toHaveURL(/\/resultat$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Votre empreinte est estimée",
  );
});

test("le résultat vide n’invente pas de bilan", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/resultat", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "n’est pas encore là",
  );
  await expect(page.locator("#commencer")).toBeVisible();
});

test("un bilan stocké ouvre le résultat réel", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "carbon-os-assessment-v1",
      JSON.stringify({
        mode: "quick",
        primaryMobility: "car",
        carType: "petrol",
        carKm: 10000,
        occupancy: 1.4,
        trainKm: 1200,
        trainService: "mixed",
        motorcycleKm: 5000,
        transitKm: 4000,
        bikeKm: 2500,
        shortFlights: 1,
        longFlights: 0,
        homeType: "apartment",
        surface: 65,
        occupants: 2,
        insulation: "average",
        heating: "gas",
        heatingKwh: null,
        electricityKwh: null,
        renewableElectricity: false,
        diet: "flexitarian",
        beefFrequency: 1.5,
        foodWaste: "medium",
        purchaseProfile: "standard",
        secondHand: "sometimes",
        deviceYears: 3,
        digitalHours: 3,
        servicesProfile: "standard",
      }),
    );
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/resultat", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Votre empreinte est estimée à",
  );
});
