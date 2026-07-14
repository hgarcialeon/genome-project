#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import { createReferenceAdapter } from "@genome/adapter-reference";
import {
  compile,
  diffTarget,
  graphTarget,
  inspectTarget,
  runtimeModelTarget,
  type CompileSuccess,
  type Diagnostic,
  type DiffReport,
} from "@genome/compiler";
import {
  createRuntime,
  INTRINSIC_FLOOR_PRINCIPAL,
  isHumanPrincipal,
  type RunState,
  type RuntimeEvent,
} from "@genome/runtime";
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
      fail(1, `Invalid YAML in ${file}:`, describeError(error));
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
  .option("--json", "Emit the inspection report as JSON")
  .description("Compile a Genome document and summarize the organization")
  .action((file: string, options: { json?: boolean }) => {
    const result = compileOrFail(file);
    const report = inspectTarget(result.graph);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(report.company.name);
    if (report.company.mission) {
      console.log(report.company.mission);
    }
    console.log();

    console.log(
      Object.entries(report.counts)
        .filter(([type, count]) => count > 0 && type !== "Company")
        .map(([type, count]) => `${type}: ${count}`)
        .join(" · "),
    );
    console.log();

    for (const department of report.departments) {
      console.log(department.id);
      for (const agent of department.agents) {
        console.log(`  ${agent}`);
      }
      for (const team of department.teams) {
        console.log(`  ${team.id}`);
        for (const agent of team.agents) {
          console.log(`    ${agent}`);
        }
      }
    }

    if (report.workflows.length > 0) {
      console.log();
      console.log("Workflows:");
      for (const workflow of report.workflows) {
        const trigger = workflow.trigger ? ` (${workflow.trigger})` : "";
        const owner = workflow.owner ? ` — owner ${workflow.owner}` : "";
        console.log(`  ${workflow.id}${trigger}${owner}, ${workflow.steps} steps`);
      }
    }
  });

program
  .command("graph")
  .argument("<file>", "Genome YAML file")
  .description("Compile a Genome document and emit the Organization Graph as JSON")
  .action((file: string) => {
    const result = compileOrFail(file);
    console.log(JSON.stringify(graphTarget(result.graph), null, 2));
  });

program
  .command("diff")
  .argument("<before>", "Genome YAML file (the older document)")
  .argument("<after>", "Genome YAML file (the newer document)")
  .option("--json", "Emit the diff report as JSON")
  .description(
    "Compare two Genome documents structurally. " +
      "Exits 0 when identical, 1 when they differ, 2 on trouble (diff(1) convention).",
  )
  .action((beforeFile: string, afterFile: string, options: { json?: boolean }) => {
    // Trouble (read or compile failure of either input) exits 2, so scripts
    // can tell "the organization changed" (1) from "the check broke" (2).
    const before = compileOrFail(beforeFile, 2);
    const after = compileOrFail(afterFile, 2);
    const report = diffTarget(before.graph, after.graph);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printDiff(report);
    }
    process.exit(report.identical ? 0 : 1);
  });

type RunOptions = {
  workflow: string;
  as: string;
  grant: string[];
  failStep: string[];
  json?: boolean;
  exportLog?: string;
  clock?: string;
};

const collect = (value: string, previous: string[]): string[] => [...previous, value];

program
  .command("run")
  .argument("<file>", "Genome YAML file")
  .requiredOption("--workflow <id>", "Workflow to execute (initiation is explicit; there is no default)")
  .option("--as <principal>", "Initiating principal: human:<id> or an agent id/reference", "human:operator")
  .option("--grant <principal>", "Pre-authorized approval, matched by the runtime's rules (repeatable, deny-safe)", collect, [])
  .option(
    "--fail-step <step>",
    "Simulation aid, defined by the reference adapter: fail the named step (repeatable; workflowId:step or bare step)",
    collect,
    [],
  )
  .option("--json", "Machine output: NDJSON event stream plus a final-state line")
  .option("--export-log <path>", "Write the complete event log as NDJSON after the run settles")
  .option("--clock <iso8601>", "Testing aid: fix the injectable runtime clock to a constant")
  .description(
    "Compile a Genome document and execute one workflow through the reference adapter. " +
      "Exits 0 completed / 1 failed / 2 trouble / 3 blocked pending approval (RFC-0006).",
  )
  // All invocation-level failures are "trouble": override commander's default
  // exit 1 so the pinned exit codes, not the library's, are the contract
  // (RFC-0006). Help and version keep exit 0.
  .exitOverride((error) => {
    process.exit(error.exitCode === 0 ? 0 : 2);
  })
  .action(runWorkflow);

program.parse();

function runWorkflow(file: string, options: RunOptions): never {
  // --clock is an invocation input, so a malformed value is trouble.
  let clock: (() => string) | undefined;
  if (options.clock !== undefined) {
    if (Number.isNaN(Date.parse(options.clock))) {
      fail(2, `Invalid --clock value: ${options.clock} (expected an ISO 8601 timestamp)`);
    }
    const fixed = options.clock;
    clock = () => fixed;
  }

  // Compiled artifacts only: compile → runtimeModelTarget → createRuntime.
  const result = compileOrFail(file, 2);
  const model = runtimeModelTarget(result.graph);

  const adapter = createReferenceAdapter({ failSteps: options.failStep });
  const runtime = createRuntime({ model, adapter, clock });
  adapter.bind(runtime);

  runtime.subscribe((event) => {
    console.log(options.json ? JSON.stringify(event) : formatEvent(event));
  });

  const initiation = runtime.startWorkflow(options.workflow, options.as);
  if (!initiation.ok) {
    fail(2, `✗ run refused: ${initiation.reason}`);
  }

  // Grants are applied to requested approvals in event order, not
  // command-line order; each grant is consumed at most once, first in
  // command-line order when several match one pending principal. `human:*`
  // is not special-cased here — the runtime refuses it (reserved-principal).
  const used = new Set<number>();
  for (const principal of runtime.state().runs[initiation.runId].pendingApprovals) {
    for (;;) {
      const index = options.grant.findIndex(
        (grant, position) =>
          !used.has(position) &&
          (grant === principal || (principal === INTRINSIC_FLOOR_PRINCIPAL && isHumanPrincipal(grant))),
      );
      if (index === -1) break;
      used.add(index);
      const approval = runtime.submitApproval(initiation.runId, options.grant[index], true);
      if (approval.ok) break;
      console.error(`⚠ grant ${options.grant[index]} refused: ${approval.reason}`);
    }
  }
  for (const [index, grant] of options.grant.entries()) {
    if (!used.has(index)) {
      console.error(`⚠ grant ${grant} matched no requested approval`);
    }
  }

  adapter.settle();

  const run = runtime.state().runs[initiation.runId];
  const exitCode = run.status === "completed" ? 0 : run.status === "failed" ? 1 : run.status === "pending-approval" ? 3 : 2;

  if (options.json) {
    // The final-state line is CLI output, not an event (RFC-0006).
    console.log(
      JSON.stringify({
        finalState: {
          runId: run.runId,
          status: run.status,
          completedSteps: run.completedSteps,
          pendingApprovals: run.pendingApprovals,
        },
        exitCode,
      }),
    );
  } else {
    printFinalState(run);
  }

  if (options.exportLog !== undefined) {
    // Pinned framing: UTF-8, one JSON.stringify(envelope) per line, LF
    // separators, trailing newline — written once, after settlement.
    const log = runtime
      .events()
      .map((event) => JSON.stringify(event))
      .join("\n");
    writeFileSync(options.exportLog, `${log}\n`, "utf8");
  }

  process.exit(exitCode);
}

function formatEvent(event: RuntimeEvent): string {
  const payload = Object.entries(event.payload)
    .map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" ");
  return `#${event.id} ${event.type} ${event.source}${payload === "" ? "" : ` ${payload}`}`;
}

function printFinalState(run: RunState): void {
  console.log();
  console.log(`Run ${run.runId}: ${run.status}`);
  console.log(`  completed steps: ${run.completedSteps}`);
  if (run.pendingApprovals.length > 0) {
    console.log(`  pending approvals: ${run.pendingApprovals.join(", ")}`);
  }
}

function printDiff(report: DiffReport): void {
  if (report.identical) {
    console.log(`✓ Documents are identical (revision ${report.revisions.before}).`);
    return;
  }

  console.log(`revision ${report.revisions.before}`);
  console.log(`      → ${report.revisions.after}`);

  const { added, removed, changed } = report.nodes;
  if (added.length + removed.length + changed.length + report.edges.added.length + report.edges.removed.length === 0) {
    console.log();
    console.log("The documents differ, but no change surfaces in the Organization Graph.");
    return;
  }

  console.log();
  for (const node of added) {
    console.log(`+ ${node.id} (${node.type})`);
  }
  for (const node of removed) {
    console.log(`- ${node.id} (${node.type})`);
  }
  for (const node of changed) {
    console.log(`~ ${node.id} (${node.type})`);
    for (const change of node.changes) {
      console.log(`    ${change.attribute}: ${JSON.stringify(change.before)} → ${JSON.stringify(change.after)}`);
    }
  }
  for (const edge of report.edges.added) {
    console.log(`+ edge ${edge.from} -${edge.type}-> ${edge.to}`);
  }
  for (const edge of report.edges.removed) {
    console.log(`- edge ${edge.from} -${edge.type}-> ${edge.to}`);
  }
}

function compileOrFail(file: string, failureExitCode = 1): CompileSuccess {
  const source = readTextFile(file, `Cannot read Genome document: ${file}`, failureExitCode);
  const result = compile(source);

  if (!result.ok) {
    console.error(`✗ ${file} failed to compile (${result.stage} stage).`);
    for (const diagnostic of result.diagnostics) {
      console.error(`  - ${formatDiagnostic(diagnostic)}`);
    }
    process.exit(failureExitCode);
  }

  // A successful compile may still carry warnings (e.g. an unbound policy).
  for (const diagnostic of result.diagnostics) {
    console.error(`⚠ ${formatDiagnostic(diagnostic)}`);
  }

  return result;
}

function formatDiagnostic(diagnostic: Diagnostic): string {
  // Schema-stage messages already lead with the document path.
  return diagnostic.message.startsWith(diagnostic.path)
    ? diagnostic.message
    : `${diagnostic.path}: ${diagnostic.message}`;
}

function readTextFile(path: string, message: string, failureExitCode = 1): string {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    fail(failureExitCode, message, describeError(error));
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fail(exitCode: number, ...lines: string[]): never {
  for (const line of lines) {
    console.error(line);
  }
  process.exit(exitCode);
}
