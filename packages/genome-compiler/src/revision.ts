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

export function deriveGenomeRevision(document: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(document)), "utf8").digest("hex");
}
