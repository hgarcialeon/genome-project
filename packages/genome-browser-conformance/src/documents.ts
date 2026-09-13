/**
 * The documents the conformance scenario covers, as the Board review requires:
 * the canonical self-hosting example (which the demo runs), the shipped company
 * example, a minimal valid document, ASCII content, multi-byte Unicode content,
 * two formatting variants that must canonicalize to one revision, and a
 * semantically different document that must not.
 *
 * Paths are repository-relative. Node reads them from disk; the browser bundle
 * inlines the same bytes at build time.
 */

export const DEMO_DOCUMENT = "genome-project";

export const CONFORMANCE_DOCUMENTS: Readonly<Record<string, string>> = {
  "genome-project": "SPEC/examples/genome-project.yaml",
  company: "SPEC/examples/company.yaml",
  minimal: "packages/genome-compiler/src/__fixtures__/golden-minimal.yaml",
  ascii: "packages/genome-compiler/src/__fixtures__/golden-ascii.yaml",
  unicode: "packages/genome-compiler/src/__fixtures__/golden-unicode.yaml",
  "formatting-a": "packages/genome-compiler/src/__fixtures__/golden-formatting-a.yaml",
  "formatting-b": "packages/genome-compiler/src/__fixtures__/golden-formatting-b.yaml",
  "semantic-change": "packages/genome-compiler/src/__fixtures__/golden-semantic-change.yaml",
};
