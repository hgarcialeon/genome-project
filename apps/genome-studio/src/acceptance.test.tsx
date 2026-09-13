/**
 * Milestone-1 acceptance: the RFC-0009 §7 canonical demonstration, executed as
 * one contiguous sequence.
 *
 * The checkpoint suites already prove each capability in isolation. RFC-0009 §7
 * binds the *sequence* — edit → graph change → run → deny-safe park → grant →
 * attributed completion → event inspection — so this file walks it once, end to
 * end, in a single session, and asserts the transitions between states rather
 * than re-asserting what the checkpoint tests already cover.
 *
 * The real compiler, the real runtime and the real reference adapter run here.
 * Every expectation is taken from what those accepted packages reported for this
 * same execution; nothing is compared against a literal written into Studio.
 *
 * Determinism uses the runtime's own injectable clock (RFC-0004, the `--clock`
 * the CLI exposes for RFC-0008 E9). Studio normalizes no event to obtain it.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";
import { CANONICAL_DOCUMENT, CANONICAL_WORKFLOW } from "./canonical.js";
import { compileDocument } from "./genome/compilation.js";
import { grantApproval, runState, startSession } from "./genome/session.js";

import type { RuntimeEvent } from "@genome/runtime";

/** Long enough that only an explicit Compile advances the projections. */
const NO_AUTO_COMPILE = 1_000_000;
const PRODUCT_OWNER = "human:product-owner";
const FIXED_CLOCK = () => "2026-09-13T00:00:00.000Z";

const editor = (): HTMLTextAreaElement => screen.getByTestId("source") as HTMLTextAreaElement;
const setSource = (source: string) => fireEvent.input(editor(), { target: { value: source } });
const eventTypes = (): string[] => screen.getAllByTestId("event-type").map((e) => e.textContent ?? "");
const treeLabels = (): string[] => screen.getAllByTestId("tree-item").map((e) => e.textContent ?? "");
const graphNodeIds = (): string[] =>
  screen.getAllByTestId("graph-index-node").map((e) => e.getAttribute("data-node-id") ?? "");

/** A structural edit, per §7.1: adds an agent — structure, never mutable state. */
const ADDED_AGENT = "technical-writer";
const STRUCTURAL_EDIT = (source: string): string =>
  source.replace(
    "\nworkflows:",
    `\n      ${ADDED_AGENT}:\n        role: Technical Writer\n        autonomy: supervised\n\nworkflows:`,
  );

describe("RFC-0009 §7 — the canonical demonstration, as one sequence", () => {
  it("walks edit → graph change → run → park → grant → completion → inspection", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    // ---- 1. The starting organization, as the compiler reported it ----------
    const opened = compileDocument(CANONICAL_DOCUMENT);
    if (!opened.ok) throw new Error("the canonical document must compile");

    expect(screen.getByTestId("revision").textContent).toContain(opened.revision.slice(0, 12));
    expect(screen.queryByTestId("projection-stale")).toBeNull();
    const labelsBefore = treeLabels();
    const nodesBefore = graphNodeIds();
    expect(nodesBefore).not.toContain(`agent:engineering.${ADDED_AGENT}`);

    // ---- 2. A structural edit goes stale before it is compiled -------------
    // The projections must never silently describe a source they came from.
    const editedSource = STRUCTURAL_EDIT(CANONICAL_DOCUMENT);
    expect(editedSource).not.toBe(CANONICAL_DOCUMENT);
    setSource(editedSource);

    expect(screen.getAllByTestId("projection-stale").length).toBeGreaterThan(0);
    expect(graphNodeIds()).toEqual(nodesBefore); // still the last good revision
    expect(screen.getByTestId("run-readiness").textContent).toContain("Not runnable");

    // ---- 3. Compiling adopts the compiler's new graph and tree -------------
    const edited = compileDocument(editedSource);
    if (!edited.ok) throw new Error("the edited document must compile");
    expect(edited.revision).not.toBe(opened.revision);

    await user.click(screen.getByTestId("compile-now"));

    expect(screen.queryByTestId("projection-stale")).toBeNull();
    expect(screen.getByTestId("revision").textContent).toContain(edited.revision.slice(0, 12));

    // The change is visible in both projections, and is the compiler's change.
    const nodesAfter = graphNodeIds();
    expect(nodesAfter).not.toEqual(nodesBefore);
    expect(nodesAfter).toContain(`agent:engineering.${ADDED_AGENT}`);
    expect(nodesAfter).toHaveLength(nodesBefore.length + 1);
    expect(treeLabels()).not.toEqual(labelsBefore);
    expect(treeLabels()).toContain(ADDED_AGENT);
    expect(nodesAfter).toEqual(edited.graphProjection.nodes.map((n) => n.id));

    // ---- 4. Restore the canonical document for the governed run ------------
    // §7 binds the demonstration to the canonical document as published.
    setSource(CANONICAL_DOCUMENT);
    await user.click(screen.getByTestId("compile-now"));
    expect(screen.queryByTestId("projection-stale")).toBeNull();
    expect(screen.getByTestId("revision").textContent).toContain(opened.revision.slice(0, 12));

    // ---- 5. Run rfc-lifecycle with no grant: deny-safe park ----------------
    expect((screen.getByTestId("workflow-select") as HTMLSelectElement).value).toBe(CANONICAL_WORKFLOW);
    await user.click(screen.getByTestId("run-workflow"));

    await waitFor(() => expect(screen.getByTestId("session")).toBeTruthy());

    // What the runtime reported for this very run is the only reference.
    const parkedEvents = eventTypes();
    expect(parkedEvents.filter((t) => t === "approval.requested")).toHaveLength(1);
    expect(parkedEvents).not.toContain("agent.task.assigned");
    expect(parkedEvents).not.toContain("workflow.completed");
    expect(screen.getByTestId("session-steps").textContent).toContain("0");

    // The gate is real and traceable: the policy and principal come from the
    // runtime's own request, not from a label Studio chose.
    const requiredPrincipal = screen.getByTestId("required-principal").textContent ?? "";
    expect(requiredPrincipal).toContain(PRODUCT_OWNER);
    expect(screen.getByTestId("approval-policy-label").textContent).toBeTruthy();
    expect(screen.getByTestId("approval-source").textContent).toBeTruthy();

    // Nothing was granted on Studio's own initiative.
    expect(screen.queryByTestId("granted-record")).toBeNull();

    // ---- 6. The explicit grant completes the run --------------------------
    await user.click(screen.getByTestId("grant-button"));

    await waitFor(() => expect(eventTypes()).toContain("workflow.completed"));

    // ---- 7. Inspect the sequence the runtime emitted ----------------------
    const finalEvents = eventTypes();

    // Attribution is the runtime's, and the grant precedes all work (E6).
    expect(screen.getByTestId("granted-by").textContent).toContain(PRODUCT_OWNER);
    const grantedAt = finalEvents.indexOf("approval.granted");
    const firstStepAt = finalEvents.indexOf("agent.task.assigned");
    expect(grantedAt).toBeGreaterThanOrEqual(0);
    expect(firstStepAt).toBeGreaterThan(grantedAt);

    // Continuity: the park is still on screen after completion. The stream is a
    // record of the whole session, not just its latest state.
    expect(finalEvents.filter((t) => t === "approval.requested")).toHaveLength(1);
    expect(finalEvents.indexOf("approval.requested")).toBeLessThan(grantedAt);
    expect(finalEvents[finalEvents.length - 1]).toBe("workflow.completed");

    // The same journey, driven directly against the accepted packages, emits the
    // same sequence — so the screen is a projection, not a retelling.
    const reference: RuntimeEvent[] = [];
    const outcome = startSession({
      model: opened.runtimeModel,
      workflowId: CANONICAL_WORKFLOW,
      onEvent: (event) => reference.push(event),
    });
    if (!outcome.ok) throw new Error(`refused: ${outcome.refusal.reason}`);
    const referenceParked = runState(outcome.session)!;
    expect(referenceParked.completedSteps).toBe(0); // parked before any work
    expect(referenceParked.pendingApprovals).toContain(PRODUCT_OWNER);
    const granted = grantApproval(outcome.session, PRODUCT_OWNER);
    if (!granted.ok) throw new Error(`reference grant refused: ${granted.reason}`);

    expect(finalEvents).toEqual(reference.map((e) => e.type));
    expect(runState(outcome.session)!.status).toBe("completed");
  });

  it("is byte-deterministic under the runtime's accepted fixed clock (E9)", () => {
    const compiled = compileDocument(CANONICAL_DOCUMENT);
    if (!compiled.ok) throw new Error("the canonical document must compile");

    // The whole journey, twice, through Studio's session boundary. Determinism
    // comes from the runtime's injectable clock; Studio changes no event.
    const journey = (): string => {
      const events: RuntimeEvent[] = [];
      const outcome = startSession({
        model: compiled.runtimeModel,
        workflowId: CANONICAL_WORKFLOW,
        onEvent: (event) => events.push(event),
        clock: FIXED_CLOCK,
      });
      if (!outcome.ok) throw new Error(`refused: ${outcome.refusal.reason}`);
      const grant = grantApproval(outcome.session, PRODUCT_OWNER);
      if (!grant.ok) throw new Error(`grant refused: ${grant.reason}`);
      return JSON.stringify(events);
    };

    const first = journey();
    expect(journey()).toBe(first);

    // And it is a real run, not an empty one.
    const replayed = JSON.parse(first) as RuntimeEvent[];
    expect(replayed.map((e) => e.type)).toContain("workflow.completed");
    expect(replayed.every((e) => e.timestamp === FIXED_CLOCK())).toBe(true);
  });
});
