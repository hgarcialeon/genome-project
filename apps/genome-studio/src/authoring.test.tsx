/**
 * The Milestone-1 remediation journey: adding an agent without knowing YAML.
 *
 * This is the failure the Product Owner recorded, executed end to end. The real
 * `@genome/authoring` package runs here, with the real compiler behind it —
 * nothing about the operation is mocked, because the point of the test is that
 * Studio does not own the transformation.
 *
 * It also carries the boundary tripwires: no Studio-owned YAML mutation (E12),
 * no revision derived in the view (E13), and no authoring-specific compile path
 * (E19).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, waitFor, within } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { compile, graphTarget } from "@genome/compiler";

import { App, DEFAULT_AUTO_COMPILE_DELAY_MS } from "./app.js";
import { CANONICAL_DOCUMENT } from "./canonical.js";

/** Long enough that only an explicit Compile advances the projections. */
const NO_AUTO_COMPILE = 1_000_000;

const editor = (): HTMLTextAreaElement => screen.getByTestId("source") as HTMLTextAreaElement;
const graphNodeIds = (): string[] =>
  screen.getAllByTestId("graph-index-node").map((element) => element.getAttribute("data-node-id") ?? "");
const treeLabels = (): string[] => screen.getAllByTestId("tree-item").map((element) => element.textContent ?? "");

const openerFor = (department: string): HTMLButtonElement => {
  const opener = screen
    .getAllByTestId("add-agent-open")
    .find((button) => button.getAttribute("data-department") === department);
  if (opener === undefined) throw new Error(`no Add agent control for ${department}`);
  return opener as HTMLButtonElement;
};

describe("the remediation journey — add an agent to Engineering", () => {
  it("goes from the organization surface to compiler-derived projections, without YAML knowledge", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    // ---- 1. The organization reads as something you can change -------------
    expect(screen.getByText(/Describe and change your organization/i)).toBeTruthy();

    const nodesBefore = graphNodeIds();
    const sourceBefore = editor().value;
    expect(sourceBefore).toBe(CANONICAL_DOCUMENT);
    expect(treeLabels()).not.toContain("technical-writer");

    // ---- 2. Add agent is discoverable from Engineering ---------------------
    // Found by the department it belongs to, not by scrolling to the source.
    const opener = openerFor("engineering");
    await user.click(opener);

    const form = screen.getByTestId("add-agent-form");
    expect(form.getAttribute("aria-label")).toContain("engineering");
    // Focus enters the interaction on open.
    expect(document.activeElement).toBe(screen.getByTestId("add-agent-id"));

    // ---- 3. Only an id is required ----------------------------------------
    const idField = screen.getByTestId("add-agent-id");
    expect(idField.getAttribute("aria-required")).toBe("true");
    expect(within(form).getByText(/\(required\)/)).toBeTruthy();
    expect(within(form).getAllByText(/\(optional\)/).length).toBeGreaterThan(0);

    await user.type(idField, "technical-writer");
    await user.type(screen.getByTestId("add-agent-role"), "Technical Writer");
    await user.click(screen.getByTestId("add-agent-submit"));

    // ---- 4. The source changed, and the user can see it --------------------
    const sourceAfter = editor().value;
    expect(sourceAfter).not.toBe(sourceBefore);
    expect(sourceAfter).toContain("technical-writer");
    expect(sourceAfter).toContain("role: Technical Writer");

    // The source Studio holds is exactly what the toolchain returned: the same
    // document, with the agent's lines added and nothing else touched.
    const addedLines = sourceAfter.split("\n").filter((line) => !sourceBefore.split("\n").includes(line));
    expect(addedLines).toEqual(["      technical-writer:", "        role: Technical Writer"]);
    expect(sourceBefore.split("\n").every((line) => sourceAfter.includes(line))).toBe(true);

    // The governance disclaimer is still there.
    expect(sourceAfter).toContain("NON-NORMATIVE FOR GOVERNANCE");

    // ---- 5. The organization is now stale, by the ordinary machinery -------
    expect(screen.getAllByTestId("projection-stale").length).toBeGreaterThan(0);
    expect(graphNodeIds()).toEqual(nodesBefore); // projections have not moved yet
    expect(screen.getByTestId("add-agent-confirmation").textContent).toContain("technical-writer");

    // ---- 6. Compile, through the same control as any other edit ------------
    await user.click(screen.getByTestId("compile-now"));
    expect(screen.queryByTestId("projection-stale")).toBeNull();

    // ---- 7. Graph and tree show the agent — from the compiler --------------
    const expected = compile(sourceAfter);
    if (!expected.ok) throw new Error("the authored source must compile");
    const expectedIds = graphTarget(expected.graph).nodes.map((node) => node.id);

    expect(graphNodeIds()).toEqual(expectedIds);
    expect(graphNodeIds()).toContain("agent:engineering.technical-writer");
    expect(graphNodeIds()).toHaveLength(nodesBefore.length + 1);
    expect(treeLabels()).toContain("technical-writer");

    // The source is still on screen and still canonical.
    expect(editor().value).toBe(sourceAfter);
  });

  it("E19 — the result enters the ordinary edit lifecycle, with no authoring-only compile path", async () => {
    const user = userEvent.setup();
    // The accepted debounce, not a special authoring path: with auto-compile
    // enabled the projections catch up on their own, exactly as after typing.
    render(<App autoCompileDelayMs={DEFAULT_AUTO_COMPILE_DELAY_MS} />);

    const before = graphNodeIds();
    await user.click(openerFor("engineering"));
    await user.type(screen.getByTestId("add-agent-id"), "auto-compiled");
    await user.click(screen.getByTestId("add-agent-submit"));

    // Stale first — the edit is an edit.
    expect(screen.getAllByTestId("projection-stale").length).toBeGreaterThan(0);
    expect(graphNodeIds()).toEqual(before);

    // Then the existing debounce compiles it. Nothing authoring-specific ran.
    await waitFor(() => expect(screen.queryByTestId("projection-stale")).toBeNull(), { timeout: 4000 });
    expect(graphNodeIds()).toContain("agent:engineering.auto-compiled");
  });
});

describe("authoring failures", () => {
  it("reports a duplicate as a conflict, in the organization's terms, and changes no source", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const sourceBefore = editor().value;
    await user.click(openerFor("engineering"));
    await user.type(screen.getByTestId("add-agent-id"), "engineering-agent");
    await user.click(screen.getByTestId("add-agent-submit"));

    const errors = screen.getByTestId("add-agent-errors");
    expect(errors.hidden).toBe(false);
    expect(errors.getAttribute("role")).toBe("alert");
    expect(errors.textContent).toContain("already has an agent called engineering-agent");

    // The editor keeps the source it had. No candidate is installed.
    expect(editor().value).toBe(sourceBefore);
    expect(screen.queryByTestId("projection-stale")).toBeNull();
    // The form stays open so the person can correct the id.
    expect(screen.getByTestId("add-agent-form")).toBeTruthy();
  });

  it("reports a blank id as an intent failure, associated with the field", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(openerFor("engineering"));
    // Whitespace satisfies the native `required` attribute but is not an id,
    // so the operation's own intent check is what refuses it.
    await user.type(screen.getByTestId("add-agent-id"), "   ");
    await user.click(screen.getByTestId("add-agent-submit"));

    await waitFor(() => expect(screen.getByTestId("add-agent-errors").hidden).toBe(false));
    expect(screen.getByTestId("add-agent-errors").textContent).toContain("Enter an id");

    const idField = screen.getByTestId("add-agent-id");
    expect(idField.getAttribute("aria-invalid")).toBe("true");
    expect(idField.getAttribute("aria-describedby")).toBe(screen.getByTestId("add-agent-errors").id);
    expect(editor().value).toBe(CANONICAL_DOCUMENT);
  });

  it("the id field is natively required, so an empty submit never reaches the operation", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(openerFor("engineering"));
    await user.click(screen.getByTestId("add-agent-submit"));

    expect(screen.getByTestId("add-agent-errors").hidden).toBe(true);
    expect(editor().value).toBe(CANONICAL_DOCUMENT);
  });
});

describe("accessibility of the authoring interaction", () => {
  it("completes the whole journey from the keyboard alone", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const opener = openerFor("engineering");
    opener.focus();
    await user.keyboard("{Enter}");

    expect(document.activeElement).toBe(screen.getByTestId("add-agent-id"));
    await user.keyboard("keyboard-only");
    // Enter in a text field submits the form natively.
    await user.keyboard("{Enter}");

    expect(editor().value).toContain("keyboard-only");
  });

  it("moves focus to the confirmation on success, so focus is never stranded", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(openerFor("engineering"));
    await user.type(screen.getByTestId("add-agent-id"), "focused");
    await user.click(screen.getByTestId("add-agent-submit"));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("add-agent-confirmation")));
    expect(screen.queryByTestId("add-agent-form")).toBeNull();
  });

  it("returns focus to the control that opened the form on cancel", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const opener = openerFor("engineering");
    await user.click(opener);
    await user.click(screen.getByTestId("add-agent-cancel"));

    await waitFor(() => expect(document.activeElement).toBe(openerFor("engineering")));
    expect(screen.queryByTestId("add-agent-form")).toBeNull();
    expect(editor().value).toBe(CANONICAL_DOCUMENT);
  });

  it("announces the change without requiring the user to find it", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    await user.click(openerFor("engineering"));
    await user.type(screen.getByTestId("add-agent-id"), "announced");
    await user.click(screen.getByTestId("add-agent-submit"));

    const announcement = screen.getByTestId("authoring-announcement");
    expect(announcement.getAttribute("role")).toBe("status");
    expect(announcement.textContent).toContain("announced");
    expect(announcement.textContent).toContain("Genome source changed");
  });
});

// ---------------------------------------------------------------------------
// E12 / E13 — boundary tripwires over Studio's own production source
// ---------------------------------------------------------------------------

describe("E12 — Studio owns no YAML transformation", () => {
  const productionSources = (): { path: string; text: string }[] => {
    const root = join(process.cwd(), "src");
    const walk = (directory: string): string[] =>
      readdirSyncSafe(directory).flatMap((entry) => {
        const full = join(directory, entry);
        if (entry === "__fixtures__") return [];
        if (isDirectory(full)) return walk(full);
        if (!/\.(ts|tsx)$/.test(entry)) return [];
        if (/\.test\.tsx?$/.test(entry) || entry === "test-setup.ts") return [];
        return [full];
      });
    return walk(root).map((path) => ({ path, text: readFileSync(path, "utf8") }));
  };

  it("never imports a YAML library, and never serializes or parses a document", () => {
    for (const { path, text } of productionSources()) {
      expect(text, `${path} must not import a YAML library`).not.toMatch(/from ["']yaml["']/);
      expect(text, `${path} must not parse YAML`).not.toMatch(/YAML\.parse|parseDocument|parseGenomeDocument/);
      expect(text, `${path} must not serialise YAML`).not.toMatch(/YAML\.stringify|\.toString\(\{\s*lineWidth/);
    }
  });

  it("never writes Genome document structure by hand", () => {
    for (const { path, text } of productionSources()) {
      // The placement rule — `departments.<id>.agents.<id>` — lives in the
      // toolchain. Studio must not encode it, in a path or in a string.
      expect(text, `${path} must not encode agent placement`).not.toMatch(/departments["'\]]*\s*[,.\]]\s*["'][^"']*["']\s*,\s*["']agents["']/);
      expect(text, `${path} must not build an agents fragment`).not.toMatch(/agents:\s*\\n|\\n\s*agents:/);
    }
  });

  it("reaches document change only through the accepted operation", () => {
    const callers = productionSources().filter(({ text }) => text.includes("applyAddAgent"));
    expect(callers.length).toBeGreaterThan(0);
    for (const { path, text } of callers) {
      expect(text, `${path} must import the operation from @genome/authoring`).toMatch(
        /import \{[^}]*applyAddAgent[^}]*\} from "@genome\/authoring"/,
      );
    }
  });

  it("never refreshes graph or tree from the operation result", () => {
    for (const { path, text } of productionSources()) {
      // Projections come from compilation state alone. Nothing may set a
      // projection, graph, or tree from an authoring result.
      expect(text, `${path} must not set a projection directly`).not.toMatch(
        /set(Projection|Graph|Tree|Inspect)\s*\(/,
      );
    }
  });
});

describe("E13 — Studio derives no revision when authoring", () => {
  it("shows a revision only from compiled state, never computed in the view", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const compiledBefore = compile(CANONICAL_DOCUMENT);
    if (!compiledBefore.ok) throw new Error("canonical must compile");
    const revisionBefore = compiledBefore.graph.genomeRevision;
    expect(screen.getByTestId("revision").textContent).toContain(revisionBefore);

    await user.click(openerFor("engineering"));
    await user.type(screen.getByTestId("add-agent-id"), "unrevised");
    await user.click(screen.getByTestId("add-agent-submit"));

    // After authoring but before compiling, the revision on screen is still the
    // last *compiled* one — now marked as not describing this source. Studio
    // predicted nothing about the authored document.
    const duringLabel = screen.getByTestId("revision").textContent ?? "";
    expect(duringLabel).toContain(revisionBefore);
    expect(duringLabel).toMatch(/not this source/i);

    await user.click(screen.getByTestId("compile-now"));

    const compiled = compile(editor().value);
    if (!compiled.ok) throw new Error("must compile");
    expect(screen.getByTestId("revision").textContent).toContain(compiled.graph.genomeRevision.slice(0, 12));
    expect(compiled.graph.genomeRevision).not.toBe(revisionBefore);
  });
});

// Small helpers kept at the bottom so the evidence above reads uninterrupted.
function readdirSyncSafe(directory: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { readdirSync } = require("node:fs") as typeof import("node:fs");
  return readdirSync(directory);
}

function isDirectory(path: string): boolean {
  const { statSync } = require("node:fs") as typeof import("node:fs");
  return statSync(path).isDirectory();
}
