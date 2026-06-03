import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type BrowserErrors = {
  consoleErrors: string[];
  pageErrors: string[];
};

export function collectBrowserErrors(page: Page): BrowserErrors {
  const errors: BrowserErrors = {
    consoleErrors: [],
    pageErrors: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.pageErrors.push(error.message);
  });

  return errors;
}

export function expectNoBrowserErrors(errors: BrowserErrors) {
  expect([...errors.pageErrors, ...errors.consoleErrors]).toEqual([]);
}

function isAxeAlreadyRunningError(error: unknown) {
  return error instanceof Error && error.message.includes("Axe is already running");
}

async function waitForAxeIdle(page: Page) {
  await page.waitForFunction(
    () => {
      const windowWithAxe = window as Window & { axe?: { _running?: boolean } };

      return windowWithAxe.axe?._running !== true;
    },
    undefined,
    { timeout: 10_000 },
  );
}

export async function expectA11yClean(page: Page) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await waitForAxeIdle(page);

    try {
      const results = await new AxeBuilder({ page }).analyze();

      expect(results.violations).toEqual([]);
      return;
    } catch (error) {
      if (!isAxeAlreadyRunningError(error)) {
        throw error;
      }

      lastError = error;
      await page.waitForTimeout(100 * (attempt + 1));
    }
  }

  throw lastError;
}

export async function expectNoInvalidSvgGeometry(page: Page) {
  const invalidGeometry = await page.evaluate(() => {
    const invalid: string[] = [];
    const finiteAttributes = ["x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry"];
    const nonNegativeAttributes = ["height", "width"];

    for (const element of Array.from(document.querySelectorAll("svg *"))) {
      for (const attribute of finiteAttributes) {
        const value = element.getAttribute(attribute);

        if (value !== null && value !== "auto" && !Number.isFinite(Number(value))) {
          invalid.push(`${element.tagName}[${attribute}="${value}"]`);
        }
      }

      for (const attribute of nonNegativeAttributes) {
        const value = element.getAttribute(attribute);

        if (value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
          invalid.push(`${element.tagName}[${attribute}="${value}"]`);
        }
      }

      for (const attribute of ["d", "points", "transform"]) {
        const value = element.getAttribute(attribute);

        if (value && /NaN|Infinity/.test(value)) {
          invalid.push(`${element.tagName}[${attribute}="${value}"]`);
        }
      }
    }

    return invalid;
  });

  expect(invalidGeometry).toEqual([]);
}

export async function expectNoVisibleTextOverflow(page: Page) {
  const overflowing = await page.evaluate(() => {
    const selector = [
      "a",
      "button",
      "h1",
      "h2",
      "h3",
      "label",
      "p",
      "[role='button']",
      "[role='checkbox']",
      "[role='radio']",
      "[role='switch']",
    ].join(",");

    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const text = (element.innerText ?? element.textContent ?? "").trim();

        return (
          text.length > 0 &&
          !element.classList.contains("sr-only") &&
          !element.closest(".sr-only") &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          element.offsetParent !== null &&
          rect.width > 8 &&
          rect.height > 8 &&
          element.clientWidth > 8 &&
          element.scrollWidth > element.clientWidth + 2
        );
      })
      .map(
        (element) =>
          `${element.tagName.toLowerCase()}: ${(element.innerText ?? element.textContent ?? "").trim()}`,
      );
  });

  expect(overflowing).toEqual([]);
}

export async function installLongTaskObserver(page: Page) {
  await page.addInitScript(() => {
    window.__chartLongTasks = [];

    if (!("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        window.__chartLongTasks ??= [];
        window.__chartLongTasks.push(
          ...list.getEntries().map((entry) => ({
            duration: entry.duration,
            name: entry.name,
            startTime: entry.startTime,
          })),
        );
      });

      observer.observe({ entryTypes: ["longtask"] });
    } catch (_error) {
      // Long task observation is best-effort and not available in every browser mode.
    }
  });
}

export async function expectLongTasksWithinBudget(page: Page, maxCount: number) {
  const longTasks = await page.evaluate(() => window.__chartLongTasks ?? []);

  expect(longTasks.length).toBeLessThanOrEqual(maxCount);
}

declare global {
  interface Window {
    __chartLongTasks?: Array<{
      duration: number;
      name: string;
      startTime: number;
    }>;
  }
}
