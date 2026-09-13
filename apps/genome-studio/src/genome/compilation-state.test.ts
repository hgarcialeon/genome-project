/**
 * The freshness invariant, at the model level.
 *
 * These tests use the real compiler. They do not re-pin compiler goldens —
 * `packages/genome-compiler/src/revision-goldens.test.ts` owns those — they
 * check that Studio consumes what the compiler produced and never presents it
 * as describing a source it did not come from.
 */

import { describe, expect, it } from "vitest";

import { CANONICAL_DOCUMENT } from "../canonical.js";
import {
  compileCurrent,
  currentRevision,
  editSource,
  executableRuntimeModel,
  isStale,
  openDocument,
} from "./compilation-state.js";

const structuralEdit = (source: string): string =>
  source.replace("  architect:\n", "  architect:\n    # edited\n");

const renameCompany = (source: string): string => source.replace("name: Genome Project", "name: Genome Studio");

describe("compilation state", () => {
  it("opens the canonical document already compiled and current", () => {
    const state = openDocument(CANONICAL_DOCUMENT);

    expect(state.status).toBe("current");
    expect(isStale(state)).toBe(false);
    expect(currentRevision(state)).toBe(state.lastSuccessful?.revision);
    expect(executableRuntimeModel(state)).toBeDefined();
  });

  it("presents a projection as current only when it came from exactly this source", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const edited = editSource(opened, `${CANONICAL_DOCUMENT}\n`);

    expect(edited.status).toBe("editing");
    expect(edited.lastSuccessful?.source).toBe(CANONICAL_DOCUMENT);
    expect(edited.lastSuccessful?.source).not.toBe(edited.source);
    expect(currentRevision(edited)).toBeUndefined();
  });

  it("marks the previous projection stale the moment the source changes", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const edited = editSource(opened, renameCompany(CANONICAL_DOCUMENT));

    expect(isStale(edited)).toBe(true);
    expect(edited.lastSuccessful?.revision).toBe(opened.lastSuccessful?.revision);
    expect(executableRuntimeModel(edited)).toBeUndefined();
  });

  it("produces the compiler's new revision after a semantic change is compiled", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const recompiled = compileCurrent(editSource(opened, renameCompany(CANONICAL_DOCUMENT)));

    expect(recompiled.status).toBe("current");
    expect(currentRevision(recompiled)).toBeDefined();
    expect(currentRevision(recompiled)).not.toBe(opened.lastSuccessful?.revision);
  });

  it("keeps the compiler's revision when a change is formatting only", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const reformatted = compileCurrent(editSource(opened, structuralEdit(CANONICAL_DOCUMENT)));

    expect(reformatted.status).toBe("current");
    // A comment is formatting: the compiler derives the revision from the
    // parsed document, so identity is unchanged.
    expect(currentRevision(reformatted)).toBe(opened.lastSuccessful?.revision);
  });

  it("reports compiler diagnostics for an invalid source and refuses to run it", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const invalid = compileCurrent(editSource(opened, "company: [unclosed"));

    expect(invalid.status).toBe("invalid");
    expect(invalid.diagnostics.length).toBeGreaterThan(0);
    expect(invalid.failedStage).toBe("parse");
    expect(executableRuntimeModel(invalid)).toBeUndefined();
  });

  it("never lets a failed compile restore the last projection to current", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const invalid = compileCurrent(editSource(opened, "genomeVersion: 0.1\ncompany:\n  mission: no name\n"));

    expect(invalid.status).toBe("invalid");
    expect(isStale(invalid)).toBe(true);
    expect(invalid.lastSuccessful?.revision).toBe(opened.lastSuccessful?.revision);
    expect(currentRevision(invalid)).toBeUndefined();
    expect(executableRuntimeModel(invalid)).toBeUndefined();
  });

  it("returns to current when the source is corrected and compiled", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const broken = compileCurrent(editSource(opened, "company: [unclosed"));
    const corrected = compileCurrent(editSource(broken, CANONICAL_DOCUMENT));

    expect(corrected.status).toBe("current");
    expect(isStale(corrected)).toBe(false);
    expect(currentRevision(corrected)).toBe(opened.lastSuccessful?.revision);
    expect(executableRuntimeModel(corrected)).toBeDefined();
  });

  it("restores currency without recompiling when the exact previous text returns", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const edited = editSource(opened, renameCompany(CANONICAL_DOCUMENT));
    const undone = editSource(edited, CANONICAL_DOCUMENT);

    expect(undone.status).toBe("current");
    expect(currentRevision(undone)).toBe(opened.lastSuccessful?.revision);
  });

  it("only ever exposes a runtime model produced by the current source", () => {
    const opened = openDocument(CANONICAL_DOCUMENT);
    const edited = editSource(opened, renameCompany(CANONICAL_DOCUMENT));
    const recompiled = compileCurrent(edited);

    expect(executableRuntimeModel(opened)).toBe(opened.lastSuccessful?.runtimeModel);
    expect(executableRuntimeModel(edited)).toBeUndefined();
    expect(executableRuntimeModel(recompiled)).toBe(recompiled.lastSuccessful?.runtimeModel);
    expect(executableRuntimeModel(recompiled)).not.toBe(opened.lastSuccessful?.runtimeModel);
  });
});
