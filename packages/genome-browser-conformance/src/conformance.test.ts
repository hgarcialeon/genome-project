/**
 * Node ↔ browser conformance (ADR-0011).
 *
 * Runs one scenario module on both platforms and requires the reports to be
 * identical. The browser bundle is built from the accepted packages with **no
 * aliases, shims, or polyfills**: a build failure here means the compiler has
 * regained a platform-specific dependency, which is a stop condition
 * (`docs/reviews/rfc-0009-m1-compiler-portability-board-review.md`).
 *
 * Nothing here reimplements Genome semantics. Every compared value is one the
 * compiler or the runtime produced.
 */

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSync } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";

import { dumpDom, findChromium } from "./chromium.js";
import { CONFORMANCE_DOCUMENTS, DEMO_DOCUMENT } from "./documents.js";
import { runConformanceScenario, type ConformanceReport } from "./scenario.js";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const BROWSER_ENTRY = fileURLToPath(new URL("./browser-entry.ts", import.meta.url));

const readDocuments = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(CONFORMANCE_DOCUMENTS).map(([label, path]) => [
      label,
      readFileSync(join(REPO_ROOT, path), "utf8"),
    ]),
  );

/** Bundles the browser half exactly as an application would, with no shims. */
function bundleForBrowser(): string {
  const result = buildSync({
    entryPoints: [BROWSER_ENTRY],
    bundle: true,
    platform: "browser",
    format: "iife",
    loader: { ".yaml": "text" },
    write: false,
    logLevel: "silent",
  });
  return result.outputFiles[0].text;
}

function reportFromBrowser(bundle: string): ConformanceReport {
  const directory = mkdtempSync(join(tmpdir(), "genome-conformance-"));
  const page = join(directory, "conformance.html");
  writeFileSync(page, `<!doctype html><meta charset="utf-8"><body><script>\n${bundle}\n</script></body>`);

  const dom = dumpDom(findChromium(), `file://${page}`);
  const match = /<pre id="conformance-report">([\s\S]*?)<\/pre>/.exec(dom);
  if (match === null) {
    throw new Error(`the browser produced no conformance report. DOM was:\n${dom.slice(0, 1000)}`);
  }
  const payload = match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");

  const parsed = JSON.parse(payload) as { ok: boolean; report?: ConformanceReport; error?: string };
  if (!parsed.ok || parsed.report === undefined) {
    throw new Error(`the scenario threw inside the browser: ${parsed.error ?? "unknown error"}`);
  }
  return parsed.report;
}

describe("Node ↔ browser conformance (ADR-0011)", () => {
  let node: ConformanceReport;
  let browser: ConformanceReport;

  beforeAll(() => {
    node = runConformanceScenario(readDocuments(), DEMO_DOCUMENT);
    browser = reportFromBrowser(bundleForBrowser());
  }, 180_000);

  it("compiles every document in the browser with no diagnostics gained", () => {
    for (const label of Object.keys(CONFORMANCE_DOCUMENTS)) {
      expect(browser.documents[label].diagnostics).toBe(node.documents[label].diagnostics);
    }
  });

  it("derives byte-identical revisions across platforms", () => {
    for (const label of Object.keys(CONFORMANCE_DOCUMENTS)) {
      expect(browser.documents[label].revision, `revision for ${label}`).toBe(node.documents[label].revision);
      expect(browser.documents[label].revision).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("preserves canonicalization invariance and distinctness in the browser", () => {
    expect(browser.documents["formatting-b"].revision).toBe(browser.documents["formatting-a"].revision);
    expect(browser.documents["semantic-change"].revision).not.toBe(browser.documents["formatting-a"].revision);
  });

  it("projects an identical Organization Graph", () => {
    for (const label of Object.keys(CONFORMANCE_DOCUMENTS)) {
      expect(browser.documents[label].graph, `graphTarget for ${label}`).toBe(node.documents[label].graph);
    }
  });

  it("projects an identical inspect/tree target", () => {
    for (const label of Object.keys(CONFORMANCE_DOCUMENTS)) {
      expect(browser.documents[label].inspect, `inspectTarget for ${label}`).toBe(node.documents[label].inspect);
    }
  });

  it("projects an identical runtime model", () => {
    for (const label of Object.keys(CONFORMANCE_DOCUMENTS)) {
      expect(browser.documents[label].runtimeModel, `runtimeModelTarget for ${label}`).toBe(
        node.documents[label].runtimeModel,
      );
    }
  });

  it("parks deny-safe identically when the approval is absent", () => {
    expect(browser.demo.parked.status).toBe("pending-approval");
    expect(browser.demo.parked.completedSteps).toBe(0);
    expect(browser.demo.parked).toEqual(node.demo.parked);
  });

  it("completes identically once the approval is granted", () => {
    expect(browser.demo.granted.status).toBe("completed");
    expect(browser.demo.granted.completedSteps).toBe(node.demo.granted.completedSteps);
    expect(browser.demo.granted.events).toEqual(node.demo.granted.events);
  });

  it("attributes the approval to the granting principal, before the first step", () => {
    expect(browser.demo.approvalGrantedSource).toBe("human:product-owner");
    expect(browser.demo.approvalGrantedIndex).toBeGreaterThanOrEqual(0);
    expect(browser.demo.approvalGrantedIndex).toBeLessThan(browser.demo.firstStepIndex);
    expect(browser.demo.approvalGrantedIndex).toBe(node.demo.approvalGrantedIndex);
    expect(browser.demo.firstStepIndex).toBe(node.demo.firstStepIndex);
  });

  it("is deterministic under a fixed clock on both platforms", () => {
    expect(node.demo.deterministic).toBe(true);
    expect(browser.demo.deterministic).toBe(true);
  });

  it("produces one identical report end to end", () => {
    expect(browser).toEqual(node);
  });
});
