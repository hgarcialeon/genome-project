/**
 * The graph and the tree are the compiler's projections, on screen.
 *
 * Every expectation here is derived from the accepted compiler's own output in
 * the test, and compared against what Studio actually rendered. There is no
 * second derivation: the test reads `graphTarget` and `inspectTarget` and asks
 * whether the DOM carries exactly that.
 */

import { fireEvent, render, screen } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";
import { CANONICAL_DOCUMENT } from "./canonical.js";
import { compileDocument, type CompiledDocument } from "./genome/compilation.js";

const NO_AUTO_COMPILE = 1_000_000;

const compiledOrThrow = (source: string): CompiledDocument => {
  const result = compileDocument(source);
  if (!result.ok) throw new Error("expected the source to compile");
  return result;
};

const canonical = compiledOrThrow(CANONICAL_DOCUMENT);

/** A structural edit: one more agent in the engineering department. */
const ADDED_AGENT = "technical-writer";
const withAddedAgent = (source: string): string =>
  source.replace(
    "\nworkflows:",
    `\n      ${ADDED_AGENT}:\n        role: Technical Writer\n        autonomy: supervised\n\nworkflows:`,
  );

const editor = (): HTMLTextAreaElement => screen.getByTestId("source") as HTMLTextAreaElement;
const setSource = (source: string) => fireEvent.input(editor(), { target: { value: source } });

/** What the DOM says the graph contains. */
const renderedNodes = (): string[] =>
  screen
    .getAllByTestId("graph-index-node")
    .map((element) => `${element.getAttribute("data-node-type")}:${element.getAttribute("data-node-id")}`)
    .sort();

const drawnNodes = (): string[] =>
  Array.from(document.querySelectorAll("[data-node-id][data-node-type]"))
    .filter((element) => element.tagName.toLowerCase() === "g")
    .map((element) => `${element.getAttribute("data-node-type")}:${element.getAttribute("data-node-id")}`)
    .sort();

const drawnEdges = (): string[] =>
  Array.from(document.querySelectorAll("[data-edge-from]"))
    .map(
      (element) =>
        `${element.getAttribute("data-edge-from")}-[${element.getAttribute("data-edge-type")}]->${element.getAttribute(
          "data-edge-to",
        )}`,
    )
    .sort();

const expectedNodes = (compiled: CompiledDocument): string[] =>
  compiled.graphProjection.nodes.map((node) => `${node.type}:${node.id}`).sort();

const expectedEdges = (compiled: CompiledDocument): string[] =>
  compiled.graphProjection.edges.map((edge) => `${edge.from}-[${edge.type}]->${edge.to}`).sort();

const treeItems = (): string[] => screen.getAllByTestId("tree-item").map((element) => element.textContent ?? "");

describe("Organization Graph projection", () => {
  it("draws every node graphTarget emitted and no node it did not", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(drawnNodes()).toEqual(expectedNodes(canonical));
  });

  it("draws every edge graphTarget emitted, with the compiler's relationship type", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(drawnEdges()).toEqual(expectedEdges(canonical));
  });

  it("lists exactly the same nodes in the accessible representation", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(renderedNodes()).toEqual(expectedNodes(canonical));
    expect(screen.getByTestId("graph-summary").textContent).toContain(
      `${canonical.graphProjection.nodes.length} nodes`,
    );
    expect(screen.getByTestId("graph-summary").textContent).toContain(
      `${canonical.graphProjection.edges.length} relationships`,
    );
  });

  it("exposes a node's incoming and outgoing relationships without a pointer", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const target = canonical.graphProjection.nodes.find((node) => node.type === "Workflow");
    if (target === undefined) throw new Error("the canonical document has workflows");

    const button = screen
      .getAllByTestId("graph-index-node")
      .find((element) => element.getAttribute("data-node-id") === target.id);
    if (button === undefined) throw new Error("every node is listed");

    button.focus();
    expect(document.activeElement).toBe(button);
    await user.keyboard("{Enter}");

    const relations = screen.getByTestId("graph-index-relations");
    expect(relations.textContent).toContain(target.id);

    const outgoing = canonical.graphProjection.edges.filter((edge) => edge.from === target.id);
    const incoming = canonical.graphProjection.edges.filter((edge) => edge.to === target.id);
    expect(screen.queryAllByTestId("relation-out").length).toBe(outgoing.length);
    expect(screen.queryAllByTestId("relation-in").length).toBe(incoming.length);
    for (const edge of outgoing) {
      expect(relations.textContent).toContain(edge.type);
    }
  });
});

describe("organization tree projection", () => {
  it("renders the company, departments, teams and agents inspectTarget reported", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const report = canonical.inspectProjection;
    expect(screen.getByTestId("tree-company").textContent).toBe(report.company.name);

    const items = treeItems();
    for (const department of report.departments) {
      expect(items).toContain(department.id);
      for (const agent of department.agents) expect(items).toContain(agent);
      for (const team of department.teams) {
        expect(items).toContain(team.id);
        for (const agent of team.agents) expect(items).toContain(agent);
      }
    }
    for (const workflow of report.workflows) {
      expect(items).toContain(workflow.id);
    }
  });

  it("shows no organizational item inspectTarget did not report", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const report = canonical.inspectProjection;
    const allowed = new Set<string>([
      ...report.departments.flatMap((department) => [
        department.id,
        ...department.agents,
        ...department.teams.flatMap((team) => [team.id, ...team.agents]),
      ]),
      ...report.workflows.map((workflow) => workflow.id),
    ]);

    for (const item of treeItems()) {
      expect(allowed.has(item)).toBe(true);
    }
  });

  it("collapses and expands from the keyboard", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const disclosure = screen.getAllByRole("button", { expanded: true })[0];
    disclosure.focus();
    await user.keyboard("{Enter}");

    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("a structural edit flows through both projections", () => {
  it("goes stale, then shows the compiler's new graph and tree once compiled", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(drawnNodes()).toEqual(expectedNodes(canonical));
    expect(treeItems()).not.toContain(ADDED_AGENT);

    setSource(withAddedAgent(CANONICAL_DOCUMENT));

    // Stale: the projection on screen is still the old one, and says so.
    expect(screen.getAllByTestId("projection-stale").length).toBeGreaterThan(0);
    expect(drawnNodes()).toEqual(expectedNodes(canonical));
    expect(screen.getByTestId("run-readiness").textContent).toContain("Not runnable");

    await user.click(screen.getByTestId("compile-now"));

    const recompiled = compiledOrThrow(withAddedAgent(CANONICAL_DOCUMENT));
    expect(recompiled.graphProjection.nodes.length).toBe(canonical.graphProjection.nodes.length + 1);
    expect(drawnNodes()).toEqual(expectedNodes(recompiled));
    expect(drawnEdges()).toEqual(expectedEdges(recompiled));
    expect(renderedNodes()).toEqual(expectedNodes(recompiled));
    expect(treeItems()).toContain(ADDED_AGENT);
    expect(screen.queryByTestId("projection-stale")).toBeNull();
  });

  it("keeps the last successful projections visible but marked while the source is invalid", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource("company: [unclosed");
    await user.click(screen.getByTestId("compile-now"));

    expect(screen.getByTestId("compilation-status").textContent).toContain("Invalid");
    // Still inspectable, still complete, and unmistakably not this source.
    expect(drawnNodes()).toEqual(expectedNodes(canonical));
    expect(treeItems().length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("projection-stale").length).toBeGreaterThan(0);
    expect(screen.getByTestId("revision-stale-label")).toBeTruthy();
    expect(screen.getByTestId("run-readiness").textContent).toContain("Not runnable");
  });
});
