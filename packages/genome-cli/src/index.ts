#!/usr/bin/env tsx

import { Command } from "commander";

const program = new Command();

program
  .name("genome")
  .description("CLI for the Genome specification")
  .version("0.0.1");

program
  .command("validate")
  .argument("<file>", "Genome YAML file")
  .description("Validate a Genome document")
  .action((file) => {
    console.log(`Validation placeholder for: ${file}`);
    console.log("Next step: load YAML, validate against SPEC/schema/genome.schema.json, print errors.");
  });

program
  .command("inspect")
  .argument("<file>", "Genome YAML file")
  .description("Inspect a Genome document")
  .action((file) => {
    console.log(`Inspect placeholder for: ${file}`);
  });

program.parse();
