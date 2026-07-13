/**
 * Genome revision derivation (RFC-0004, `SPEC/language.md` "Versioning").
 *
 * A revision identifies the exact content of a compiled document: the
 * lowercase hex SHA-256 of the canonical JSON serialization of the
 * schema-valid parsed document. Canonical form sorts object keys
 * lexicographically at every level and preserves array order (which is
 * meaningful — e.g. workflow steps), so documents differing only in YAML
 * formatting or key order share a revision.
 */

import { createHash } from "node:crypto";

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
};

/**
 * The single canonical serialization: revision hashing and diff comparison
 * (RFC-0005, board condition 2) must both call this, so "same revision" and
 * "no diff" can never drift apart through a second implementation.
 * `undefined` serializes to `undefined` (absent and undefined compare equal).
 */
export function canonicalJson(value: unknown): string | undefined {
  return value === undefined ? undefined : JSON.stringify(canonicalize(value));
}

export function deriveGenomeRevision(document: unknown): string {
  return createHash("sha256").update(canonicalJson(document) as string, "utf8").digest("hex");
}
