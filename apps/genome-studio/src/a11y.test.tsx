/**
 * Automated accessibility checks for the surface implemented so far
 * (WCAG 2.2 AA acceptance floor, `IMPLEMENTATION_QUEUE.md`).
 *
 * axe-core in jsdom cannot evaluate colour contrast — there is no layout or
 * painting — so 1.4.3 is carried by the tokens in `styles.css` and confirmed in
 * the Product Owner walkthrough, not here. What these checks do catch is the
 * structural floor: names, roles, associations, and duplicate or missing
 * labelling.
 */

import { fireEvent, render, screen } from "@testing-library/preact";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";

const NO_AUTO_COMPILE = 1_000_000;

const violations = async (container: Element): Promise<string[]> => {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    // jsdom paints nothing; contrast is verified visually, not here.
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
};

describe("accessibility floor", () => {
  it("has no axe violations with a compiled document", async () => {
    const { container } = render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(await violations(container)).toEqual([]);
  });

  it("has no axe violations while the source is invalid and diagnostics are shown", async () => {
    const { container } = render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    fireEvent.input(screen.getByTestId("source"), { target: { value: "company: [unclosed" } });
    fireEvent.click(screen.getByTestId("compile-now"));

    expect(screen.getByTestId("compilation-status").textContent).toContain("Invalid");
    expect(await violations(container)).toEqual([]);
  });

  it("gives every interactive control an accessible name", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const editor = screen.getByLabelText("Genome source");
    expect(editor).toBe(screen.getByTestId("source"));

    for (const button of screen.getAllByRole("button")) {
      expect(button.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it("names the graph drawing and provides the same content as text", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const drawing = screen.getByRole("img");
    const name = drawing.getAttribute("aria-label") ?? "";
    expect(name).toContain("Organization Graph");
    expect(name).toContain("nodes");
    expect(name).toContain("relationships");

    // The picture is not the only representation: every node is also a control.
    const listed = screen.getAllByTestId("graph-index-node");
    const drawn = Array.from(document.querySelectorAll("g[data-node-id]"));
    expect(listed.length).toBe(drawn.length);
  });

  it("structures the workspace with landmarks and headings", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getAllByRole("complementary").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();

    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent ?? "");
    expect(headings).toContain("Organization Graph");
    expect(headings).toContain("Organization");
    expect(headings).toContain("Source document");
  });

  it("announces whether the projections describe the current source", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const graphPanel = screen.getByRole("region", { name: "Organization Graph" });
    const noteId = graphPanel.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(noteId)?.textContent).toContain("compiled from the source currently in the editor");

    fireEvent.input(screen.getByTestId("source"), { target: { value: "genomeVersion: 0.1\ncompany:\n  name: Edited\n" } });

    expect(document.getElementById(noteId)?.textContent).toContain("does not describe the source");
  });

  it("keeps every essential interaction reachable by keyboard", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>("textarea, button, [href], [tabindex]:not([tabindex='-1'])"),
    );

    expect(focusable).toContain(screen.getByTestId("source"));
    expect(focusable).toContain(screen.getByTestId("compile-now"));
    for (const element of focusable) {
      expect(element.getAttribute("tabindex")).not.toBe("-1");
    }
  });
});
