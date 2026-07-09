export type RenderQAFinding = {
  severity: "low" | "medium" | "high";
  issue: string;
  viewport: "desktop" | "mobile" | "global";
};

export type RenderQAResult = {
  available: boolean;
  screenshots: {
    desktop?: string;
    mobile?: string;
  };
  findings: RenderQAFinding[];
  warnings: string[];
};

type BrowserLike = {
  newPage: (options: { viewport: { width: number; height: number } }) => Promise<PageLike>;
  close: () => Promise<void>;
};

type PageLike = {
  setContent: (html: string, options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle"; timeout?: number }) => Promise<void>;
  waitForTimeout: (timeout: number) => Promise<void>;
  screenshot: (options: { type: "png"; fullPage: boolean; path?: string }) => Promise<Buffer>;
  evaluate: <T>(fn: () => T) => Promise<T>;
  close: () => Promise<void>;
};

async function loadPlaywright(): Promise<{ chromium: { launch: (options: { headless: boolean }) => Promise<BrowserLike> } } | null> {
  try {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
    return (await dynamicImport("playwright")) as { chromium: { launch: (options: { headless: boolean }) => Promise<BrowserLike> } };
  } catch {
    return null;
  }
}

async function inspectViewport(browser: BrowserLike, html: string, viewport: "desktop" | "mobile") {
  const size = viewport === "desktop" ? { width: 1440, height: 1100 } : { width: 390, height: 900 };
  const page = await browser.newPage({ viewport: size });

  try {
    await page.setContent(html, { waitUntil: "networkidle", timeout: 12_000 });
    await page.waitForTimeout(300);
    const metrics = await page.evaluate(() => {
      const body = document.body;
      const documentElement = document.documentElement;
      const images = Array.from(document.images);

      return {
        bodyTextLength: body.innerText.trim().length,
        scrollWidth: documentElement.scrollWidth,
        clientWidth: documentElement.clientWidth,
        bodyHeight: body.getBoundingClientRect().height,
        brokenImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
        emptyButtons: Array.from(document.querySelectorAll("button,a")).filter((element) => !element.textContent?.trim()).length,
      };
    });
    const screenshot = await page.screenshot({ type: "png", fullPage: true });
    const findings: RenderQAFinding[] = [];

    if (metrics.bodyTextLength < 400) {
      findings.push({ severity: "high", issue: "Rendered body appears mostly empty.", viewport });
    }
    if (metrics.scrollWidth > metrics.clientWidth + 2) {
      findings.push({ severity: "high", issue: "Horizontal overflow detected in rendered layout.", viewport });
    }
    if (metrics.bodyHeight < 700) {
      findings.push({ severity: "medium", issue: "Rendered page height is unusually short for a complete demo.", viewport });
    }
    if (metrics.brokenImages > 0) {
      findings.push({ severity: "high", issue: `${metrics.brokenImages} broken image(s) detected.`, viewport });
    }
    if (metrics.emptyButtons > 0) {
      findings.push({ severity: "medium", issue: `${metrics.emptyButtons} empty link/button control(s) detected.`, viewport });
    }

    return {
      findings,
      screenshot: `data:image/png;base64,${screenshot.toString("base64")}`,
    };
  } finally {
    await page.close();
  }
}

export async function runRenderQA(html: string): Promise<RenderQAResult> {
  if (process.env.SERAPHIM_RENDER_QA !== "1") {
    return {
      available: false,
      screenshots: {},
      findings: [],
      warnings: ["Render QA skipped. Set SERAPHIM_RENDER_QA=1 and install Playwright to enable browser-rendered checks."],
    };
  }

  const playwright = await loadPlaywright();
  if (!playwright) {
    return {
      available: false,
      screenshots: {},
      findings: [],
      warnings: ["Render QA skipped because Playwright is not installed in this environment."],
    };
  }

  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const [desktop, mobile] = await Promise.all([
      inspectViewport(browser, html, "desktop"),
      inspectViewport(browser, html, "mobile"),
    ]);

    return {
      available: true,
      screenshots: {
        desktop: desktop.screenshot,
        mobile: mobile.screenshot,
      },
      findings: [...desktop.findings, ...mobile.findings],
      warnings: [],
    };
  } catch (error) {
    return {
      available: false,
      screenshots: {},
      findings: [{ severity: "medium", issue: error instanceof Error ? error.message : "Render QA failed.", viewport: "global" }],
      warnings: ["Render QA failed and Seraphim continued with heuristic/model QA."],
    };
  } finally {
    await browser.close();
  }
}
