/**
 * Locating a browser for the conformance harness.
 *
 * The harness deliberately adds no browser-automation framework: it bundles
 * with esbuild and drives a headless Chromium directly. If no browser is found
 * the harness fails loudly — a skipped conformance check is indistinguishable
 * from a passing one, and this evidence is required to stay green
 * (ADR-0011).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CANDIDATE_COMMANDS = ["google-chrome-stable", "google-chrome", "chromium", "chromium-browser"];

/** Playwright-managed browsers, when an environment already provides them. */
function playwrightChromium(): string | undefined {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root === undefined || !existsSync(root)) return undefined;
  for (const entry of readdirSync(root)) {
    if (!entry.startsWith("chromium")) continue;
    for (const relative of ["chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
      const candidate = join(root, entry, relative);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

export function findChromium(): string {
  for (const variable of ["GENOME_CHROMIUM", "CHROME_BIN"] as const) {
    const configured = process.env[variable];
    if (configured === undefined || configured === "") continue;
    if (!existsSync(configured)) {
      throw new Error(`${variable} points at ${configured}, which does not exist`);
    }
    return configured;
  }

  for (const command of CANDIDATE_COMMANDS) {
    const found = spawnSync("which", [command], { encoding: "utf8" });
    if (found.status === 0 && found.stdout.trim() !== "") return found.stdout.trim();
  }

  const managed = playwrightChromium();
  if (managed !== undefined) return managed;

  throw new Error(
    "no Chromium found for the browser conformance harness. Install Google Chrome or " +
      "Chromium, or set GENOME_CHROMIUM to a browser executable. This check must not be " +
      "skipped: it is the evidence that accepted behavior does not depend on the platform.",
  );
}

/** Loads a local page and returns the rendered DOM. */
export function dumpDom(browser: string, pageUrl: string): string {
  const result = spawnSync(
    browser,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--virtual-time-budget=20000",
      "--dump-dom",
      pageUrl,
    ],
    { encoding: "utf8", timeout: 120_000 },
  );
  if (result.status !== 0) {
    throw new Error(`headless browser exited with ${result.status ?? "signal"}: ${result.stderr?.slice(0, 500)}`);
  }
  return result.stdout;
}
