/**
 * The canonical Governed Authoring journey: park → explicit grant → attributed
 * completion, with the whole record still on screen at the end.
 *
 * The real compiler, runtime and reference adapter run here. What the UI shows
 * is compared against what the runtime emitted for the same execution — never
 * against values written into Studio, and never against the label of the button
 * that was pressed.
 */

import { fireEvent, render, screen } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";
import { CANONICAL_DOCUMENT, CANONICAL_WORKFLOW } from "./canonical.js";
import { compileDocument } from "./genome/compilation.js";
import { grantApproval, runState, startSession } from "./genome/session.js";

import type { RuntimeEvent } from "@genome/runtime";

const NO_AUTO_COMPILE = 1_000_000;
const PRODUCT_OWNER = "human:product-owner";

const canonical = compileDocument(CANONICAL_DOCUMENT);
if (!canonical.ok) throw new Error("the canonical document must compile");

/** The same journey, executed directly against the accepted runtime. */
const referenceJourney = () => {
  const events: RuntimeEvent[] = [];
  const outcome = startSession({
    model: canonical.runtimeModel,
    workflowId: CANONICAL_WORKFLOW,
    onEvent: (event) => events.push(event),
  });
  if (!outcome.ok) throw new Error(`refused: ${outcome.refusal.reason}`);
  const parked = { ...runState(outcome.session)! };
  const grant = grantApproval(outcome.session, PRODUCT_OWNER);
  if (!grant.ok) throw new Error(`the reference grant was refused: ${grant.reason}`);
  return { events, parked, completed: runState(outcome.session)! };
};

/** A document with none of the canonical names, to prove nothing is hardcoded. */
const OTHER_DOCUMENT = `genomeVersion: 0.1

company:
  name: Northwind Books
  mission: Close the books accurately, every month.

departments:
  finance:
    agents:
      controller:
        role: Financial Controller
        autonomy: manual

workflows:
  close-books:
    owner: finance.controller
    trigger: manual
    steps:
      - reconcile
      - review

policies:
  budget-sign-off:
    appliesTo:
      - close-books
    requiresApprovalFrom:
      - human:finance-lead
`;

const editor = (): HTMLTextAreaElement => screen.getByTestId("source") as HTMLTextAreaElement;
const setSource = (source: string) => fireEvent.input(editor(), { target: { value: source } });
const eventTypes = (): string[] => screen.getAllByTestId("event-type").map((element) => element.textContent ?? "");
const renameCompany = (source: string) => source.replace("name: Genome Project", "name: Genome Studio");

describe("the canonical journey", () => {
  it("parks, waits for the explicit grant, then completes with the runtime's attribution", async () => {
    const user = userEvent.setup();
    const reference = referenceJourney();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    // 1. Run, and park deny-safe.
    await user.click(screen.getByTestId("run-workflow"));

    expect(screen.getByTestId("session-status").textContent).toContain("Parked");
    expect(screen.getByTestId("session-steps").textContent).toBe("0");
    expect(reference.parked.completedSteps).toBe(0);
    expect(eventTypes()).toContain("approval.requested");
    expect(eventTypes()).not.toContain("approval.granted");
    expect(screen.getAllByTestId("required-principal").map((element) => element.textContent)).toEqual(
      reference.parked.pendingApprovals,
    );
    expect(screen.getByTestId("evidence-none")).toBeTruthy();

    // 2. The explicit act, named for the principal it is attributed to.
    const grantButton = screen.getByTestId("grant-button");
    expect(grantButton.textContent).toContain(`Grant as ${PRODUCT_OWNER}`);
    await user.click(grantButton);

    // 3. The runtime emitted the approval, and Studio shows *its* attribution.
    const granted = reference.events.find((event) => event.type === "approval.granted");
    expect(granted).toBeDefined();
    expect(screen.getByTestId("granted-by").textContent).toBe(granted?.source);
    expect(granted?.source).toBe(PRODUCT_OWNER);
    expect(granted?.payload.principal).toBe(PRODUCT_OWNER);

    // 4. Execution continued and completed, as the runtime reports it.
    expect(reference.completed.status).toBe("completed");
    expect(screen.getByTestId("session-status").textContent).toContain("Completed");
    expect(screen.getByTestId("session-steps").textContent).toBe(String(reference.completed.completedSteps));
    expect(screen.getByTestId("completion-record").textContent).toContain(CANONICAL_WORKFLOW);
    expect(screen.getByTestId("completion-record").textContent).toContain(String(reference.completed.completedSteps));

    // 5. The whole story is still on screen — the park was not swept away.
    const types = eventTypes();
    expect(types).toContain("approval.requested");
    expect(types).toContain("approval.granted");
    expect(types).toContain("workflow.completed");
    expect(types).toEqual(reference.events.map((event) => event.type));
  });

  it("orders the grant before any work, as the runtime emitted it", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    await user.click(screen.getByTestId("grant-button"));

    const types = eventTypes();
    const requested = types.indexOf("approval.requested");
    const grantedAt = types.indexOf("approval.granted");
    const firstWork = types.findIndex((type) => type === "workflow.started" || type.startsWith("agent.task."));
    const completed = types.indexOf("workflow.completed");

    expect(requested).toBeGreaterThanOrEqual(0);
    expect(requested).toBeLessThan(grantedAt);
    expect(grantedAt).toBeLessThan(firstWork);
    expect(firstWork).toBeLessThan(completed);
  });

  it("shows exactly the runtime's events, envelope for envelope, after the grant", async () => {
    const user = userEvent.setup();
    const reference = referenceJourney();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    await user.click(screen.getByTestId("grant-button"));

    const rendered = screen.getAllByTestId("event");
    expect(rendered.map((element) => Number(element.getAttribute("data-event-id")))).toEqual(
      reference.events.map((event) => event.id),
    );

    for (const [index, toggle] of screen.getAllByTestId("event-details-toggle").entries()) {
      await user.click(toggle);
      const shown = JSON.parse(screen.getAllByTestId("event-raw")[index].textContent ?? "{}") as RuntimeEvent;
      const emitted = reference.events[index];
      // Timestamps are informational and never ordering (RFC-0004); the two
      // executions ran milliseconds apart. Everything else must be identical.
      const { timestamp: shownAt, ...shownRest } = shown;
      const { timestamp: emittedAt, ...emittedRest } = emitted;
      expect(shownRest).toEqual(emittedRest);
      expect(Number.isNaN(Date.parse(shownAt))).toBe(false);
      expect(Number.isNaN(Date.parse(emittedAt))).toBe(false);
    }
  });
});

describe("no automatic approval", () => {
  it("stays parked while unrelated controls are used", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    const before = screen.getAllByTestId("event").map((element) => element.getAttribute("data-event-id"));

    await user.click(screen.getAllByTestId("event-details-toggle")[0]);
    await user.click(screen.getAllByTestId("graph-index-node")[0]);
    await user.click(screen.getByTestId("compile-now"));

    expect(screen.getAllByTestId("event").map((element) => element.getAttribute("data-event-id"))).toEqual(before);
    expect(eventTypes()).not.toContain("approval.granted");
    expect(screen.getByTestId("session-status").textContent).toContain("Parked");
    expect(screen.getByTestId("session-steps").textContent).toBe("0");
    expect(screen.getByTestId("evidence-none")).toBeTruthy();
  });
});

describe("grant safety", () => {
  it("stops offering the action once the runtime reports nothing pending", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    await user.click(screen.getByTestId("grant-button"));

    expect(screen.queryByTestId("grant-button")).toBeNull();
    expect(screen.queryByTestId("waiting")).toBeNull();
    expect(screen.getAllByTestId("granted-record").length).toBe(1);
  });

  it("grants once from the keyboard, exactly as from the pointer", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    const grantButton = screen.getByTestId("grant-button");
    grantButton.focus();
    await user.keyboard("{Enter}");

    expect(screen.getAllByTestId("granted-record").length).toBe(1);
    expect(eventTypes().filter((type) => type === "approval.granted").length).toBe(1);
    expect(screen.getByTestId("session-status").textContent).toContain("Completed");
  });
});

describe("the approval UI is not written for the demo", () => {
  it("shows whatever policy and principal another document's runtime reports", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource(OTHER_DOCUMENT);
    await user.click(screen.getByTestId("compile-now"));

    // The selector, too, comes from that document's runtime model.
    fireEvent.change(screen.getByTestId("workflow-select"), { target: { value: "close-books" } });
    await user.click(screen.getByTestId("run-workflow"));

    expect(screen.getByTestId("session-workflow").textContent).toBe("close-books");
    expect(screen.getByTestId("approval-policy-label").textContent).toBe("budget-sign-off");
    expect(screen.getByTestId("approval-source").textContent).toBe("policy:budget-sign-off");
    expect(screen.getAllByTestId("required-principal")[0].textContent).toBe("human:finance-lead");

    const grantButton = screen.getByTestId("grant-button");
    expect(grantButton.textContent).toContain("Grant as human:finance-lead");
    await user.click(grantButton);

    expect(screen.getByTestId("granted-by").textContent).toBe("human:finance-lead");
    expect(screen.getByTestId("session-status").textContent).toContain("Completed");
    expect(screen.getByTestId("session-steps").textContent).toBe("2");
  });
});

describe("granting under divergence", () => {
  it("acts on the parked session, never on the edited source", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    setSource(renameCompany(CANONICAL_DOCUMENT));
    expect(screen.getByTestId("session-divergent")).toBeTruthy();

    await user.click(screen.getByTestId("grant-button"));

    expect(screen.getByTestId("session-revision").textContent).toBe(canonical.revision);
    expect(screen.getByTestId("session-status").textContent).toContain("Completed");
    expect(screen.getByTestId("session-divergent")).toBeTruthy();
    // Granting compiled nothing: the editor's source is still uncompiled.
    expect(screen.getByTestId("compilation-status").textContent).toContain("Edited");
  });
});

describe("discarding after completion", () => {
  it("clears the session, its events and its controls", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    await user.click(screen.getByTestId("grant-button"));
    expect(screen.getByTestId("completion-record")).toBeTruthy();

    await user.click(screen.getByTestId("reset-session"));

    expect(screen.getByTestId("session-idle")).toBeTruthy();
    expect(screen.getByTestId("events-empty")).toBeTruthy();
    expect(screen.queryByTestId("evidence")).toBeNull();
    expect(screen.queryByTestId("grant-button")).toBeNull();
  });
});
