/**
 * The cross-platform conformance scenario (ADR-0011).
 *
 * One module, run twice: once under Node and once inside a browser. It calls
 * only accepted surfaces — the compiler's targets and the runtime's execution
 * and event stream through the reference adapter — and returns a
 * JSON-serializable report. It reproduces no Genome semantics: it does not
 * hash, canonicalize, validate, derive a graph, evaluate a policy, order steps,
 * or compute state. Everything it reports is something the compiler or the
 * runtime produced.
 *
 * Equality of the two reports is the evidence: the accepted behavior does not
 * depend on the platform it runs on.
 */

import { createReferenceAdapter } from "@genome/adapter-reference";
import { compile, graphTarget, inspectTarget, runtimeModelTarget, type CompileSuccess } from "@genome/compiler";
import { createRuntime, type RuntimeEvent } from "@genome/runtime";

/** Fixed so two platforms produce comparable event envelopes. */
export const CONFORMANCE_CLOCK = "2026-07-15T00:00:00.000Z";

export const DEMO_WORKFLOW = "rfc-lifecycle";
export const DEMO_PRINCIPAL = "human:product-owner";
export const DEMO_INITIATOR = "human:operator";

export type DocumentReport = {
  revision: string;
  /** Serialized so the comparison is exact and order-sensitive. */
  graph: string;
  inspect: string;
  runtimeModel: string;
  diagnostics: number;
};

export type RunReport = {
  status: string;
  completedSteps: number;
  pendingApprovals: readonly string[];
  events: readonly RuntimeEvent[];
};

export type ConformanceReport = {
  documents: Record<string, DocumentReport>;
  demo: {
    parked: RunReport;
    granted: RunReport;
    /** Two granted runs under the fixed clock, compared as emitted. */
    deterministic: boolean;
    approvalGrantedIndex: number;
    firstStepIndex: number;
    approvalGrantedSource: string | null;
  };
};

const compileOrThrow = (source: string): CompileSuccess => {
  const result = compile(source);
  if (!result.ok) {
    throw new Error(`conformance scenario: compilation failed at ${result.stage}`);
  }
  return result;
};

const execute = (source: string, grants: readonly string[]): RunReport => {
  const model = runtimeModelTarget(compileOrThrow(source).graph);
  const adapter = createReferenceAdapter({});
  const runtime = createRuntime({ model, adapter, clock: () => CONFORMANCE_CLOCK });
  adapter.bind(runtime);

  const events: RuntimeEvent[] = [];
  runtime.subscribe((event) => events.push(event));

  const initiation = runtime.startWorkflow(DEMO_WORKFLOW, DEMO_INITIATOR);
  if (!initiation.ok) {
    throw new Error(`conformance scenario: run refused (${initiation.reason})`);
  }
  for (const principal of grants) {
    runtime.submitApproval(initiation.runId, principal, true);
  }
  adapter.settle();

  const run = runtime.state().runs[initiation.runId];
  return {
    status: run.status,
    completedSteps: run.completedSteps,
    pendingApprovals: run.pendingApprovals,
    events,
  };
};

/**
 * @param documents  document label → Genome source. The demo runs against the
 *                   document labelled `demoDocument`.
 */
export function runConformanceScenario(
  documents: Record<string, string>,
  demoDocument: string,
): ConformanceReport {
  const reports: Record<string, DocumentReport> = {};
  for (const label of Object.keys(documents).sort()) {
    const { graph, diagnostics } = compileOrThrow(documents[label]);
    reports[label] = {
      revision: graph.genomeRevision,
      graph: JSON.stringify(graphTarget(graph)),
      inspect: JSON.stringify(inspectTarget(graph)),
      runtimeModel: JSON.stringify(runtimeModelTarget(graph)),
      diagnostics: diagnostics.length,
    };
  }

  const demoSource = documents[demoDocument];
  const parked = execute(demoSource, []);
  const granted = execute(demoSource, [DEMO_PRINCIPAL]);
  const grantedAgain = execute(demoSource, [DEMO_PRINCIPAL]);

  const types = granted.events.map((event) => event.type);
  const grantedEvent = granted.events.find((event) => event.type === "approval.granted");

  return {
    documents: reports,
    demo: {
      parked,
      granted,
      deterministic: JSON.stringify(grantedAgain.events) === JSON.stringify(granted.events),
      approvalGrantedIndex: types.indexOf("approval.granted"),
      firstStepIndex: types.findIndex((type) => type.startsWith("agent.task.")),
      approvalGrantedSource: grantedEvent?.source ?? null,
    },
  };
}
