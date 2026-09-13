/**
 * Checkpoint 1: the accepted packages are integrated and run in the page.
 *
 * The compiler runs for real here — no mock, no fixture of its output. The
 * revision asserted is the golden pinned in
 * `packages/genome-compiler/src/revision-goldens.test.ts`, so if Studio ever
 * shows a value the compiler did not produce, this fails.
 */

import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";

import { App } from "./app.js";

const CANONICAL_REVISION = "f86a6a1b0736bfba1b7c2b5209818740082b0e9fea0246f47201653f3074571b";

describe("Studio shell", () => {
  it("compiles the canonical document in the page and reports the compiler's revision", () => {
    render(<App />);

    expect(screen.getByTestId("revision").textContent).toBe(CANONICAL_REVISION);
    expect(screen.getByTestId("graph-size").textContent).toBe("19 nodes, 31 edges");
    expect(screen.getByTestId("workflow-count").textContent).toBe("3");
  });
});
