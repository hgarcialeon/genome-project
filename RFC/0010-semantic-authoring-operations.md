# RFC-0010: Semantic Authoring Operations (`add-agent`)

## Status

**Accepted 2026-09-13 under Option B** — accept with amendments A1–A12 and the
§13 evidence amendments applied. Architecture Board review
`docs/reviews/rfc-0010-board-review.md`; Product Owner ratification recorded
there (§28). The durable architectural property is recorded as
`docs/adr/0012-semantic-authoring-boundary.md`.

Commissioned 2026-09-13 by the Product Owner's ratification of Option C with
amendments A1–A8
(`docs/reviews/phase-4-m1-authoring-remediation-board-review.md` §8; proposal
`docs/proposals/phase-4-m1-authoring-remediation.md`).

Acceptance adds **exactly one** item to `IMPLEMENTATION_QUEUE.md`. It closes no
milestone, marks no roadmap deliverable Done, and opens no phase. Current project
state lives in `PROJECT_STATE.md` and is not restated here (Governance Rule 8).

## Commissioning and authority

Phase 4 Milestone 1 product acceptance was **rejected** 2026-09-13
(`docs/reviews/phase-4-m1-product-acceptance.md` §12) on one blocking failure:

> …a user cannot discover or perform the canonical organizational change
> ("add an agent") without understanding and manually editing the Genome source
> structure.

Root cause: Genome has accepted surfaces for *source → meaning* and none for
*intent → source*. This RFC defines the smallest capability that closes that gap.

## Summary

A **toolchain-owned semantic authoring capability** — the package
`@genome/authoring`, whose public surface accepts Genome source plus a declared
organizational **intent** and returns either new canonical Genome source or a
structured failure.

Scope is exactly one operation: **`add-agent`**, department-scoped.

Studio expresses intent. The toolchain owns how intent becomes a valid document
change. The compiler continues to own interpretation, validation, diagnostics and
projections, **unchanged**.

---

## 1. Ownership

### 1.1 Where semantic authoring lives

**`@genome/authoring`**, a new package depending on `@genome/schema` (parsing)
and `@genome/compiler` (validation and diagnostics).

### 1.2 Why not Studio

Constitution Principle 5 and Governance Rule 5: views own no domain logic.
Knowing that an agent is a keyed entry under `departments.<id>.agents.<id>` is
language structure. Placing it in Studio creates a second implementation of
Genome semantics with no compiler test to catch its drift.

This is not hypothetical. Genome's cross-references are compiler-enforced and
schema-invisible: a document whose `workflows.w.owner` names a nonexistent agent
is refused with `'eng.ghost' does not resolve to an existing agent`. A view
reimplementing placement would have to track that class of rule forever.

### 1.3 Why not a compiler target — and why not `@genome/schema`

**(A1)** `SPEC/schema/genome.schema.json` types `departments` as
`{"type": "object", "additionalProperties": {"type": "object"}}`, has **no
`$defs`**, and requires only `genomeVersion` and `company` at the top level. **It
constrains agent shape not at all.** Agent structure lives solely in
`packages/genome-compiler/src/ast/index.ts` (`AgentNode`) and
`packages/genome-compiler/src/semantics/index.ts`. There is therefore no schema
structure from which authoring could be derived, and no "schema form" alternative
was ever available.

**Not a compiler target.** The compiler's accepted boundary (ADR-0002, ADR-0003,
RFC-0002) is **source → meaning**: its four targets are projections *out of* a
compiled graph. Authoring runs the other way and carries concerns the compiler
deliberately has none of:

| Concern | Compiler today | Authoring needs |
|---|---|---|
| Comments, formatting, key order | discarded at parse (`YAML.parse`) | **must be preserved** |
| Partial / in-progress documents | rejected | must be reasoned about |
| Placement (where a construct belongs) | irrelevant | **central** |
| Output | a graph | **source text** |

The compiler's canonical path calls `parseGenomeDocument`, i.e. plain
`YAML.parse`, which returns data with no comments, formatting or key positions.
Authoring hosted in the compiler would need a *second* parse path the compiler
otherwise has no use for — sharing the package but not its machinery.

**Not `@genome/schema` (A2).** It already owns `yaml` and parsing, which makes it
superficially attractive. It is rejected because authoring must call the compiler
for §4 validation, while **the compiler depends on `@genome/schema`** — hosting
authoring there creates a **dependency cycle**. It would also give document
*authorship* to the most-depended-upon package in the workspace, whose accepted
role is validation of what already exists.

**The compiler stays `source → meaning`. Authoring is `intent → source`. The two
are not blurred.**

### 1.4 Boundary statement (Principle 5)

| Layer | Owns |
|---|---|
| **Studio** | capturing user intent; invoking the accepted operation; presenting the resulting source and diagnostics |
| **`@genome/authoring`** | how a declared intent maps to a valid Genome document change; placement; source preservation |
| **Compiler** | interpretation, validation, diagnostics, projections, revision derivation |

Studio gains **no** knowledge of Genome document structure.

## 2. Operation model — `add-agent`

### 2.1 The intent

```
{ kind: "add-agent", department, id, role?, autonomy?, skills? }
```

| Field | Required | Notes |
|---|---|---|
| `department` | **yes** | id of an existing department in the document |
| `id` | **yes** | the new agent's id |
| `role` | **no** | free text |
| `autonomy` | **no** | one of `manual` \| `supervised` \| `autonomous` |
| `skills` | **no** | list of strings **(A4)** |

**No new Genome-language fields are introduced.** Every field above already
exists in the accepted agent shape (`AgentNode`: `role?`, `autonomy?`,
`skills: string[]`).

### 2.2 The operation is never stricter than the language (A3)

Re-executed against the accepted compiler:

| Probe | Result |
|---|---|
| agent with **neither** `role` nor `autonomy` | **compiles — valid** |
| `autonomy: supervised` only | compiles |
| `autonomy: wizard` | refused — `'wizard' is not a valid autonomy level (expected one of: manual, supervised, autonomous)` |

`SPEC/language.md`: *"If `autonomy` is omitted, it defaults to `manual`… Absence
of a declared autonomy level never grants autonomy (deny-safe)."*

Therefore:

1. **The operation requires only `department` and `id`.** Requiring `role` would
   make the toolchain stricter than the compiler — a semantic change by the back
   door.
2. **An omitted `autonomy` is omitted from the emitted source.** It is never
   materialized as `manual`. Writing the default as a declared value would
   convert a deny-safe *default* into an *assertion*, changing what the document
   says and its derived revision.
3. The same applies to `role` and `skills`: omitted in, omitted out.

**Requiring a role is a Studio product decision, not an operation rule.** Studio
may mark `role` as expected, prefill it, or warn on its absence. The operation
accepts its absence.

### 2.3 Department-scoped placement only

Agents may validly appear in two places:

```
departments.<id>.agents.<id>            ← this operation
departments.<id>.teams.<id>.agents.<id> ← excluded
```

These differ in the container that must exist, the failure modes, and the
**identity produced** — `agent:<dept>.<id>` versus `agent:<dept>.<team>.<id>`.
Team placement is therefore a genuinely distinct operation, not a parameter
variant, and is excluded (§9). The canonical example contains zero teams, so team
placement is not exercisable by the acceptance scenario in any case.

### 2.4 Duplicate behavior (A5)

**Genome defines no general agent-id uniqueness semantic.** Re-executed:

| Probe | Result |
|---|---|
| duplicate id in the **same** mapping | refused **by the YAML parser** — `Map keys must be unique at line N` |
| same id in a department **and** a team beneath it | **compiles — both valid** |
| same id in **two different** departments | **compiles — both valid** |

Therefore:

1. Duplicate refusal is an **operation-level `conflict`**, not a language rule.
2. It is a **pre-check**. Appending a duplicate key and deferring to validation
   would surface a YAML line/column error to a user who asked to add a colleague.
   The `conflict` path exists to prevent that.
3. Uniqueness is scoped to the **target mapping only**. The operation must **not**
   refuse an id present in another department or in a team beneath the target.
   Existing accepted documents carrying the same local agent id in different
   scopes remain valid wherever the compiler accepts them today.

### 2.5 Not generalized

One operation. This RFC defines no operation *language*, no generic patch format,
no registry, and no extension point. The vocabulary grows by decision.

## 3. Input and output

### 3.1 Contract

```
applyAddAgent(source: string, intent: AddAgentIntent): AuthoringResult

type AuthoringResult =
  | { ok: true;  source: string }
  | { ok: false; failure: AuthoringFailure }
```

**Genome source text in. Genome source text out.** On failure there is **no
`source` field at all** (§5).

The operation is a **pure function**: no I/O, no file read or write, no mutation
of its input. Persisting the returned source is the caller's business.

### 3.2 Why source in, source out

- The source is canonical; a contract in source text cannot create a structured
  state competing with it.
- Comments and formatting exist **only** in the text — any other input has
  already discarded what the output must preserve.
- It avoids promoting the compiler's internal AST, or a `yaml` library object, to
  a public Genome contract without demonstrated need.

Rejected alternatives: a parsed `YAML.Document` (makes the library normative by
the back door), the compiler AST (an internal detail of a read-only pipeline,
carrying no comments), schema output (a verdict, not a document), and the
graph/runtime model (lossy projections that cannot reconstruct source).

### 3.3 One named operation, not a dispatcher

`applyAddAgent` is a **named function**. A dispatcher —
`applyOperation({ kind: "add-agent", … })` — **is** an operation language: it
defines a `kind` space, a dispatch contract and an implicit promise of
extensibility on the strength of a single operation, and it would make every
future operation feel like a parameter addition rather than a governed decision.
A dispatcher may be introduced later *if and when* a second operation earns it,
as its own decision.

## 4. Diagnostics (A8)

### 4.1 Four distinguishable failures

| `failure` | Meaning | Carries |
|---|---|---|
| `invalid-source` | the input does not parse or does not compile | the **compiler's** `Diagnostic[]`, verbatim |
| `invalid-intent` | the intent is not well-formed (missing `id`; `autonomy` outside the enum) | an **authoring-owned** operation-failure description |
| `conflict` | well-formed, but cannot apply to *this* document (unknown department; id already in the target mapping) | an **authoring-owned** operation-failure description |
| `invalid-result` | a candidate was produced but does not compile | the **compiler's** `Diagnostic[]`, verbatim |

### 4.2 The compiler's `Diagnostic` type is not widened

`Diagnostic.stage` is declared `"parse" | "schema" | "semantic"` — **required and
closed**. An authoring-originated failure is none of those. Typing it as a
`Diagnostic` would require widening `CompileStage`, which is a production diff
under `packages/genome-compiler/src` — forbidden by §10.

Therefore `invalid-intent` and `conflict` carry a **narrowly scoped,
authoring-owned** failure representation that is **not** a compiler `Diagnostic`.

**This is not a competing Genome diagnostic taxonomy.** Those two failures
describe *the operation* ("no department `engineering`"; "an agent `dev` already
exists there") and never the language. **Compiler semantics and diagnostic
contracts remain unchanged.**

### 4.3 Compiler diagnostics remain authoritative

`invalid-source` and `invalid-result` carry the compiler's diagnostics
**verbatim**, never re-worded. `invalid-result` in particular indicates the
toolchain produced a document the compiler rejects — anything but the compiler's
own words would obscure a defect.

**Cross-reference validation is never duplicated.** The operation produces a
candidate and asks the compiler; it re-derives no owner-resolution, policy
binding, or any other compiler-enforced rule.

### 4.4 Fail before returning success

The candidate is compiled **before** a result is returned. A failing candidate
becomes `invalid-result` and the caller receives no source. `invalid-source` is
checked first, so an operation is never applied to an already-invalid document
and every failure is attributable.

## 5. Failure atomicity (A9)

**On any failure the result carries no successful mutated `source` — neither the
original nor the candidate.**

- Returning the **candidate** invites the exact accident to be prevented: a
  caller ignoring `ok` gets a plausible document that does not compile.
- Returning the **original** is redundant and equally invites `result.source`
  being read without checking `ok`.
- **Omitting the field** makes misuse a *type error*: `source` exists only on the
  `ok: true` branch of the discriminated union.

The operation never mutates its input.

## 6. Source preservation (A6)

Stated as **observable behavior**, in three tiers. Tiers are derived from
measurement against the accepted implementation approach, not from aspiration.

### 6.1 Tier 1 — required preservation (normative)

| # | Requirement |
|---|---|
| R1 | Every comment in the input is present in the output with its anchoring — including the leading block and the RFC-0008 non-normative-for-governance disclaimer. |
| R2 | Every mapping key and scalar value present in the input is present in the output, unchanged in value. |
| R3 | Key ordering is preserved outside the modified mapping; the new agent is appended within it. |
| R4 | Quoting style is preserved. |
| R5 | No semantic content is added or removed beyond the requested agent. |
| R6 | **On the canonical fixture `SPEC/examples/genome-project.yaml`, the diff against the input is exactly the added agent's lines.** |

R6 is the strongest honest statement available and is **measured**: under the
feasibility configuration the canonical example round-trips byte-identically with
no edit, and an `add-agent` adds exactly two lines and removes none.

### 6.2 Tier 2 — desirable preservation (non-normative)

Retained where practical, but not normative where the underlying source
representation normalizes them:

- non-default **uniform** indentation;
- line endings.

### 6.3 Tier 3 — disclosed normalization (explicitly not preserved)

Empirically shown not to round-trip under the accepted approach, and disclosed
rather than promised:

- **CRLF line endings** are normalized to LF;
- **mixed or custom indentation** is normalized to a uniform style;
- any other formatting empirically shown not to round-trip.

**No byte-preservation claim is made for any property empirical testing
disproved.**

### 6.4 Implementation constraints

- The implementation **must not perform unnecessary whole-document rewriting**.
- `SPEC/examples/genome-project.yaml` is a **required** preservation fixture
  (E6). Its governance disclaimer must be provably intact.
- The `yaml` v2 configuration used to obtain the feasibility evidence —
  **`lineWidth: 0` included** — is **implementation evidence, not a normative
  dependency**. Any mechanism satisfying Tier 1 is acceptable.

## 7. Determinism (A7)

**Pinned separately from preservation.** These are different properties and must
not be conflated: determinism is *same input → same output*; preservation is
*output resembles input outside the edit* (§6).

**Normative contract:**

> The same exact source **bytes** plus the same exact `add-agent` intent yields
> **byte-identical** resulting source.

**Identical intent means, exactly:** the same `department` and `id` values, and
for each of `role`, `autonomy` and `skills`, **the same presence-or-absence and,
when present, the same value** (for `skills`, the same values in the same order).

Nothing else participates. No clock, environment, locale, filesystem, id
generation, or iteration over an unordered collection. Determinism holds across
invocations, processes and platforms.

A weaker "semantically equivalent" contract is rejected: it would permit
reformatting that changes the compiled `genomeRevision`, surfacing to a user as a
spurious organizational change.

## 8. Revision semantics

**`@genome/authoring` never computes, predicts, stores, preserves as metadata, or
supplies `genomeRevision`.**

It returns source. The existing compiler derives the revision from that source at
Stage 5, exactly as for a hand-edited document. Revision identity,
canonicalization and SHA-256 are untouched and **ADR-0011 remains unchanged**.

## 9. Studio integration (A10, A11)

### 9.1 One lifecycle for all source edits

**The operation's output enters Studio through the existing ordinary source-edit
lifecycle. This RFC creates no authoring-specific compile lifecycle.**

1. The user identifies a department from the **organization surface** (tree or
   graph) — not from the source.
2. The user chooses **Add agent**.
3. The user provides the required information (§2.1).
4. Studio invokes `applyAddAgent`.
5. On success, **the returned source becomes the editor source**, exactly as a
   keystroke's result would.
6. The existing **Checkpoint-2 source state machinery** applies — projections
   mark themselves stale.
7. The existing accepted **400 ms auto-compile** behavior may compile it
   normally. **No special explicit-compile gate is introduced.**
8. Projections change **only** after the existing compiler pipeline produces new
   accepted outputs.

On failure, Studio presents the returned failure and diagnostics; the source is
unchanged.

**Studio must not update graph or tree directly** — not from the operation's
result, not by any shortcut. Refreshing projections from anything other than a
compile would reintroduce the second-implementation problem this RFC exists to
prevent (E12).

### 9.2 Canonical source visibility (A11)

The resulting source is **immediately inspectable** in Studio. Visual authoring
does not hide or replace the durable Genome artifact.

This protects an already-passing acceptance criterion: the Milestone-1 record
credits the user's ability to trace a required principal back to the line in the
document that produced it. An authoring surface that concealed the source would
break evidence that already passed.

### 9.3 Accessibility (A12)

The existing Milestone-1 **WCAG 2.2 AA** acceptance floor
(`IMPLEMENTATION_QUEUE.md`) applies to **both the success and failure paths** of
Add agent: discoverability, target-department context, field labels, validation
and failure messages, keyboard completion, cancel/recovery.

**Predictable focus behavior is required for:** opening Add agent; validation
errors; operation conflicts; successful mutation; and cancel.

This RFC does **not** expand into a general Studio accessibility redesign; the
Checkpoint-6 hardening stands as accepted.

## 10. Protected boundaries

Each a verifiable empty diff or absence:

| Boundary | Expected |
|---|---|
| `SPEC/schema/genome.schema.json` | **empty diff** |
| `SPEC/language.md` semantics | **empty diff** |
| `packages/genome-compiler/src` production | **empty diff** — including the `Diagnostic` / `CompileStage` contract (§4.2) |
| `packages/genome-runtime/src` production | **empty diff** |
| `packages/genome-runtime/src/events` | **empty diff** |
| Revision derivation / canonicalization | **unchanged** (ADR-0011 not reopened) |
| Governance semantics | **unchanged** |
| Persistence | **absent** |
| Exported-log reader | **absent** |
| Provider adapters | **absent** |
| Trigger behavior | **absent** |

**If implementation requires crossing any of these, work stops and returns to the
Architecture Board.**

The new package and its Studio integration are additive. Note that
`@genome/authoring` deliberately **does** own new semantics — which is why it is a
governed package with this RFC, not a Studio convenience.

## 11. Explicit exclusions

- `edit-agent`, `delete-agent`, `add-workflow`, `add-policy`;
- **team-scoped agent placement** (§2.3) — a distinct future operation;
- arbitrary JSON/YAML patches, generic CRUD, bulk mutation;
- an operation *language*, registry, dispatcher, or extension point;
- schema-driven form generation; drag-and-drop organizational editing;
- creating departments, teams, or any construct other than an agent;
- file I/O, persistence, durable logs;
- **any CLI command** — no concrete second consumer exists today; Phase 6
  self-improvement would consume the package API directly. Recorded as the
  obvious next consumer when one actually exists;
- any change to language, schema, compiler, runtime, events, revision or
  governance semantics;
- Milestone 2, the Autonomy Substrate, Office View, Marketplace, simulation.

The objective is to **prove the authoring architecture**, not to build a no-code
Genome editor.

## 12. Language Complexity Budget

**Non-zero. Recorded here, not hidden inside a Studio implementation task.**

### New capability

| Dimension | Count |
|---|---|
| New semantic operation (`add-agent`) | **1** |
| New document-transformation contract | **1** |
| New public toolchain surface | **1** |
| New maintained package (`@genome/authoring`) | **1** |
| New Studio authoring interaction | **1** |

### Unchanged — verified zero

| Dimension | Count |
|---|---|
| Genome syntax | **0** |
| Genome language semantics | **0** — §2.2 and §2.4 conform the operation to the language rather than the reverse |
| New Genome-language fields | **0** |
| Schema semantics | **0** |
| Compiler semantics | **0** — including the `Diagnostic`/`CompileStage` contract (§4.2) |
| Runtime | **0** |
| Events | **0** |
| Revision | **0** |
| Governance | **0** |
| Persistence | **0** |

The budget is spent **entirely on new capability**; nothing already accepted
moves. This is why the capability required its own RFC (Governance Rule 2).

## 13. Definition of Done

Standing governance requirement (Governance, RFC Completion Criteria):
`PROJECT_STATE.md`, `ROADMAP.md` deliverable statuses and
`IMPLEMENTATION_QUEUE.md` reflect the work at the moment it lands, and
`pnpm check-state` passes.

All evidence **uncached** (`pnpm test -- --force`).

1. `pnpm check-state`, `pnpm typecheck`, `pnpm test -- --force`, `pnpm build` —
   green.
2. **Protected-boundary evidence** (§10) — each an explicit empty diff or
   absence.
3. **Executable evidence:**

   | # | Case |
   |---|---|
   | E1 | add an agent to a valid department → `ok: true` |
   | E2 | the resulting source **compiles** |
   | E3 | the agent appears in `graphTarget` output, as `agent:<dept>.<id>` |
   | E4 | the agent appears in `inspectTarget` output — in `departments[].agents[]` and reflected in `counts.Agent` |
   | E5 | required preservation holds (§6.1 R1–R6): comments, keys, values, ordering, quoting, and on the canonical fixture a diff of exactly the added agent's lines |
   | E6 | the RFC-0008 governance disclaimer survives — `SPEC/examples/genome-project.yaml` as a required fixture |
   | E7 | determinism — same source bytes + same intent → byte-identical output, with intent identity per §7 |
   | E8 | a nonexistent target department is refused as `conflict` |
   | E9 | an id already present **in the target mapping** is refused as `conflict`, **and** the operation does **not** refuse an id present in another department or in a team beneath the target |
   | E10 | `invalid-result` carries the **compiler's** diagnostics verbatim |
   | E11 | a non-compiling input is refused as `invalid-source` before any transformation |
   | E12 | **no Studio-owned YAML transformation** — Studio production source contains no document mutation, **and** Studio does not refresh graph/tree from the operation result |
   | E13 | authoring never derives, predicts, stores or supplies a `genomeRevision` |
   | E14 | `role`, `autonomy` and `skills` each **omitted** → `ok: true`, and the emitted source contains **no** `autonomy` key (the deny-safe default is never materialized) |
   | E15 | `role`, `autonomy` and `skills` each **supplied** → present in the emitted source with the given values |
   | E16 | the operation does not mutate its input source |
   | E17 | a department whose `agents` key is **absent** → the key is created and the result compiles |
   | E18 | **no compiler `Diagnostic` contract expansion** — `CompileStage` and `Diagnostic` are byte-unchanged; authoring failures are not typed as `Diagnostic` |
   | E19 | **no authoring-specific compile path** — the operation's output enters through the ordinary edit lifecycle and the existing Checkpoint-2 machinery governs |

4. **Studio integration evidence** — the §9.1 sequence end to end, including that
   the output enters through the existing edit path and marks projections stale.
5. **Accessibility evidence** — the §9.3 floor, including the keyboard-only
   `add-agent` journey, focus behavior on every named transition, and axe-clean
   states for the new interaction on both success and failure paths.
6. **Product acceptance — a recorded reviewer walkthrough** (§14). **Not a CI
   gate.** Items 1–5 are **necessary but not sufficient.**

## 14. Product acceptance scenario

> A first-time user can add an agent to Engineering **without external
> instruction or prior knowledge of Genome YAML structure.**

The Product Owner must be able to:

1. recognize that the organization is editable;
2. discover **Add agent** from the organization surface;
3. add an agent to Engineering without knowing Genome YAML structure;
4. see the resulting source;
5. understand that projections are now stale;
6. compile;
7. see the new agent reflected by **compiler-derived** projections.

This remains a **human** acceptance criterion (RFC-0009 Amendment 4). Automated
tests are necessary but not sufficient. **Every §10.1 criterion of RFC-0009 that
already passed must still pass** — the remediation may not trade accepted
evidence for new capability.

## 15. Relationship to Milestone 1

RFC-0010 exists to clear the Milestone-1 blocker. It **preserves Checkpoints
1–7**: no redesign of the graph, tree, compilation-state model, runtime session,
governed execution, event stream, approval flow, or accessibility hardening is
authorized.

The only integration change required is a new entry point that produces an edit,
plus the interaction that collects the intent. Everything downstream of "the
editor source changed" is existing accepted machinery and remains so (§9.1).

## Constitutional check

- **P2 (source of truth):** the Genome document remains the single source of
  truth. The operation returns source; it creates no competing representation.
- **P5 (views own no business logic):** Studio names an intent and renders a
  result; every structural decision lives in the toolchain (§1.4).
- **P6 (runtime produces events):** untouched. Authoring produces source, not
  events.
- **P9 (human governance first-class):** better served — a human can express an
  organizational change without the language acting as a gate on participation.
- **P10 / Charter ("define the model before the UI"):** the operation contract
  and its evidence are defined here, before any interaction is built.

## Explicitly not authorized / not done by this RFC

- **No implementation in the acceptance commit.**
- **No second operation**, no operation language, no dispatcher, no CLI surface.
- **No language, schema, compiler, runtime, event-taxonomy, revision or
  governance change** — §10.
- **No milestone closed, no roadmap deliverable marked Done, no phase closed.**
  Phase 4 remains open for Milestone 1 only; the Milestone-1 product acceptance
  remains **Rejected pending remediation**.
- **No team-scoped placement**, no construct other than an agent.
