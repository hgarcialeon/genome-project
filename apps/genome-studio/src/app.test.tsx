/**
 * Studio's authoring surface: what the user sees, and whether it can ever
 * misrepresent what the compiler said.
 *
 * The real compiler runs in these tests — Genome semantics are never mocked —
 * but expectations are derived from the compiler's own output rather than
 * re-pinning compiler goldens, which
 * `packages/genome-compiler/src/revision-goldens.test.ts` owns.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";
import { CANONICAL_DOCUMENT } from "./canonical.js";
import { compileDocument } from "./genome/compilation.js";

const canonical = compileDocument(CANONICAL_DOCUMENT);
if (!canonical.ok) throw new Error("the canonical document must compile");

/** A large delay keeps the idle compile out of the way of a specific assertion. */
const NO_AUTO_COMPILE = 1_000_000;

const editor = (): HTMLTextAreaElement => screen.getByTestId("source") as HTMLTextAreaElement;
const setSource = (source: string) => fireEvent.input(editor(), { target: { value: source } });
const renameCompany = (source: string) => source.replace("name: Genome Project", "name: Genome Studio");

describe("Studio authoring surface", () => {
  it("opens the canonical document compiled, current, and runnable", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(screen.getByTestId("compilation-status").textContent).toContain("Compiled");
    expect(screen.getByTestId("revision").textContent).toBe(canonical.revision);
    expect(screen.getByTestId("organization-name").textContent).toBe(canonical.inspectProjection.company.name);
    expect(screen.getByTestId("run-readiness").textContent).toContain("Ready to run");
    expect(screen.queryByTestId("stale-banner")).toBeNull();
    expect(editor().value).toBe(CANONICAL_DOCUMENT);
  });

  it("marks the projection stale the instant the source changes, before any recompile", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource(renameCompany(CANONICAL_DOCUMENT));

    expect(screen.getByTestId("compilation-status").textContent).toContain("Edited");
    expect(screen.getByTestId("stale-banner")).toBeTruthy();
    expect(screen.getByTestId("revision-stale-label").textContent).toContain("Last successful revision");
    expect(screen.getByTestId("revision").textContent).toContain(canonical.revision);
    expect(screen.getByTestId("run-readiness").textContent).toContain("Not runnable");
  });

  it("compiles the current source when typing pauses and shows the compiler's new revision", async () => {
    render(<App autoCompileDelayMs={0} />);

    setSource(renameCompany(CANONICAL_DOCUMENT));

    await waitFor(() => {
      expect(screen.getByTestId("compilation-status").textContent).toContain("Compiled");
    });
    expect(screen.getByTestId("revision").textContent).not.toBe(canonical.revision);
    expect(screen.queryByTestId("stale-banner")).toBeNull();
    expect(screen.getByTestId("run-readiness").textContent).toContain("Ready to run");
  });

  it("compiles from the keyboard with Ctrl+Enter", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource(renameCompany(CANONICAL_DOCUMENT));
    expect(screen.getByTestId("compilation-status").textContent).toContain("Edited");

    editor().focus();
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(screen.getByTestId("compilation-status").textContent).toContain("Compiled");
    expect(screen.getByTestId("revision").textContent).not.toBe(canonical.revision);
  });

  it("shows the compiler's diagnostics for an invalid source and refuses to run it", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource("company: [unclosed");
    await user.click(screen.getByTestId("compile-now"));

    expect(screen.getByTestId("compilation-status").textContent).toContain("Invalid");
    expect(screen.getByTestId("diagnostics-summary").textContent).toContain("parse stage");
    expect(screen.getAllByTestId("diagnostic-message").length).toBeGreaterThan(0);
    expect(editor().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByTestId("run-readiness").textContent).toContain("Not runnable");
  });

  it("keeps the last successful revision inspectable but never current while the source is invalid", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource("genomeVersion: 0.1\ncompany:\n  mission: a company with no name\n");
    await user.click(screen.getByTestId("compile-now"));

    expect(screen.getByTestId("compilation-status").textContent).toContain("Invalid");
    expect(screen.getByTestId("stale-banner").textContent).toContain("does not describe the source");
    expect(screen.getByTestId("revision-stale-label")).toBeTruthy();
    expect(screen.getByTestId("revision").textContent).toContain(canonical.revision);
    expect(screen.getByTestId("run-readiness").textContent).toContain("Not runnable");
  });

  it("reports the compiler's document path and moves focus to the editor on request", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource("genomeVersion: 0.1\ncompany:\n  mission: a company with no name\n");
    await user.click(screen.getByTestId("compile-now"));

    const path = screen.getAllByTestId("diagnostic-path")[0].textContent ?? "";
    expect(path.length).toBeGreaterThan(0);

    await user.click(screen.getAllByTestId("diagnostic-locate")[0]);

    expect(document.activeElement).toBe(editor());
    expect(screen.getByTestId("locate-announcement").textContent).toContain(path);
  });

  it("returns to current after the source is corrected", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    setSource("company: [unclosed");
    await user.click(screen.getByTestId("compile-now"));
    expect(screen.getByTestId("compilation-status").textContent).toContain("Invalid");

    setSource(CANONICAL_DOCUMENT);

    expect(screen.getByTestId("compilation-status").textContent).toContain("Compiled");
    expect(screen.getByTestId("revision").textContent).toBe(canonical.revision);
    expect(screen.queryByTestId("stale-banner")).toBeNull();
    expect(screen.getByTestId("run-readiness").textContent).toContain("Ready to run");
  });

  it("associates diagnostics with the editor programmatically", async () => {
    const user = userEvent.setup();
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    const described = editor().getAttribute("aria-describedby");
    expect(described).toBe("diagnostics-summary");
    expect(document.getElementById(described ?? "")).toBeTruthy();

    setSource("company: [unclosed");
    await user.click(screen.getByTestId("compile-now"));

    expect(editor().getAttribute("aria-errormessage")).toBe("diagnostics-summary");
  });

  it("signals state with text, not colour alone", () => {
    render(<App autoCompileDelayMs={NO_AUTO_COMPILE} />);

    expect(screen.getByTestId("compilation-status").textContent?.trim().length).toBeGreaterThan(0);
    expect(screen.getByTestId("compilation-detail").textContent).toContain("compiled from the source");

    setSource(renameCompany(CANONICAL_DOCUMENT));

    expect(screen.getByTestId("compilation-detail").textContent).toContain("not this source");
  });
});
