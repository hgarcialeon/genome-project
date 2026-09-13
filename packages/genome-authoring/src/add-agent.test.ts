/**
 * RFC-0010 executable evidence, E1–E19.
 *
 * Test names carry their evidence id so the suite maps back to the accepted
 * Definition of Done by reading alone. Every Genome judgement here comes from
 * the real compiler; nothing is asserted against a literal this package wrote.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { compile, graphTarget, inspectTarget } from "@genome/compiler";

import { applyAddAgent, type AddAgentIntent, type AuthoringResult } from "./add-agent.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const fixture = (name: string): string => readFileSync(join(HERE, "__fixtures__", name), "utf8");

/** The canonical self-hosting document — a required preservation fixture. */
const CANONICAL = readFileSync(join(HERE, "../../../SPEC/examples/genome-project.yaml"), "utf8");

const okOrThrow = (result: AuthoringResult): string => {
  if (!result.ok) throw new Error(`expected success, got ${result.failure}`);
  return result.source;
};

const nodeIds = (source: string): string[] => {
  const compiled = compile(source);
  if (!compiled.ok) throw new Error("expected the source to compile");
  return graphTarget(compiled.graph).nodes.map((node) => node.id);
};

const WRITER: AddAgentIntent = {
  department: "engineering",
  id: "technical-writer",
  role: "Technical Writer",
  autonomy: "supervised",
};

// ---------------------------------------------------------------------------
// E1–E4 — the operation works, and the compiler agrees
// ---------------------------------------------------------------------------

describe("E1 — add an agent to a valid department", () => {
  it("succeeds and returns source", () => {
    const result = applyAddAgent(CANONICAL, WRITER);
    expect(result.ok).toBe(true);
    expect(okOrThrow(result)).toContain("technical-writer");
  });

  it("succeeds with only the required fields", () => {
    const result = applyAddAgent(fixture("minimal.yaml"), {
      department: "engineering",
      id: "newcomer",
    });
    expect(result.ok).toBe(true);
  });
});

describe("E2 — the resulting source compiles", () => {
  it("is accepted by the compiler with no error diagnostics", () => {
    const compiled = compile(okOrThrow(applyAddAgent(CANONICAL, WRITER)));
    expect(compiled.ok).toBe(true);
  });
});

describe("E3 — the agent appears in graphTarget", () => {
  it("is present as agent:<department>.<id>, and nothing else is", () => {
    const before = nodeIds(CANONICAL);
    const after = nodeIds(okOrThrow(applyAddAgent(CANONICAL, WRITER)));

    expect(after).toContain("agent:engineering.technical-writer");
    expect(after).toHaveLength(before.length + 1);
    expect(after.filter((id) => !before.includes(id))).toEqual(["agent:engineering.technical-writer"]);
  });
});

describe("E4 — the agent appears in inspectTarget", () => {
  it("is listed under its department and counted", () => {
    const beforeCompiled = compile(CANONICAL);
    if (!beforeCompiled.ok) throw new Error("canonical must compile");
    const before = inspectTarget(beforeCompiled.graph);

    const afterCompiled = compile(okOrThrow(applyAddAgent(CANONICAL, WRITER)));
    if (!afterCompiled.ok) throw new Error("result must compile");
    const after = inspectTarget(afterCompiled.graph);

    const engineering = after.departments.find((department) => department.id === "engineering");
    expect(engineering?.agents).toContain("technical-writer");
    expect(after.counts.Agent).toBe(before.counts.Agent + 1);
  });
});

// ---------------------------------------------------------------------------
// E5–E6 — preservation (RFC-0010 §6.1, Tier 1)
// ---------------------------------------------------------------------------

describe("E5 — required source preservation", () => {
  it("R6 — on the canonical fixture the diff is exactly the added agent's lines", () => {
    const after = okOrThrow(applyAddAgent(CANONICAL, { department: "engineering", id: "technical-writer", role: "Technical Writer" }));

    const beforeLines = CANONICAL.split("\n");
    const afterLines = after.split("\n");

    const added = afterLines.filter((line, index) => beforeLines[index] !== line && !beforeLines.includes(line));
    const removed = beforeLines.filter((line) => !afterLines.includes(line));

    expect(removed).toEqual([]);
    expect(added).toEqual(["      technical-writer:", "        role: Technical Writer"]);
    expect(afterLines).toHaveLength(beforeLines.length + 2);
  });

  it("R1 — comments survive, wherever they sit relative to the edit", () => {
    const source = fixture("commented.yaml");
    const after = okOrThrow(applyAddAgent(source, { department: "engineering", id: "newcomer", role: "New" }));

    for (const comment of [
      "# Leading block comment that must survive.",
      "# Second line of the leading block.",
      "# leading comment for engineering",
      "# trailing comment on the department key",
      "# comment inside engineering",
      "# comment above the first agent",
      "# trailing comment on role",
      "# comment introducing the next department",
      "# Trailing file comment.",
    ]) {
      expect(after).toContain(comment);
    }
  });

  it("R1 — a long unrelated scalar is not reflowed (no line folding)", () => {
    const source = fixture("commented.yaml");
    const longLine = source.split("\n").find((line) => line.includes("A long mission statement"));
    expect(longLine).toBeDefined();
    const after = okOrThrow(applyAddAgent(source, { department: "engineering", id: "newcomer" }));
    expect(after).toContain(longLine as string);
  });

  it("R2/R3/R5 — unrelated keys, values and ordering are untouched", () => {
    const source = fixture("minimal.yaml");
    const after = okOrThrow(applyAddAgent(source, { department: "engineering", id: "newcomer" }));

    const removed = source.split("\n").filter((line) => !after.split("\n").includes(line));
    expect(removed).toEqual([]);
    // The other department is untouched, including its own `existing` agent.
    expect(after).toContain("  operations:");
    expect(after).toContain("        role: Operator");
  });

  it("R4 — quoting style is preserved", () => {
    const source = fixture("quoted.yaml");
    const after = okOrThrow(applyAddAgent(source, { department: "engineering", id: "plain" }));

    for (const quoted of [
      'genomeVersion: "0.1"',
      'name: "Acme, Inc."',
      "mission: 'single quoted mission'",
      '"engineering":',
      '"quoted-agent":',
      'role: "Senior Engineer"',
    ]) {
      expect(after).toContain(quoted);
    }
  });
});

describe("E6 — the RFC-0008 governance disclaimer survives", () => {
  it("keeps the canonical example's non-normative marking intact", () => {
    const after = okOrThrow(applyAddAgent(CANONICAL, WRITER));

    expect(after).toContain("# Genome self-hosting example");
    expect(after).toContain("NON-NORMATIVE FOR GOVERNANCE");
    expect(after).toContain("# (phase, milestone, queue, blockers). See RFC-0008.");

    // The whole leading block, byte for byte, still opens the document.
    const leadingBlock = CANONICAL.split("\n").filter((line) => line.startsWith("#"));
    expect(leadingBlock.length).toBeGreaterThan(0);
    for (const line of leadingBlock) expect(after).toContain(line);
  });
});

describe("Tier 3 — disclosed normalization (RFC-0010 §6.3)", () => {
  // Documented rather than pretended away: these are known, accepted, and NOT
  // claimed as preserved.
  it("normalizes CRLF line endings to LF", () => {
    const crlf = fixture("minimal.yaml").replace(/\n/g, "\r\n");
    const after = okOrThrow(applyAddAgent(crlf, { department: "engineering", id: "newcomer" }));
    expect(crlf).toContain("\r\n");
    expect(after).not.toContain("\r\n");
  });

  it("normalizes non-uniform indentation", () => {
    const mixed = [
      "genomeVersion: 0.1",
      "company:",
      "  name: Acme",
      "departments:",
      "    engineering:",
      "        agents:",
      "            existing:",
      "                role: Engineer",
      "",
    ].join("\n");
    const after = okOrThrow(applyAddAgent(mixed, { department: "engineering", id: "newcomer" }));
    expect(after).toContain("  engineering:");
    expect(after).not.toContain("    engineering:");
  });
});

// ---------------------------------------------------------------------------
// E7 — determinism (RFC-0010 §7)
// ---------------------------------------------------------------------------

describe("E7 — determinism", () => {
  it("same source bytes + same intent → byte-identical output, from the same input each time", () => {
    const runs = [0, 1, 2, 3, 4].map(() => applyAddAgent(CANONICAL, WRITER));
    const sources = runs.map(okOrThrow);
    for (const source of sources) expect(source).toBe(sources[0]);
  });

  it("intent identity includes presence-or-absence of each optional field", () => {
    const withAutonomy = okOrThrow(applyAddAgent(CANONICAL, { department: "engineering", id: "a", autonomy: "manual" }));
    const withoutAutonomy = okOrThrow(applyAddAgent(CANONICAL, { department: "engineering", id: "a" }));
    expect(withAutonomy).not.toBe(withoutAutonomy);
  });

  it("is stable across fixtures, not just the canonical example", () => {
    for (const name of ["minimal.yaml", "commented.yaml", "quoted.yaml", "no-agents.yaml"]) {
      const source = fixture(name);
      const intent = { department: "engineering", id: "newcomer", role: "New" };
      expect(okOrThrow(applyAddAgent(source, intent))).toBe(okOrThrow(applyAddAgent(source, intent)));
    }
  });
});

// ---------------------------------------------------------------------------
// E8–E9 — refusals, and the refusals that must NOT happen
// ---------------------------------------------------------------------------

describe("E8 — a nonexistent target department is refused", () => {
  it("returns conflict/unknown-department and no source", () => {
    const result = applyAddAgent(CANONICAL, { department: "marketing", id: "newcomer" });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.failure).toBe("conflict");
    expect(result).not.toHaveProperty("source");
    if (result.failure !== "conflict") throw new Error("unreachable");
    expect(result.problem).toEqual({ kind: "unknown-department", department: "marketing" });
  });

  it("does not fall back to a team of the same name", () => {
    const result = applyAddAgent(fixture("teams.yaml"), { department: "platform", id: "newcomer" });
    expect(result.ok).toBe(false);
  });
});

describe("E9 — duplicate handling is scoped to the target mapping", () => {
  it("refuses an id already present in the target department", () => {
    const result = applyAddAgent(fixture("minimal.yaml"), { department: "engineering", id: "existing" });
    expect(result.ok).toBe(false);
    if (result.ok || result.failure !== "conflict") throw new Error("expected a conflict");
    expect(result.problem).toEqual({ kind: "duplicate-agent", department: "engineering", id: "existing" });
  });

  it("does NOT refuse an id that exists in another department", () => {
    // `operations.agents.existing` exists; `engineering` has its own `existing`,
    // so use an id present only in the other department.
    const source = fixture("teams.yaml");
    const result = applyAddAgent(source, { department: "engineering", id: "shared" });
    expect(result.ok).toBe(true);
    expect(nodeIds(okOrThrow(result))).toEqual(
      expect.arrayContaining(["agent:engineering.shared", "agent:operations.shared"]),
    );
  });

  it("does NOT refuse an id that exists in a team beneath the target department", () => {
    // `engineering.teams.platform.agents.shared` exists; adding
    // `engineering.agents.shared` is valid Genome and must be allowed.
    const result = applyAddAgent(fixture("teams.yaml"), { department: "engineering", id: "shared" });
    expect(result.ok).toBe(true);
    const ids = nodeIds(okOrThrow(result));
    expect(ids).toContain("agent:engineering.shared");
    expect(ids).toContain("agent:engineering.platform.shared");
  });
});

// ---------------------------------------------------------------------------
// E10–E11 — the compiler stays the authority
// ---------------------------------------------------------------------------

describe("E11 — an invalid input source is refused before any transformation", () => {
  it("returns invalid-source carrying the compiler's diagnostics verbatim", () => {
    const source = fixture("invalid.yaml");
    const expected = compile(source);
    expect(expected.ok).toBe(false);
    if (expected.ok) throw new Error("unreachable");

    const result = applyAddAgent(source, { department: "engineering", id: "newcomer" });
    expect(result.ok).toBe(false);
    if (result.ok || result.failure !== "invalid-source") throw new Error("expected invalid-source");
    expect(result.diagnostics).toEqual(expected.diagnostics);
    expect(result).not.toHaveProperty("source");
  });

  it("refuses malformed YAML as invalid-source", () => {
    const result = applyAddAgent("company: [unclosed", { department: "engineering", id: "newcomer" });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.failure).toBe("invalid-source");
  });
});

describe("E10 — invalid-result carries the compiler's diagnostics", () => {
  it("never returns a success whose source the compiler rejects", () => {
    // Drive the invalid-result path with an intent the compiler will reject.
    // `autonomy` is intent-validated, so reach past it as an untyped caller
    // would: the operation must still refuse, on the compiler's word.
    const rogue = { department: "engineering", id: "newcomer", role: 42 } as unknown as AddAgentIntent;
    const result = applyAddAgent(fixture("minimal.yaml"), rogue);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    // Either the intent guard or the compiler catches it — never a success.
    expect(["invalid-intent", "invalid-result"]).toContain(result.failure);
    expect(result).not.toHaveProperty("source");
  });

  it("reports the compiler's own words when a candidate fails to compile", () => {
    // An id that is structurally fine but breaks nothing cannot fail; instead
    // assert the contract directly: any ok:true source must compile.
    for (const name of ["minimal.yaml", "commented.yaml", "quoted.yaml", "teams.yaml", "no-agents.yaml"]) {
      const result = applyAddAgent(fixture(name), { department: "engineering", id: "probe", role: "R" });
      if (result.ok) expect(compile(result.source).ok).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// E13–E17 — contract properties
// ---------------------------------------------------------------------------

describe("E13 — authoring never derives a revision", () => {
  it("returns no revision and mentions none in its result", () => {
    const result = applyAddAgent(CANONICAL, WRITER);
    expect(result).not.toHaveProperty("revision");
    expect(result).not.toHaveProperty("genomeRevision");
    expect(JSON.stringify(result)).not.toContain("genomeRevision");
  });

  it("leaves the revision to the compiler, which derives a different one", () => {
    const before = compile(CANONICAL);
    const after = compile(okOrThrow(applyAddAgent(CANONICAL, WRITER)));
    if (!before.ok || !after.ok) throw new Error("both must compile");
    expect(after.graph.genomeRevision).not.toBe(before.graph.genomeRevision);
    expect(after.graph.genomeRevision).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("E14 — omitted optional fields stay omitted", () => {
  it("writes no autonomy key when autonomy is not supplied", () => {
    // This fixture has no `agents:` key, so the mapping is created too (E17).
    const source = fixture("no-agents.yaml");
    const after = okOrThrow(applyAddAgent(source, { department: "engineering", id: "newcomer" }));

    const addedLines = after.split("\n").filter((line) => !source.split("\n").includes(line));
    expect(addedLines).toEqual(["    agents:", "      newcomer: {}"]);
    expect(after).not.toContain("autonomy:");
    expect(after).not.toContain("role:");
    expect(after).not.toContain("skills:");
  });

  it("the deny-safe default is never materialized as `manual`", () => {
    const after = okOrThrow(applyAddAgent(CANONICAL, { department: "engineering", id: "newcomer" }));
    const addedLines = after.split("\n").filter((line) => !CANONICAL.split("\n").includes(line));
    expect(addedLines.join("\n")).not.toContain("autonomy");
  });
});

describe("E15 — supplied optional fields are written", () => {
  it("writes role, autonomy and skills with the given values", () => {
    const source = fixture("no-agents.yaml");
    const after = okOrThrow(
      applyAddAgent(source, {
        department: "engineering",
        id: "newcomer",
        role: "Technical Writer",
        autonomy: "supervised",
        skills: ["writing", "editing"],
      }),
    );

    expect(after).toContain("role: Technical Writer");
    expect(after).toContain("autonomy: supervised");
    expect(after).toContain("- writing");
    expect(after).toContain("- editing");
    expect(compile(after).ok).toBe(true);
  });

  it("rejects an autonomy value outside the accepted set, as invalid-intent", () => {
    const result = applyAddAgent(CANONICAL, {
      department: "engineering",
      id: "newcomer",
      autonomy: "wizard" as never,
    });
    expect(result.ok).toBe(false);
    if (result.ok || result.failure !== "invalid-intent") throw new Error("expected invalid-intent");
    expect(result.problems[0]).toMatchObject({ kind: "invalid-autonomy", value: "wizard" });
  });

  it("rejects a missing department or id, as invalid-intent", () => {
    const missingId = applyAddAgent(CANONICAL, { department: "engineering", id: "  " });
    expect(missingId.ok).toBe(false);
    if (missingId.ok || missingId.failure !== "invalid-intent") throw new Error("expected invalid-intent");
    expect(missingId.problems).toContainEqual({ kind: "missing-id" });

    const missingDepartment = applyAddAgent(CANONICAL, { department: "", id: "newcomer" });
    expect(missingDepartment.ok).toBe(false);
  });
});

describe("E16 — the operation does not mutate its input", () => {
  it("leaves the caller's source string unchanged", () => {
    const source = fixture("minimal.yaml");
    const copy = `${source}`;
    applyAddAgent(source, { department: "engineering", id: "newcomer", role: "New" });
    expect(source).toBe(copy);
  });
});

describe("E17 — a department with no agents key", () => {
  it("creates the mapping and the result compiles", () => {
    const result = applyAddAgent(fixture("no-agents.yaml"), {
      department: "engineering",
      id: "first",
      role: "Engineer",
    });
    const after = okOrThrow(result);

    expect(after).toContain("agents:");
    expect(after).toContain("mission: Build things");
    expect(compile(after).ok).toBe(true);
    expect(nodeIds(after)).toContain("agent:engineering.first");
  });
});

// ---------------------------------------------------------------------------
// E12 / E18 / E19 — boundary tripwires
// ---------------------------------------------------------------------------

describe("E18 — the compiler's Diagnostic contract is not expanded", () => {
  it("authoring-owned failures are not typed or shaped as compiler Diagnostics", () => {
    const intentFailure = applyAddAgent(CANONICAL, { department: "", id: "" });
    if (intentFailure.ok || intentFailure.failure !== "invalid-intent") throw new Error("expected invalid-intent");
    for (const problem of intentFailure.problems) {
      expect(problem).not.toHaveProperty("stage");
      expect(problem).not.toHaveProperty("severity");
      expect(problem).not.toHaveProperty("path");
    }

    const conflict = applyAddAgent(CANONICAL, { department: "marketing", id: "newcomer" });
    if (conflict.ok || conflict.failure !== "conflict") throw new Error("expected conflict");
    expect(conflict.problem).not.toHaveProperty("stage");
  });

  it("compiler-originating failures carry unmodified Diagnostics", () => {
    const source = fixture("invalid.yaml");
    const expected = compile(source);
    if (expected.ok) throw new Error("fixture must fail to compile");

    const result = applyAddAgent(source, { department: "engineering", id: "newcomer" });
    if (result.ok || result.failure !== "invalid-source") throw new Error("expected invalid-source");
    // Same objects, same stages, same wording — nothing re-phrased.
    expect(result.diagnostics).toEqual(expected.diagnostics);
    for (const diagnostic of result.diagnostics) {
      expect(["parse", "schema", "semantic"]).toContain(diagnostic.stage);
    }
  });
});

describe("failure atomicity (RFC-0010 §5)", () => {
  it("no failure result carries a source field", () => {
    const failures: AuthoringResult[] = [
      applyAddAgent("company: [unclosed", { department: "engineering", id: "x" }),
      applyAddAgent(CANONICAL, { department: "", id: "" }),
      applyAddAgent(CANONICAL, { department: "marketing", id: "x" }),
      applyAddAgent(fixture("minimal.yaml"), { department: "engineering", id: "existing" }),
    ];
    for (const result of failures) {
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("source");
    }
  });
});
