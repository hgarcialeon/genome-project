import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compile, runtimeModelTarget, type CompileSuccess, type RuntimeModel } from "@genome/compiler";
import { describe, expect, it } from "vitest";

import { createRuntime, replay, type AgentTask, type Refusal, type RuntimeEvent } from "./index.js";

const CLOCK = () => "2026-07-13T00:00:00.000Z";

const compileModel = (source: string): RuntimeModel => {
  const result = compile(source);
  expect(result.ok).toBe(true);
  return runtimeModelTarget((result as CompileSuccess).graph);
};

/** The canonical example: build-feature is policy-governed, incident-response is not. */
const exampleModel = (): RuntimeModel =>
  compileModel(readFileSync(fileURLToPath(new URL("../../../SPEC/examples/company.yaml", import.meta.url)), "utf8"));

/** Autonomy fixture: one agent per level, one governed and one ungoverned workflow. */
const autonomyModel = (): RuntimeModel =>
  compileModel(
    [
      "genomeVersion: 0.1",
      "company:",
      "  name: Autonomy Fixture",
      "departments:",
      "  ops:",
      "    agents:",
      "      manual-bot:",
      "        role: Manual",
      "      supervised-bot:",
      "        role: Supervised",
      "        autonomy: supervised",
      "      free-bot:",
      "        role: Autonomous",
      "        autonomy: autonomous",
      "workflows:",
      "  routine:",
      "    owner: ops.free-bot",
      "    steps:",
      "      - one",
      "      - two",
      "  guarded:",
      "    owner: ops.supervised-bot",
      "    steps:",
      "      - one",
      "  orphan:",
      "    steps:",
      "      - one",
      "policies:",
      "  guardrail:",
      "    appliesTo:",
      "      - guarded",
      "    requiresApprovalFrom:",
      "      - human:boss",
    ].join("\n"),
  );

const reason = (result: { ok: boolean }): string => (result as Refusal).reason;

describe("approval-gated execution (RFC-0003/RFC-0004)", () => {
  it("runs a governed workflow end to end: request, grant, tasks, completion", () => {
    const dispatched: AgentTask[] = [];
    const runtime = createRuntime({ model: exampleModel(), adapter: { dispatch: (task) => dispatched.push(task) }, clock: CLOCK });

    const started = runtime.startWorkflow("build-feature", "human:release-captain");
    expect(started).toEqual({ ok: true, runId: "run-1", status: "pending-approval" });

    // Deny-safe: nothing runs before the grant.
    expect(runtime.events().map((event) => event.type)).toEqual(["approval.requested"]);
    expect(runtime.events()[0].source).toBe("policy:production-deploy");
    expect(dispatched).toHaveLength(0);

    const granted = runtime.submitApproval("run-1", "human:engineering-manager", true);
    expect(granted).toEqual({ ok: true, runId: "run-1", status: "running" });
    expect(dispatched).toEqual([
      { runId: "run-1", workflowId: "build-feature", agent: "agent:engineering.platform.architect", step: "clarify-requirement", index: 0 },
    ]);

    for (let step = 0; step < 6; step += 1) {
      const report = runtime.reportTask("run-1", "completed");
      expect(report.ok).toBe(true);
    }

    const run = runtime.state().runs["run-1"];
    expect(run.status).toBe("completed");
    expect(run.completedSteps).toBe(6);
    expect(runtime.events().map((event) => event.type)).toEqual([
      "approval.requested",
      "approval.granted",
      "workflow.started",
      "agent.task.assigned",
      "agent.task.completed",
      "agent.task.assigned",
      "agent.task.completed",
      "agent.task.assigned",
      "agent.task.completed",
      "agent.task.assigned",
      "agent.task.completed",
      "agent.task.assigned",
      "agent.task.completed",
      "agent.task.assigned",
      "agent.task.completed",
      "workflow.completed",
    ]);
  });

  it("starts an ungoverned, human-initiated workflow immediately", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });

    const started = runtime.startWorkflow("incident-response", "human:on-call");
    expect(started).toEqual({ ok: true, runId: "run-1", status: "running" });
    expect(runtime.events()[0].type).toBe("workflow.started");
    expect(runtime.events()[0].source).toBe("human:on-call");
  });

  it("terminates on denial: approval.denied, policy.enforced, workflow.failed", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    runtime.startWorkflow("build-feature", "human:release-captain");

    const denied = runtime.submitApproval("run-1", "human:engineering-manager", false);
    expect(denied).toEqual({ ok: true, runId: "run-1", status: "failed" });
    expect(runtime.events().map((event) => event.type)).toEqual([
      "approval.requested",
      "approval.denied",
      "policy.enforced",
      "workflow.failed",
    ]);
    expect(runtime.events()[2].source).toBe("policy:production-deploy");
    expect(runtime.events()[3].payload.reason).toBe("approval-denied");
  });

  it("refuses approvals from unmatched principals and unknown runs (deny-safe)", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    runtime.startWorkflow("build-feature", "human:release-captain");

    expect(reason(runtime.submitApproval("run-1", "human:passer-by", true))).toBe("unmatched-principal");
    expect(reason(runtime.submitApproval("run-9", "human:engineering-manager", true))).toBe("unknown-run");
    expect(runtime.state().runs["run-1"].status).toBe("pending-approval");
  });

  it("fails the run when a task fails (no retries in v0.1)", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    runtime.startWorkflow("incident-response", "human:on-call");

    runtime.reportTask("run-1", "completed");
    const failed = runtime.reportTask("run-1", "failed", "provider timeout");
    expect(failed).toEqual({ ok: true, runId: "run-1", status: "failed" });
    expect(runtime.events().at(-2)?.payload).toMatchObject({ step: "triage", detail: "provider timeout" });
    expect(runtime.events().at(-1)?.payload.reason).toBe("task-failed");
    expect(reason(runtime.reportTask("run-1", "completed"))).toBe("not-running");
  });

  it("refuses initiation of unknown and ownerless workflows", () => {
    const runtime = createRuntime({ model: autonomyModel(), clock: CLOCK });

    expect(reason(runtime.startWorkflow("nope", "human:boss"))).toBe("unknown-workflow");
    expect(reason(runtime.startWorkflow("orphan", "human:boss"))).toBe("ownerless-workflow");
    expect(runtime.events()).toHaveLength(0);
  });
});

describe("autonomy gates (SPEC/language.md behavioral semantics)", () => {
  it("refuses initiation by a manual agent (default autonomy)", () => {
    const runtime = createRuntime({ model: autonomyModel(), clock: CLOCK });

    expect(reason(runtime.startWorkflow("routine", "ops.manual-bot"))).toBe("manual-agent");
    expect(reason(runtime.startWorkflow("routine", "ops.nobody"))).toBe("unknown-agent");
  });

  it("gives a supervised agent the intrinsic human:* floor on ungoverned workflows", () => {
    const runtime = createRuntime({ model: autonomyModel(), clock: CLOCK });

    const started = runtime.startWorkflow("routine", "ops.supervised-bot");
    expect(started).toEqual({ ok: true, runId: "run-1", status: "pending-approval" });

    const request = runtime.events()[0];
    expect(request.source).toBe("agent:ops.supervised-bot");
    expect(request.payload.principals).toEqual(["human:*"]);

    // Any concrete human may grant the floor; the grant is attributed.
    const granted = runtime.submitApproval("run-1", "human:anyone", true);
    expect(granted).toEqual({ ok: true, runId: "run-1", status: "running" });
    expect(runtime.events()[1].source).toBe("human:anyone");
  });

  it("adds no floor when a governing policy already requires a human", () => {
    const runtime = createRuntime({ model: autonomyModel(), clock: CLOCK });

    runtime.startWorkflow("guarded", "ops.supervised-bot");
    expect(runtime.state().runs["run-1"].pendingApprovals).toEqual(["human:boss"]);
  });

  it("gates an autonomous agent by policy checkpoints only", () => {
    const runtime = createRuntime({ model: autonomyModel(), clock: CLOCK });

    expect(runtime.startWorkflow("routine", "ops.free-bot")).toEqual({ ok: true, runId: "run-1", status: "running" });
    expect(runtime.startWorkflow("guarded", "ops.free-bot")).toEqual({
      ok: true,
      runId: "run-2",
      status: "pending-approval",
    });
  });

  it("reserves human:* — never an initiator, approver, or operator", () => {
    const runtime = createRuntime({ model: autonomyModel(), clock: CLOCK });
    runtime.startWorkflow("routine", "ops.supervised-bot");

    expect(reason(runtime.startWorkflow("routine", "human:*"))).toBe("reserved-principal");
    expect(reason(runtime.submitApproval("run-1", "human:*", true))).toBe("reserved-principal");
    expect(reason(runtime.halt("human:*"))).toBe("non-human-operator");
  });
});

describe("operator emergency stop (RFC-0004 control events)", () => {
  it("halts and resumes via attributable, runtime-scoped control events", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    runtime.startWorkflow("incident-response", "human:on-call");

    expect(reason(runtime.halt("agent:operations.coordinator"))).toBe("non-human-operator");
    expect(runtime.halt("human:operator")).toEqual({ ok: true });

    // While halted, nothing dispatches — initiation, approvals, and reports refuse.
    expect(reason(runtime.startWorkflow("build-feature", "human:on-call"))).toBe("halted");
    expect(reason(runtime.reportTask("run-1", "completed"))).toBe("halted");
    expect(reason(runtime.halt("human:operator"))).toBe("halted");
    expect(runtime.state().halted).toBe(true);

    const halted = runtime.events().at(-1)!;
    expect(halted).toMatchObject({ type: "runtime.halted", runId: null, source: "human:operator" });

    // Resume: the in-flight adapter report lands afterwards (disposable state → retry).
    expect(runtime.resume("human:operator")).toEqual({ ok: true });
    expect(runtime.state().halted).toBe(false);
    expect(runtime.reportTask("run-1", "completed").ok).toBe(true);
    expect(reason(runtime.resume("human:operator"))).toBe("not-halted");
  });
});

describe("drain adoption (RFC-0003/ADR-0005)", () => {
  it("keeps in-flight runs on their original revision while new work uses the new model", () => {
    const modelA = exampleModel();
    // Same organization, different mission → different revision, same workflows.
    const modelB = compileModel(
      readFileSync(fileURLToPath(new URL("../../../SPEC/examples/company.yaml", import.meta.url)), "utf8").replace(
        "Build the most reliable billing platform for modern businesses.",
        "Build the most reliable billing platform on earth.",
      ),
    );
    expect(modelB.genomeRevision).not.toBe(modelA.genomeRevision);

    const runtime = createRuntime({ model: modelA, clock: CLOCK });
    runtime.startWorkflow("incident-response", "human:on-call");

    expect(runtime.adoptRevision(modelB)).toEqual({ ok: true });
    expect(reason(runtime.adoptRevision(modelB))).toBe("duplicate-revision");
    expect(runtime.currentRevision()).toBe(modelB.genomeRevision);

    runtime.startWorkflow("incident-response", "human:on-call");
    runtime.reportTask("run-1", "completed"); // in-flight: still revision A

    const byRun = (runId: string) => runtime.events().filter((event) => event.runId === runId);
    expect(byRun("run-1").every((event) => event.genomeRevision === modelA.genomeRevision)).toBe(true);
    expect(byRun("run-2").every((event) => event.genomeRevision === modelB.genomeRevision)).toBe(true);
    expect(runtime.state().runs["run-1"].revision).toBe(modelA.genomeRevision);
  });
});

describe("the log and replay (RFC-0003 constraint 3, RFC-0004 ordering)", () => {
  const drive = (runtime: ReturnType<typeof createRuntime>) => {
    runtime.startWorkflow("build-feature", "human:release-captain");
    runtime.submitApproval("run-1", "human:engineering-manager", true);
    runtime.reportTask("run-1", "completed");
    runtime.startWorkflow("incident-response", "human:on-call");
    runtime.halt("human:operator");
    runtime.resume("human:operator");
    runtime.reportTask("run-2", "completed");
  };

  it("assigns strictly increasing ids and a full envelope to every event", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    drive(runtime);

    const events = runtime.events();
    expect(events.map((event) => event.id)).toEqual(events.map((_, index) => index + 1));
    for (const event of events) {
      expect(event.timestamp).toBe("2026-07-13T00:00:00.000Z");
      expect(event.genomeRevision).toMatch(/^[0-9a-f]{64}$/);
      expect(event.runId === null ? event.type.startsWith("runtime.") : true).toBe(true);
    }
    expect(Object.isFrozen(events[0])).toBe(true);
  });

  it("holds state() == replay(log) by construction, after every kind of operation", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    const seen: RuntimeEvent[] = [];
    runtime.subscribe((event) => seen.push(event));

    drive(runtime);

    expect(runtime.state()).toEqual(replay(runtime.events()));
    expect(seen).toEqual([...runtime.events()]);
    expect(runtime.state().runs["run-1"]).toMatchObject({
      status: "running",
      pendingApprovals: [],
      completedSteps: 1,
      assignedStep: 1,
      initiatedBy: "human:release-captain",
    });
  });

  it("replay is forward-tolerant: event types from later RFCs are inert", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    drive(runtime);
    const future: RuntimeEvent = {
      id: runtime.events().length + 1,
      timestamp: CLOCK(),
      genomeRevision: runtime.currentRevision(),
      runId: null,
      source: "human:operator",
      type: "genome.checkpoint.created",
      payload: {},
    };

    expect(replay([...runtime.events(), future])).toEqual(replay(runtime.events()));
  });

  it("replay folds in id order even when handed a shuffled log", () => {
    const runtime = createRuntime({ model: exampleModel(), clock: CLOCK });
    drive(runtime);

    const shuffled = [...runtime.events()].reverse();
    expect(replay(shuffled)).toEqual(replay(runtime.events()));
  });
});
