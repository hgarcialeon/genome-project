/**
 * The browser half of the conformance harness (ADR-0011).
 *
 * It imports the accepted packages exactly as a browser application would —
 * no aliases, no polyfills, no shims — runs the shared scenario, and publishes
 * the report into the DOM for the driver to read. If this file needs a shim to
 * build, the compiler is not portable and the harness has done its job.
 */

import { runConformanceScenario } from "./scenario.js";
import { DEMO_DOCUMENT } from "./documents.js";

import companySource from "../../../SPEC/examples/company.yaml";
import genomeProjectSource from "../../../SPEC/examples/genome-project.yaml";
import asciiSource from "../../genome-compiler/src/__fixtures__/golden-ascii.yaml";
import formattingASource from "../../genome-compiler/src/__fixtures__/golden-formatting-a.yaml";
import formattingBSource from "../../genome-compiler/src/__fixtures__/golden-formatting-b.yaml";
import minimalSource from "../../genome-compiler/src/__fixtures__/golden-minimal.yaml";
import semanticChangeSource from "../../genome-compiler/src/__fixtures__/golden-semantic-change.yaml";
import unicodeSource from "../../genome-compiler/src/__fixtures__/golden-unicode.yaml";

const output = document.createElement("pre");
output.id = "conformance-report";

try {
  const report = runConformanceScenario(
    {
      "genome-project": genomeProjectSource,
      company: companySource,
      minimal: minimalSource,
      ascii: asciiSource,
      unicode: unicodeSource,
      "formatting-a": formattingASource,
      "formatting-b": formattingBSource,
      "semantic-change": semanticChangeSource,
    },
    DEMO_DOCUMENT,
  );
  output.textContent = JSON.stringify({ ok: true, report });
} catch (error) {
  output.textContent = JSON.stringify({
    ok: false,
    error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
  });
}

document.body.appendChild(output);
