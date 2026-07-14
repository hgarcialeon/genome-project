/**
 * Unit tests for the reference adapter's normative contract (RFC-0006):
 * enqueue-only dispatch, FIFO settlement to quiescence, termination on the
 * first refused report (hold-at-head), qualified-over-bare failSteps, and
 * the fixed failure detail. The adapter is driven against the real runtime
 * so the synchronous dispatch-inside-settle chain is the one exercised.
 */

import { createRuntime, type RuntimeOptions } from "@genome/runtime";
import { describe, expect, it } from "vitest";

import { createReferenceAdapter, type ReferenceAdapterOptions } from "./index.js";

/** A minimal hand-written runtime model: one autonomous agent, one workflow. */
const model: RuntimeOptions["model"] = {
  genomeRevision: "rev-test",
  company: { name: "Fixture Co" },
  departments: [{ id: "department:eng", label: "eng" }],
  teams: [],
  agents: [
    {
      id: "agent:eng.dev",
      reference: "eng.dev",
      label: "dev",
      autonomy: "autonomous",
      skills: [],
      memberOf: "department:eng",
      governedBy: [],
    },
  ],
  workflows: [
    {
      id: "workflow:ship",
      workflowId: "ship",
      owner: "agent:eng.dev",
      trigger: "manual",
      steps: ["one", "two", "three"],
      governedBy: [],
    },
  ],
  policies: [],
  integrations: [],
  objectives: [],
  metrics: [],
  memoryStores: [],
};

function boundRuntime(options?: ReferenceAdapterOptions) {
  const adapter = createReferenceAdapter(options);
  const runtime = createRuntime({ model, adapter, clock: () => "2026-01-01T00:00:00.000Z" });
  adapter.bind(runtime);
  return { adapter, runtime };
}

describe("createReferenceAdapter", () => {
  it("dispatch enqueues only and never re-enters the runtime", () => {
    const { adapter, runtime } = boundRuntime();
    runtime.startWorkflow("ship", "human:operator");

    // The first task was dispatched but nothing was reported back yet.
    expect(adapter.dispatched).toHaveLength(1);
    expect(adapter.dispatched[0]).toMatchObject({ workflowId: "ship", step: "one", index: 0 });
    const run = runtime.state().runs["run-1"];
    expect(run.status).toBe("running");
    expect(run.completedSteps).toBe(0);
    expect(run.assignedStep).toBe(0);
  });

  it("settle drives all steps to completion in FIFO order", () => {
    const { adapter, runtime } = boundRuntime();
    runtime.startWorkflow("ship", "human:operator");
    adapter.settle();

    const run = runtime.state().runs["run-1"];
    expect(run.status).toBe("completed");
    expect(run.completedSteps).toBe(3);
    expect(adapter.dispatched.map((task) => task.step)).toEqual(["one", "two", "three"]);
    expect(runtime.events().map((event) => event.type)).toEqual([
      "workflow.started",
      "agent.task.assigned",
      "agent.task.completed",
      "agent.task.assigned",
      "agent.task.completed",
      "agent.task.assigned",
      "agent.task.completed",
      "workflow.completed",
    ]);
  });

  it("fails a bare-named step with the fixed detail", () => {
    const { adapter, runtime } = boundRuntime({ failSteps: ["two"] });
    runtime.startWorkflow("ship", "human:operator");
    adapter.settle();

    const run = runtime.state().runs["run-1"];
    expect(run.status).toBe("failed");
    expect(run.completedSteps).toBe(1);
    const failed = runtime.events().find((event) => event.type === "agent.task.failed");
    expect(failed?.payload).toMatchObject({ step: "two", detail: "simulated failure" });
  });

  it("matches a qualified failStep only in the named workflow", () => {
    const { adapter, runtime } = boundRuntime({ failSteps: ["ship:two"] });
    runtime.startWorkflow("ship", "human:operator");
    adapter.settle();
    expect(runtime.state().runs["run-1"].status).toBe("failed");

    // A qualification naming another workflow does not fail this one.
    const other = boundRuntime({ failSteps: ["other-workflow:two"] });
    other.runtime.startWorkflow("ship", "human:operator");
    other.adapter.settle();
    expect(other.runtime.state().runs["run-1"].status).toBe("completed");
  });

  it("returns immediately on a refused report, holding the task at the head", () => {
    const { adapter, runtime } = boundRuntime();
    runtime.startWorkflow("ship", "human:operator");
    runtime.halt("human:operator");

    // The report is refused (halted); settle terminates without draining.
    adapter.settle();
    let run = runtime.state().runs["run-1"];
    expect(run.completedSteps).toBe(0);
    expect(run.assignedStep).toBe(0);

    // The held task is disposable state: a later settle resumes cleanly.
    runtime.resume("human:operator");
    adapter.settle();
    run = runtime.state().runs["run-1"];
    expect(run.status).toBe("completed");
    expect(run.completedSteps).toBe(3);
    // No re-dispatch happened: three tasks total, in order.
    expect(adapter.dispatched.map((task) => task.step)).toEqual(["one", "two", "three"]);
  });

  it("throws when settle must report before bind", () => {
    const adapter = createReferenceAdapter();
    adapter.dispatch({ runId: "run-1", workflowId: "ship", agent: "agent:eng.dev", step: "one", index: 0 });
    expect(() => adapter.settle()).toThrow(/bind/);
  });

  it("settle on an empty queue is a no-op", () => {
    const adapter = createReferenceAdapter();
    expect(() => adapter.settle()).not.toThrow();
    expect(adapter.dispatched).toHaveLength(0);
  });
});
