import { readFileSync } from "node:fs";

import { defineConfig, type Plugin } from "vitest/config";

/**
 * Genome documents are imported as text, the same way the browser-conformance
 * harness inlines them: Studio opens a document, it does not fetch one.
 */
const yamlAsText = (): Plugin => ({
  name: "genome-yaml-as-text",
  transform(_code, id) {
    if (!id.endsWith(".yaml")) return null;
    return { code: `export default ${JSON.stringify(readFileSync(id, "utf8"))};`, map: null };
  },
});

/**
 * Studio is browser-first: Vite serves and builds it, and nothing here runs a
 * server for Genome execution — the accepted compiler, runtime, and reference
 * adapter execute in the page (ADR-0011, RFC-0009 §4).
 */
export default defineConfig({
  plugins: [yamlAsText()],
  esbuild: { jsx: "automatic", jsxImportSource: "preact" },
  test: {
    environment: "jsdom",
    // Studio tests exercise the real accepted packages; Genome semantics are
    // never mocked (RFC-0009 §3). Cross-platform equality is proven separately
    // and independently by @genome/browser-conformance.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
