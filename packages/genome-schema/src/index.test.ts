import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createValidator, formatErrors, parseGenomeDocument } from "./index.js";

const read = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const schema = JSON.parse(read("../../../SPEC/schema/genome.schema.json"));
const validate = createValidator(schema);

const validateSource = (relativePath: string) =>
  validate(parseGenomeDocument(read(relativePath)));

describe("genome schema validation", () => {
  it("accepts the canonical company example", () => {
    const result = validateSource("../../../SPEC/examples/company.yaml");

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a document missing company.name", () => {
    const result = validateSource("./__fixtures__/invalid-missing-name.yaml");

    expect(result.valid).toBe(false);
    expect(formatErrors(result.errors).join("\n")).toContain("name");
  });

  it("rejects a document missing genomeVersion", () => {
    const result = validateSource("./__fixtures__/invalid-missing-version.yaml");

    expect(result.valid).toBe(false);
    expect(formatErrors(result.errors).join("\n")).toContain("genomeVersion");
  });
});

describe("formatErrors", () => {
  it("renders a readable path and message", () => {
    const result = validateSource("./__fixtures__/invalid-missing-name.yaml");

    expect(formatErrors(result.errors)).toEqual(
      expect.arrayContaining([expect.stringMatching(/company .*name/)]),
    );
  });
});
