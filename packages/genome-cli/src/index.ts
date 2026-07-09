#!/usr/bin/env tsx

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import { createValidator, formatErrors, parseGenomeDocument } from "@genome/schema";

// Canonical schema location (SPEC is the source of truth). Resolved relative to
// this file so the command works regardless of the current working directory.
const DEFAULT_SCHEMA = fileURLToPath(
  new URL("../../../SPEC/schema/genome.schema.json", import.meta.url),
);

const program = new Command();

program
  .name("genome")
  .description("CLI for the Genome specification")
  .version("0.0.1");

program
  .command("validate")
  .argument("<file>", "Genome YAML file")
  .option("-s, --schema <path>", "JSON Schema file", DEFAULT_SCHEMA)
  .description("Validate a Genome document against the Genome schema")
  .action((file: string, options: { schema: string }) => {
    const source = readTextFile(file, `Cannot read Genome document: ${file}`);

    let document: unknown;
    try {
      document = parseGenomeDocument(source);
    } catch (error) {
      fail(`Invalid YAML in ${file}:`, describeError(error));
    }

    const schema = JSON.parse(
      readTextFile(options.schema, `Cannot read schema: ${options.schema}`),
    );

    const result = createValidator(schema)(document);

    if (result.valid) {
      console.log(`✓ ${file} is a valid Genome document.`);
      return;
    }

    console.error(`✗ ${file} is not a valid Genome document.`);
    for (const line of formatErrors(result.errors)) {
      console.error(`  - ${line}`);
    }
    process.exit(1);
  });

program
  .command("inspect")
  .argument("<file>", "Genome YAML file")
  .description("Inspect a Genome document")
  .action((file: string) => {
    console.log(`Inspect placeholder for: ${file}`);
  });

program.parse();

function readTextFile(path: string, message: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    fail(message, describeError(error));
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fail(...lines: string[]): never {
  for (const line of lines) {
    console.error(line);
  }
  process.exit(1);
}
