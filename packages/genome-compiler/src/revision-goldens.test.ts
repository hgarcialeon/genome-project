/**
 * Golden Genome revisions (ADR-0011).
 *
 * The revision is the identity every runtime event attributes to, and its
 * derivation is normative (`SPEC/language.md` "Versioning", RFC-0004,
 * ADR-0005). Until this suite existed the repository asserted the revision's
 * *shape*, stability, and distinctness, but never its value — so an
 * implementation change could alter every revision in the world and stay
 * green.
 *
 * These expectations are literal values captured from the pre-change
 * implementation. They are the freeze point for the authorized platform
 * portability change: any implementation whose output differs from them is
 * wrong, and changing one of them is a stop condition that returns the work to
 * the Architecture Board
 * (`docs/reviews/rfc-0009-m1-compiler-portability-board-review.md`).
 *
 * The suite compiles documents through the public compiler and reads the
 * revision off the graph. It deliberately does not compute an expected value:
 * reproducing SHA-256 or the canonicalization here would test the test.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { compile, type CompileSuccess } from "./index.js";

const read = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const revisionOf = (relativePath: string): string => {
  const result = compile(read(relativePath));
  expect(result.ok).toBe(true);
  return (result as CompileSuccess).graph.genomeRevision;
};

/** Pinned pre-change values. Do not update to match an implementation. */
const GOLDENS: ReadonlyArray<readonly [label: string, path: string, revision: string]> = [
  [
    "canonical self-hosting example",
    "../../../SPEC/examples/genome-project.yaml",
    "f86a6a1b0736bfba1b7c2b5209818740082b0e9fea0246f47201653f3074571b",
  ],
  [
    "shipped company example",
    "../../../SPEC/examples/company.yaml",
    "a0ef705c96a0355d630f731c77dec8c62f23a796acd663509260a9f5c30dd6bb",
  ],
  [
    "minimal valid document",
    "./__fixtures__/golden-minimal.yaml",
    "9e7ca17043ff51784a8b78e610362d72202446251fcdb6849a1f51b22e5ed4b7",
  ],
  [
    "ASCII content",
    "./__fixtures__/golden-ascii.yaml",
    "78e2812cd94e88962de896c0815136442e3dd9791daacc7c6a42dc705b2923d3",
  ],
  [
    "multi-byte Unicode content",
    "./__fixtures__/golden-unicode.yaml",
    "89c77f8317f8ea7de42647be41324908dd3efff45e7cd3f98925225b78b456c7",
  ],
  [
    "formatting variant A",
    "./__fixtures__/golden-formatting-a.yaml",
    "acb2d2b7309b3bb5a4f0f4489751903e05e867433fa09b4cefb611d889841c92",
  ],
  [
    "formatting variant B (same document, reordered and requoted)",
    "./__fixtures__/golden-formatting-b.yaml",
    "acb2d2b7309b3bb5a4f0f4489751903e05e867433fa09b4cefb611d889841c92",
  ],
  [
    "one semantic difference from variant A",
    "./__fixtures__/golden-semantic-change.yaml",
    "d111890eb411e990c4ff8cbec859ef311e5924da9f6e54b6cc9db3fdf661e2dd",
  ],
  [
    "participation binding (RFC-0007)",
    "./__fixtures__/participation-binding.yaml",
    "ec2099777fbbe21d518eb916946e56bf142a3e3dcbc5d63c3ee885bd74269afc",
  ],
];

describe("golden Genome revisions (ADR-0011)", () => {
  for (const [label, path, revision] of GOLDENS) {
    it(`${label} → ${revision.slice(0, 12)}…`, () => {
      expect(revisionOf(path)).toBe(revision);
    });
  }

  it("formatting-only differences canonicalize to one revision", () => {
    expect(revisionOf("./__fixtures__/golden-formatting-b.yaml")).toBe(
      revisionOf("./__fixtures__/golden-formatting-a.yaml"),
    );
  });

  it("a semantic difference produces a different revision", () => {
    expect(revisionOf("./__fixtures__/golden-semantic-change.yaml")).not.toBe(
      revisionOf("./__fixtures__/golden-formatting-a.yaml"),
    );
  });

  it("every golden is a lowercase hex sha-256", () => {
    for (const [, , revision] of GOLDENS) {
      expect(revision).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
