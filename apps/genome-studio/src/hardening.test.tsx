/**
 * Hardening: what the experience does when things go wrong.
 *
 * Every failure exercised here is one the accepted packages actually produce —
 * a parser rejection, a runtime refusal, the reference adapter's own failure
 * control — never a mocked one. The question each test asks is the same:
 * afterwards, can the user still tell what happened, what is still valid, and
 * what to do next?
 */

import { fireEvent, render, screen } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";
import { CANONICAL_DOCUMENT, CANONICAL_WORKFLOW } from "./canonical.js";
import { ExecutionPanel } from "./components/ExecutionPanel.js";
import { compileDocument } from "./genome/compilation.js";
import { grantApproval, runState, startSession, type StudioSession } from "./genome/session.js";

import type { RuntimeEvent } from "@genome/runtime";

const NO_AUTO_COMPILE = 1_000_000;
const PRODUCT_OWNER = "human:product-owner";

const canonical = compileDocument(CANONICAL_DOCUMENT);
if (!canonical.ok) throw new Error("the canonical document must compile");

const editor = (): HTMLTextAreaElement => screen.getByTestId("source") as HTMLTextAreaElement;
const setSource = (source: string) => fireEvent.input(editor(), { target: { value: source } });

/** A document whose workflow has no owner: the runtime refuses to start it. */
const OWNERLESS_DOCUMENT = `genomeVersion: 0.1

company:
  name: Ownerless Co

workflows:
  unowned-flow:
    trigger: manual
    steps:
      - plan
`;

/** Long, awkward, entirely legal identifiers. */
const LONG_DOCUMENT = `genomeVersion: 0.1

company:
  name: An Organization With A Considerably Longer Name Than Usual

departments:
  organizational-development-and-transformation:
    agents:
      principal-governance-and-compliance-architect:
        role: Principal Governance and Compliance Architect
        autonomy: manual

workflows:
  quarterly-governance-review-and-ratification-cycle:
    owner: organizational-development-and-transformation.principal-governance-and-compliance-architect
    trigger: manual
    steps:
      - prepare
      - ratify

policies:
  quarterly-governance-ratification-sign-off-policy:
    appliesTo:
      - quarterly-governance-review-and-ratification-cycle
    requiresApprovalFrom:
      - human:chief-governance-and-compliance-officer
`;

/** A session whose steps the reference adapter is told to fail. */
const failedSession = (): { session: StudioSession; events: RuntimeEvent[] } => {
  const events: RuntimeEvent[] = [];
  const outcome = startSession({
    model: canonical.runtimeModel,
    workflowId: CANONICAL_WORKFLOW,
    onEvent: (event) => events.push(event),
    failSteps: ["draft"],
  });
  if (!outcome.ok) throw new Error(`unexpected refusal: ${outcome.refusal.reason}`);
  const granted = grantApproval(outcome.session, PRODUCT_OWNER);
  if (!granted.ok) throw new Error(`unexpected grant refusal: ${granted.reason}`);
  return { session: outcome.session, events };
};

describe("authoring recovery", () => {
  it("walks valid → edited → invalid → corrected without ever misrepresenting the projection", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    // Valid and current.
    expect(screen.getByTestId("run-eligibility").textContent).toContain("Runs the current revision");
    expect(screen.queryByTestId("projection-stale")).toBeNull();

    // Edited: stale, not runnable, projections retained.
    setSource(`${CANONICAL_DOCUMENT}\n# a trailing comment\n`);
    expect(screen.getAllByTestId("projection-stale").length).toBeGreaterThan(0);
    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(true);

    // Invalid: diagnostics for the current source, projections still there and still marked.
    setSource("company: [unclosed");
    await user.click(screen.getByTestId("compile-now"));
    expect(screen.getByTestId("compilation-status").textContent).toContain("Invalid");
    expect(screen.getAllByTestId("diagnostic-message").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("projection-stale").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("graph-index-node").length).toBeGreaterThan(0);
    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(true);

    // Corrected: diagnostics clear, currency returns, running is possible again.
    setSource(CANONICAL_DOCUMENT);
    expect(screen.getByTestId("compilation-status").textContent).toContain("Compiled");
    expect(screen.queryAllByTestId("diagnostic-message").length).toBe(0);
    expect(screen.queryByTestId("projection-stale")).toBeNull();
    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(false);
  });

  it("never steals focus from the editor as diagnostics come and go", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    editor().focus();
    setSource("company: [unclosed");
    expect(document.activeElement).toBe(editor());

    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(screen.getByTestId("compilation-status").textContent).toContain("Invalid");
    expect(document.activeElement).toBe(editor());

    setSource(CANONICAL_DOCUMENT);
    expect(document.activeElement).toBe(editor());
  });
});

describe("runtime refusal", () => {
  it("shows the runtime's refusal and keeps everything else intact", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource(OWNERLESS_DOCUMENT);
    await user.click(screen.getByTestId("compile-now"));
    fireEvent.change(screen.getByTestId("workflow-select"), { target: { value: "unowned-flow" } });
    await user.click(screen.getByTestId("run-workflow"));

    // The refusal is the runtime's word, shown beside the control that failed.
    expect(screen.getByTestId("session-idle")).toBeTruthy();
    expect(screen.getByTestId("start-refusal-reason").textContent).toBe("ownerless-workflow");
    expect(screen.getByTestId("start-refusal").textContent).toContain("unowned-flow");
    expect(screen.getByTestId("session-announcement").textContent).toContain("ownerless-workflow");
    expect(screen.queryByTestId("completion-record")).toBeNull();
    expect(screen.queryAllByTestId("event").length).toBe(0);
    // The organization is still on screen, and the document is still valid.
    expect(screen.getByTestId("compilation-status").textContent).toContain("Compiled");
    expect(screen.getAllByTestId("graph-index-node").length).toBeGreaterThan(0);
  });
});

describe("adapter failure", () => {
  it("reports the runtime's failure, keeps the evidence, and claims no completion", () => {
    const { session, events } = failedSession();
    const run = runState(session);

    expect(run?.status).toBe("failed");
    render(
      <ExecutionPanel
        workflows={canonical.runtimeModel.workflows}
        selectedWorkflowId={CANONICAL_WORKFLOW}
        onSelectWorkflow={() => undefined}
        canRun={true}
        onRun={() => undefined}
        onReset={() => undefined}
        onGrant={() => undefined}
        view={{ session, run, events }}
        sourceRevision={session.genomeRevision}
      />,
    );

    expect(screen.getByTestId("session-status").textContent).toContain("Failed");
    expect(screen.queryByTestId("completion-record")).toBeNull();
    expect(screen.getByTestId("failure-summary").textContent).toContain("failed");
    expect(screen.getAllByTestId("failure-record").length).toBeGreaterThan(0);
    // The approval that happened before the failure is still recorded.
    expect(screen.getByTestId("granted-by").textContent).toBe(PRODUCT_OWNER);
    // No retry is offered, because the runtime has none.
    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });
});

describe("approval refusal", () => {
  it("refuses an unmatched principal, grants nothing, and still allows the valid grant", () => {
    const events: RuntimeEvent[] = [];
    const outcome = startSession({
      model: canonical.runtimeModel,
      workflowId: CANONICAL_WORKFLOW,
      onEvent: (event) => events.push(event),
    });
    if (!outcome.ok) throw new Error("the canonical run must start");

    const refused = grantApproval(outcome.session, "human:someone-else");
    expect(refused.ok).toBe(false);
    expect(refused.ok === false ? refused.reason : "").toBe("unmatched-principal");
    // Nothing was approved and nothing moved.
    expect(events.some((event) => event.type === "approval.granted")).toBe(false);
    expect(runState(outcome.session)?.status).toBe("pending-approval");
    expect(runState(outcome.session)?.pendingApprovals).toEqual([PRODUCT_OWNER]);

    render(
      <ExecutionPanel
        workflows={canonical.runtimeModel.workflows}
        selectedWorkflowId={CANONICAL_WORKFLOW}
        onSelectWorkflow={() => undefined}
        canRun={true}
        onRun={() => undefined}
        onReset={() => undefined}
        onGrant={() => undefined}
        view={{
          session: outcome.session,
          run: runState(outcome.session),
          events,
          grantRefusal: refused.ok === false ? refused.reason : undefined,
        }}
        sourceRevision={outcome.session.genomeRevision}
      />,
    );

    expect(screen.getByTestId("grant-refusal").textContent).toContain("unmatched-principal");
    expect(screen.getByTestId("evidence-none")).toBeTruthy();
    expect(screen.getByTestId("waiting")).toBeTruthy();
    expect(screen.getByTestId("grant-button").textContent).toContain(PRODUCT_OWNER);

    // The runtime still accepts the right principal afterwards.
    const accepted = grantApproval(outcome.session, PRODUCT_OWNER);
    expect(accepted.ok).toBe(true);
    expect(runState(outcome.session)?.status).toBe("completed");
  });
});

describe("interaction locking", () => {
  it("replaces rather than accumulates sessions when Run is activated repeatedly", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    const first = screen.getByTestId("session-run-id").textContent;
    await user.click(screen.getByTestId("run-workflow"));
    await user.click(screen.getByTestId("run-workflow"));

    // One session on screen, one approval request in it — not three sessions' worth.
    expect(screen.getAllByTestId("session").length).toBe(1);
    expect(screen.getAllByTestId("event").length).toBe(1);
    expect(screen.getByTestId("session-run-id").textContent).toBe(first);
    expect(screen.getAllByTestId("grant-button").length).toBe(1);
  });

  it("keeps graph and tree interactions away from execution", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    const before = screen.getAllByTestId("event").length;

    await user.click(screen.getAllByTestId("graph-index-node")[2]);
    await user.click(screen.getAllByRole("button", { expanded: true })[0]);

    expect(screen.getAllByTestId("event").length).toBe(before);
    expect(screen.getByTestId("session-status").textContent).toContain("Parked");
  });
});

describe("focus recovery", () => {
  it("moves focus to the evidence when the grant control it replaces disappears", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    const grantButton = screen.getByTestId("grant-button");
    grantButton.focus();
    await user.keyboard("{Enter}");

    expect(screen.queryByTestId("grant-button")).toBeNull();
    expect(document.activeElement).toBe(screen.getByTestId("evidence"));
  });

  it("returns focus to Run after a session is discarded", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(screen.getByTestId("run-workflow"));
    await user.click(screen.getByTestId("reset-session"));

    expect(document.activeElement).toBe(screen.getByTestId("run-workflow"));
    expect(screen.getByTestId("session-idle")).toBeTruthy();
    expect(screen.getByTestId("events-empty")).toBeTruthy();
  });
});

describe("bypassing the graph index", () => {
  it("offers skip links to the two places work happens, before anything else", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.tab();
    const first = document.activeElement as HTMLAnchorElement;
    expect(first.textContent).toContain("Skip to governance and execution");
    expect(document.querySelector(first.getAttribute("href") ?? "")).toBeTruthy();

    await user.tab();
    const second = document.activeElement as HTMLAnchorElement;
    expect(second.textContent).toContain("Skip to the source document");
    expect(document.querySelector(second.getAttribute("href") ?? "")).toBeTruthy();
  });
});

describe("keyboard-only critical path", () => {
  it("runs, grants and discards without a single pointer event", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    screen.getByTestId("workflow-select").focus();
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(screen.getByTestId("run-workflow"));
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("session-status").textContent).toContain("Parked");

    screen.getByTestId("grant-button").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("session-status").textContent).toContain("Completed");

    screen.getByTestId("reset-session").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("session-idle")).toBeTruthy();
  });
});

describe("long and awkward content", () => {
  it("keeps every long identifier fully available, however it is displayed", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource(LONG_DOCUMENT);
    await user.click(screen.getByTestId("compile-now"));

    const longWorkflow = "quarterly-governance-review-and-ratification-cycle";
    const longPrincipal = "human:chief-governance-and-compliance-officer";

    // Truncated in the drawing, complete in the graph's text representation.
    const listed = screen
      .getAllByTestId("graph-index-node")
      .map((element) => element.textContent ?? "")
      .join(" ");
    expect(listed).toContain(longWorkflow);
    const titles = Array.from(document.querySelectorAll("title")).map((title) => title.textContent ?? "");
    expect(titles.join(" ")).toContain(longWorkflow);

    fireEvent.change(screen.getByTestId("workflow-select"), { target: { value: longWorkflow } });
    await user.click(screen.getByTestId("run-workflow"));

    expect(screen.getByTestId("session-workflow").textContent).toBe(longWorkflow);
    expect(screen.getAllByTestId("required-principal")[0].textContent).toBe(longPrincipal);
    expect(screen.getByTestId("grant-button").textContent).toContain(longPrincipal);
  });
});
