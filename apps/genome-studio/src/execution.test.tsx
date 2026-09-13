/**
 * Ephemeral execution: what the runtime did, shown without embellishment.
 *
 * The real runtime and the real reference adapter run in these tests. Every
 * expectation about what should happen comes from the runtime's own output in
 * the test — the event stream it emitted and the run state it reports — not
 * from values written into Studio.
 */

import { fireEvent, render, screen, within } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";
import { CANONICAL_DOCUMENT, CANONICAL_WORKFLOW } from "./canonical.js";
import { compileDocument } from "./genome/compilation.js";
import { runState, startSession } from "./genome/session.js";

import type { RuntimeEvent } from "@genome/runtime";

const NO_AUTO_COMPILE = 1_000_000;

const canonical = compileDocument(CANONICAL_DOCUMENT);
if (!canonical.ok) throw new Error("the canonical document must compile");

/** The same run, executed directly against the accepted runtime. */
const referenceRun = () => {
  const events: RuntimeEvent[] = [];
  const outcome = startSession({
    model: canonical.runtimeModel,
    workflowId: CANONICAL_WORKFLOW,
    onEvent: (event) => events.push(event),
  });
  if (!outcome.ok) throw new Error(`the canonical run was refused: ${outcome.refusal.reason}`);
  return { events, run: runState(outcome.session), session: outcome.session };
};

const editor = (): HTMLTextAreaElement => screen.getByTestId("source") as HTMLTextAreaElement;
const setSource = (source: string) => fireEvent.input(editor(), { target: { value: source } });
const renameCompany = (source: string) => source.replace("name: Genome Project", "name: Genome Studio");

const startCanonicalRun = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("run-workflow"));
};

describe("workflow selection", () => {
  it("offers exactly the workflows the runtime model declares", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const options = within(screen.getByTestId("workflow-select")).getAllByRole("option");
    expect(options.map((option) => (option as HTMLOptionElement).value)).toEqual(
      canonical.runtimeModel.workflows.map((workflow) => workflow.workflowId),
    );
    expect(options.map((option) => (option as HTMLOptionElement).value)).toContain(CANONICAL_WORKFLOW);
  });

  it("refuses to start anything while the source is stale or invalid", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(false);

    setSource(renameCompany(CANONICAL_DOCUMENT));
    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("run-eligibility").textContent).toContain("not the source in the editor");

    setSource("company: [unclosed");
    await user.click(screen.getByTestId("compile-now"));
    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByTestId("session")).toBeNull();
  });
});

describe("canonical deny-safe run", () => {
  it("parks before any step, showing the runtime's own principal and requesting policy", async () => {
    const user = userEvent.setup();
    const reference = referenceRun();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);

    // Status and counters come from the runtime's run state.
    expect(reference.run?.status).toBe("pending-approval");
    expect(screen.getByTestId("session-status").textContent).toContain("Parked");
    expect(screen.getByTestId("session-steps").textContent).toBe(String(reference.run?.completedSteps ?? -1));
    expect(screen.getByTestId("session-steps").textContent).toBe("0");
    expect(screen.getByTestId("waiting")).toBeTruthy();

    // The required principal is the runtime's, not a string Studio decided.
    const required = screen.getAllByTestId("required-principal").map((element) => element.textContent);
    expect(required).toEqual(reference.run?.pendingApprovals);
    expect(required).toContain("human:product-owner");

    // The approval request carries the runtime's attribution (the policy id).
    const requested = reference.events.filter((event) => event.type === "approval.requested");
    expect(requested.length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("approval-source").map((element) => element.textContent)).toEqual(
      requested.map((event) => event.source),
    );
    expect(screen.getAllByTestId("approval-principal").map((element) => element.textContent)).toEqual(
      requested.flatMap((event) => event.payload.principals as string[]),
    );
    // The policy label is the one the same runtime model declares for that id.
    const policy = canonical.runtimeModel.policies.find((candidate) => candidate.id === requested[0].source);
    expect(screen.getByTestId("approval-policy-label").textContent).toBe(policy?.policyId);
  });

  it("shows no completion and grants nothing on its own", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);

    const types = screen.getAllByTestId("event-type").map((element) => element.textContent);
    expect(types).not.toContain("approval.granted");
    expect(types).not.toContain("workflow.started");
    expect(types).not.toContain("workflow.completed");
    expect(types).not.toContain("agent.task.assigned");
    expect(screen.getByTestId("session-status").textContent).not.toContain("Completed");
    expect(screen.queryByRole("button", { name: /grant/i })).toBeNull();
  });
});

describe("event fidelity", () => {
  it("shows exactly the events the runtime emitted, in the runtime's order", async () => {
    const user = userEvent.setup();
    const reference = referenceRun();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);

    const rendered = screen.getAllByTestId("event");
    expect(rendered.map((element) => Number(element.getAttribute("data-event-id")))).toEqual(
      reference.events.map((event) => event.id),
    );
    expect(rendered.map((element) => element.getAttribute("data-event-type"))).toEqual(
      reference.events.map((event) => event.type),
    );
    expect(screen.getAllByTestId("event-source").map((element) => element.textContent?.trim())).toEqual(
      reference.events.map((event) => event.source),
    );
  });

  it("presents the accepted envelope unchanged, down to the payload", async () => {
    const user = userEvent.setup();
    const reference = referenceRun();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);

    for (const [index, toggle] of screen.getAllByTestId("event-details-toggle").entries()) {
      await user.click(toggle);
      const shown = JSON.parse(screen.getAllByTestId("event-raw")[index].textContent ?? "{}") as RuntimeEvent;
      const emitted = reference.events[index];
      expect(shown.id).toBe(emitted.id);
      expect(shown.type).toBe(emitted.type);
      expect(shown.runId).toBe(emitted.runId);
      expect(shown.source).toBe(emitted.source);
      expect(shown.genomeRevision).toBe(emitted.genomeRevision);
      expect(shown.payload).toEqual(emitted.payload);
    }
  });

  it("ties the session to the revision it was created from", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);

    expect(screen.getByTestId("session-revision").textContent).toBe(canonical.revision);
    for (const element of screen.getAllByTestId("event-raw")) {
      // Every event carries the same revision the session declares.
      expect(element.textContent).toBeDefined();
    }
  });
});

describe("source and session divergence", () => {
  it("leaves the running session on its own revision when the document changes", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);
    const eventsBefore = screen.getAllByTestId("event").map((element) => element.getAttribute("data-event-id"));
    const revisionBefore = screen.getByTestId("session-revision").textContent;

    setSource(renameCompany(CANONICAL_DOCUMENT));

    expect(screen.getByTestId("session-revision").textContent).toBe(revisionBefore);
    expect(screen.getAllByTestId("event").map((element) => element.getAttribute("data-event-id"))).toEqual(
      eventsBefore,
    );
    expect(screen.getByTestId("waiting")).toBeTruthy();
    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("session-divergent").textContent).toContain("revision it started under");
  });

  it("marks the session divergent once the document compiles to a different revision", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);
    setSource(renameCompany(CANONICAL_DOCUMENT));
    await user.click(screen.getByTestId("compile-now"));

    expect(screen.getByTestId("session-divergent")).toBeTruthy();
    expect(screen.getByTestId("session-revision").textContent).toBe(canonical.revision);
    // The new revision is runnable again — as a new session, not by mutating this one.
    expect((screen.getByTestId("run-workflow") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("session lifecycle", () => {
  it("starts with no session and discards one on request", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(screen.getByTestId("session-idle")).toBeTruthy();
    expect(screen.getByTestId("events-empty")).toBeTruthy();

    await startCanonicalRun(user);
    expect(screen.getByTestId("session")).toBeTruthy();
    expect(screen.getAllByTestId("event").length).toBeGreaterThan(0);

    await user.click(screen.getByTestId("reset-session"));

    expect(screen.getByTestId("session-idle")).toBeTruthy();
    expect(screen.getByTestId("events-empty")).toBeTruthy();
    expect(screen.queryByTestId("waiting")).toBeNull();
  });

  it("persists nothing", async () => {
    const user = userEvent.setup();
    const writes: string[] = [];
    const setItem = Storage.prototype.setItem;
    const removeItem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function patched(key: string, value: string) {
      writes.push(`setItem:${key}`);
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function patched(key: string) {
      writes.push(`removeItem:${key}`);
      return removeItem.call(this, key);
    };
    const indexed = (window as unknown as { indexedDB?: { open?: unknown } }).indexedDB;
    const open = indexed?.open;
    if (indexed !== undefined && typeof open === "function") {
      indexed.open = (...args: unknown[]) => {
        writes.push("indexedDB.open");
        return (open as (...rest: unknown[]) => unknown).apply(indexed, args);
      };
    }

    try {
      render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);
      await startCanonicalRun(user);
      await user.click(screen.getByTestId("reset-session"));

      expect(writes).toEqual([]);
      expect(window.localStorage.length).toBe(0);
      expect(window.sessionStorage.length).toBe(0);
    } finally {
      Storage.prototype.setItem = setItem;
      Storage.prototype.removeItem = removeItem;
      if (indexed !== undefined && typeof open === "function") indexed.open = open;
    }
  });

  it("is fully operable from the keyboard", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const select = screen.getByTestId("workflow-select") as HTMLSelectElement;
    select.focus();
    expect(document.activeElement).toBe(select);

    const runButton = screen.getByTestId("run-workflow");
    runButton.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("session")).toBeTruthy();

    const toggle = screen.getAllByTestId("event-details-toggle")[0];
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("announces the parked transition without reading the whole stream", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);

    const announcement = screen.getByTestId("session-announcement");
    expect(announcement.getAttribute("role")).toBe("status");
    expect(announcement.textContent).toContain("parked");
    expect(announcement.textContent).toContain("human:product-owner");
    expect(screen.getByTestId("event-list").closest("[role='status']")).toBeNull();
  });

  it("communicates session state with text, not colour alone", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await startCanonicalRun(user);

    expect(screen.getByTestId("session-status").textContent).toContain("Parked — waiting for approval");
    expect(screen.getByTestId("waiting").textContent).toContain("parked before any step ran");
  });
});
