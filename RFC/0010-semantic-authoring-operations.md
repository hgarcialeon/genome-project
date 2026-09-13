# RFC-0010: Semantic Authoring Operations (`add-agent`)

## Status

**Draft — prepared for Architecture Board review. Not accepted. Not ratified.**

Commissioned 2026-09-13 by the Product Owner's ratification of Option C with
amendments A1–A8
(`docs/reviews/phase-4-m1-authoring-remediation-board-review.md` §8; proposal
`docs/proposals/phase-4-m1-authoring-remediation.md`).

**This RFC authorizes nothing.** No implementation, no queue item, no package.
Acceptance requires Board review and Product Owner ratification; only then does
an implementation item enter `IMPLEMENTATION_QUEUE.md`.

Current project state lives in `PROJECT_STATE.md` and is not restated here
(Governance Rule 8).

## Commissioning and authority

Phase 4 Milestone 1 product acceptance was **rejected** 2026-09-13
(`docs/reviews/phase-4-m1-product-acceptance.md` §12) on one blocking failure:

> …a user cannot discover or perform the canonical organizational change
> ("add an agent") without understanding and manually editing the Genome source
> structure.

Root cause: Genome has accepted surfaces for *source → meaning* and none for
*intent → source*. This RFC proposes the smallest capability that closes that
gap.

## Summary

Introduce a **toolchain-owned semantic authoring capability** — a new package
whose public surface accepts a Genome document plus a declared organizational
**intent**, and returns either new canonical Genome source or diagnostics.

Scope is exactly one operation: **`add-agent`**.

Studio expresses intent. The toolchain owns how intent becomes a valid document
change. The compiler continues to own interpretation, validation and
projections, unchanged.

---

## 1. Ownership

### 1.1 Where semantic authoring lives

**Proposed: a new package, `@genome/authoring`.**

Dependencies: `@genome/schema` (parsing) and `@genome/compiler` (validation and
diagnostics). Nothing depends on it except consumers that author — initially
Studio, later the CLI and the Phase 6 self-improvement work.

### 1.2 Why not Studio

Constitution Principle 5 and Governance Rule 5: views own no domain logic.
Knowing that an agent is a keyed entry under `departments.<id>.agents.<id>` is
language structure. Placing it in Studio creates a second implementation of
Genome semantics with no compiler test to catch its drift — the specific outcome
the ratified direction forbids.

### 1.3 Why not a compiler target

The compiler's boundary (ADR-0002, ADR-0003, RFC-0002) is **source → meaning**:
parse, validate, analyze, project. Its four targets (`inspect`, `graph`, `docs`,
`runtime-model`) are all projections *out of* a compiled graph.

Authoring runs the other way — **intent → source** — and carries concerns the
compiler deliberately has none of:

| Concern | Compiler today | Authoring needs |
|---|---|---|
| Comments, formatting, key order | discarded at parse | **must be preserved** |
| Partial / in-progress documents | rejected | must be reasoned about |
| Placement (where a construct belongs) | irrelevant | **central** |
| Output | a graph | **source text** |

Folding the inverse into the compiler would entangle the language's most stable
surface with its least settled one, and make every future operation a change to
the most protected package in the repository — one whose boundary has been
crossed exactly once, under a narrow one-time authorization (ADR-0011) this RFC
does not reopen.

**The compiler stays `source → meaning`. Authoring is `intent → source`. The two
are not blurred.** (A1)

### 1.4 Boundary statement (A1, Principle 5)

| Layer | Owns |
|---|---|
| **Studio** | capturing user intent; invoking the accepted operation; displaying the resulting source and diagnostics |
| **Authoring package** | how a declared intent maps to a valid Genome document change; placement; source preservation |
| **Compiler** | interpretation, validation, diagnostics, projections, revision derivation |

Studio gains **no** knowledge of Genome document structure. It names an intent
and renders what comes back.

## 2. Operation model — `add-agent`

### 2.1 The intent

Conceptually:

```
{ kind: "add-agent", department, id, role?, autonomy? }
```

| Field | Required | Notes |
|---|---|---|
| `department` | **yes** | id of an existing department in the document |
| `id` | **yes** | the new agent's id |
| `role` | see §2.2 | free text |
| `autonomy` | **no** | one of `manual` \| `supervised` \| `autonomous` |

**No new Genome-language fields are introduced.** Every field above already
exists in the language (`SPEC/language.md`).

### 2.2 A finding the Board must rule on

Inspection of the accepted surfaces shows the language is **more permissive than
the product scenario implies**:

- `SPEC/schema/genome.schema.json` types `departments` as
  `object → object` — **it constrains agent shape not at all**;
- `packages/genome-compiler/src/ast/index.ts` reads `role` and `autonomy` as
  **optional**;
- `packages/genome-compiler/src/semantics/index.ts` validates `autonomy` against
  the enum **only when present**;
- `SPEC/language.md` §"Agent Autonomy Levels": *"If `autonomy` is omitted, it
  defaults to `manual`… Absence of a declared autonomy level never grants
  autonomy (deny-safe)."*

So **an agent with neither `role` nor `autonomy` is a valid Genome agent today.**

Two consequences:

1. **The operation must not invent a requirement the language does not have.**
   Requiring `role` in the *operation* would make the toolchain stricter than the
   compiler — a semantic change by the back door.
2. **The product may still require it in the UI.** Studio asking for a role is a
   product decision about good organizations, not a language rule.

**Proposed resolution (OQ1):** the operation requires only `department` and
`id`. `role` and `autonomy` are optional and omitted from the emitted source when
not supplied, so `autonomy` keeps its deny-safe language default rather than
being materialized. Studio's form may mark `role` as expected while the operation
accepts its absence.

### 2.3 A placement question the Board must rule on

Agents may appear in **two** places
(`packages/genome-compiler/src/semantics/index.ts`):

```
departments.<id>.agents.<id>
departments.<id>.teams.<id>.agents.<id>
```

**Proposed resolution (OQ2):** Milestone-1 remediation targets
`departments.<id>.agents.<id>` only. A team-scoped target is a second placement
and therefore effectively a second operation — excluded under A5. An intent
naming a department that does not exist is refused; team placement is simply not
expressible in this operation's vocabulary.

### 2.4 Not generalized

This RFC defines **one** operation. It deliberately does **not** define an
operation *language*, a generic patch format, a registry, or an extension point.
The vocabulary grows by decision, never by convenience (A5).

## 3. Input and output

### 3.1 Proposed contract

```
applyAddAgent(source: string, intent: AddAgentIntent): AuthoringResult

type AuthoringResult =
  | { ok: true;  source: string }
  | { ok: false; failure: AuthoringFailure; diagnostics: readonly Diagnostic[] }
```

**In: Genome source text. Out: Genome source text.**

### 3.2 Why source in, source out

- **A4** — the source is canonical. A contract in source text cannot create a
  structured state that competes with it.
- It avoids exposing an AST as a new public contract "for convenience". The
  compiler's AST is currently an internal detail of a read-only pipeline;
  promoting it to a public authoring contract would be a far larger commitment
  than this remediation needs.
- Source-in preserves what source-out must protect: comments and formatting
  exist only in the text.

The operation is a **pure function**. It performs no I/O, reads no file, and
writes no file. Persisting the returned source is the caller's business.

### 3.3 Reusing `Diagnostic`

`Diagnostic` is already exported by `@genome/compiler`. The authoring result
carries the compiler's own diagnostics unchanged rather than re-wording them
(A2).

## 4. Diagnostics

### 4.1 Four distinguishable failures

The caller must be able to tell these apart (a Studio message for "that
department doesn't exist" differs from one for "your document doesn't parse"):

| `failure` | Meaning | Source of truth |
|---|---|---|
| `invalid-source` | the input source does not parse or does not compile | schema / compiler |
| `invalid-intent` | the intent is not well-formed (e.g. missing `id`, `autonomy` outside the enum) | authoring package |
| `conflict` | the intent is well-formed but cannot apply to *this* document (unknown department; agent id already present) | authoring package, reading the compiled document |
| `invalid-result` | the candidate document was produced but does not compile | **compiler** |

### 4.2 No second diagnostic taxonomy

`invalid-source` and `invalid-result` carry the compiler's diagnostics verbatim.
Only `invalid-intent` and `conflict` originate in the authoring package, and they
describe the *operation*, not the language.

**Cross-reference validation is never duplicated** (A2). The authoring package
does not re-derive workflow-owner resolution, policy binding, or any other
compiler-enforced semantics. It produces a candidate and asks the compiler.

### 4.3 Fail before returning success

The operation **must not** return `ok: true` with a document that does not
compile. The candidate is compiled *before* the result is returned; a failing
candidate becomes `invalid-result` and the caller receives no source. (A2)

`invalid-source` is checked first: an operation is never applied to a document
that is not already valid, so a failure can always be attributed.

## 5. Source preservation

### 5.1 Observable requirements

Stated as **behavior**, not as a library mandate (A3). Given a valid source and a
successful `add-agent`, the returned source must satisfy:

| # | Requirement |
|---|---|
| P1 | Every comment in the input is present in the output, with the same text and the same anchoring relative to surrounding content. |
| P2 | Every key not on the path to the insertion point is byte-unchanged. |
| P3 | Key ordering is preserved everywhere outside the modified mapping; within it, the new agent is appended after existing agents. |
| P4 | Indentation style, quoting style and line endings elsewhere in the document are unchanged. |
| P5 | The document's leading comment block survives — including the RFC-0008 non-normative-for-governance marking. |
| P6 | Content outside the requested edit is not reflowed, re-quoted, or re-serialized. |

### 5.2 Required fixture

`SPEC/examples/genome-project.yaml` is a **required** preservation fixture. Its
top-of-file governance disclaimer (RFC-0008 §1) must be provably intact after an
`add-agent`. A test asserting it cannot silently disappear is a condition of
acceptance.

Preservation is a **correctness property**, not a nicety: a mechanism that
silently drops that marking would change what the document asserts about itself.

### 5.3 Implementation evidence, not mandate

`yaml` v2 is already an accepted dependency of `@genome/schema` and its
document-level API preserves comments and formatting. It is cited as evidence
that §5.1 is achievable **without a new runtime dependency**. This RFC specifies
observable behavior; the implementation may use any mechanism that satisfies it.

## 6. Determinism

**Requirement:** given identical input source and identical intent, the returned
source is **byte-identical** across invocations, processes and platforms.

Byte identity is the correct contract here, and stronger than the alternatives:

- the operation is a pure function of (source, intent) — there is no clock, no
  id generation, no ordering choice left to chance;
- §5's preservation requirements already forbid incidental reformatting, so
  byte identity mostly *follows* from them;
- a weaker contract ("semantically equivalent") would permit a change that alters
  the compiled `genomeRevision`, which would surface to users as a spurious
  organizational change.

Pinned as committed fixtures in the established style (RFC-0008 E9; the ADR-0011
golden revisions). If drafting the implementation shows byte identity
unachievable under §5, that is an **open question for the Board**, not a
detail to settle silently — see OQ3.

## 7. Revision semantics

**The authoring capability never derives, assigns, computes or carries a
`genomeRevision`.** (§7 of the ratified constraints.)

It returns source. The existing compiler derives the revision from that source at
Stage 5, exactly as it does for a hand-edited document. Nothing about revision
identity, canonicalization or SHA-256 changes, and ADR-0011 is not reopened.

A caller that wants the new revision compiles the returned source.

## 8. Studio integration (minimal)

The minimum integration that clears the rejected criterion. It **uses** the
existing Checkpoint-2 lifecycle rather than bypassing it.

1. The user identifies a department from the **organization surface** (tree or
   graph) — not from the source.
2. The user chooses **Add agent**.
3. The user provides the required information (§2.2).
4. Studio invokes the accepted authoring operation.
5. On success, the returned source **replaces the editor source as an edit** —
   the same path a keystroke takes.
6. The existing compilation-state machine marks prior projections **stale**
   (Checkpoint 2 — unchanged).
7. The user **compiles** through the existing accepted flow.
8. Graph and tree update from compiler outputs (Checkpoint 3 — unchanged).

On failure, Studio renders the returned diagnostics; the source is unchanged.

**Nothing is bypassed.** No auto-compile, no hidden state, no second path into
the projections. The user sees the source change and is responsible for
compiling it — which is what made the stale/current invariant legible in the
evidence that already passed (A7).

### 8.1 Accessibility (A8)

The WCAG 2.2 AA Milestone-1 acceptance floor applies to the new interaction:
keyboard operability end to end, visible focus, accessible names for every
control, errors programmatically associated with the field or region they
concern, focus behavior defined for the success and failure paths, and recovery
from a refused operation without losing entered information.

## 9. Explicit exclusions

Not in scope, not implied, not authorized:

- `edit-agent`, `delete-agent`, `add-workflow`, `add-policy`;
- arbitrary JSON/YAML patches, generic CRUD, bulk mutation;
- an operation *language*, registry, or extension point;
- schema-driven form generation;
- drag-and-drop organizational editing;
- team-scoped agent placement (§2.3);
- creating departments, teams, or any construct other than an agent;
- file I/O, persistence, or a durable log;
- any CLI command *(see OQ4)*;
- any change to language, schema, compiler, runtime, events, revision or
  governance semantics;
- Milestone 2, the Autonomy Substrate, Office View, Marketplace, simulation.

The objective is to **prove the authoring architecture**, not to build a no-code
Genome editor.

## 10. Protected boundaries

Each a verifiable empty diff or absence:

| Boundary | Expected |
|---|---|
| `SPEC/schema/genome.schema.json` | **empty diff** |
| `SPEC/language.md` semantics | **empty diff** |
| `packages/genome-compiler/src` production | **empty diff** |
| `packages/genome-runtime/src` production | **empty diff** |
| `packages/genome-runtime/src/events` | **empty diff** |
| Revision derivation / canonicalization | **unchanged** (ADR-0011 not reopened) |
| Governance semantics | **unchanged** |
| Persistence | **absent** |
| Exported-log reader | **absent** |
| Provider adapters | **absent** |
| Trigger behavior | **absent** |

**If implementation requires crossing any of these, work stops and returns to
the Architecture Board.**

The new package and its Studio integration are additive; under RFC-0009
Amendment 2 an additive public interface that adds no business semantics to the
*view* is not a semantic change. Note the authoring package deliberately **does**
own new semantics — which is why it is a governed package with this RFC, not a
Studio convenience.

## 11. Language Complexity Budget

**Non-zero. Recorded here, not hidden inside a Studio implementation task.**

### New capability

| Dimension | Count |
|---|---|
| New semantic operation (`add-agent`) | **1** |
| New document-transformation semantics (source-preserving application) | **1** |
| New public toolchain API (the operation surface) | **1** |
| New maintained package/surface | **1** |
| New Studio product surface (the authoring interaction) | 1 |

### Unchanged

| Dimension | Count |
|---|---|
| Genome language semantics | **0** |
| New syntax | **0** |
| New Genome-language fields | **0** |
| Schema semantics | **0** |
| Compiler normative behavior | **0** |
| Runtime semantics | **0** |
| Event taxonomy | **0** |
| Revision semantics | **0** |
| Governance semantics | **0** |
| Persistence | **0** |

The budget is spent **entirely on new capability**; nothing already accepted
moves. This is why the capability requires its own RFC (Governance Rule 2) and
is **not** presentable as a zero-cost Studio enhancement.

## 12. Definition of Done

Standing governance requirement (Governance, RFC Completion Criteria):
`PROJECT_STATE.md`, `ROADMAP.md` deliverable statuses and
`IMPLEMENTATION_QUEUE.md` reflect the work at the moment it lands, and
`pnpm check-state` passes.

All evidence **uncached** (`pnpm test -- --force`).

1. `pnpm check-state`, `pnpm typecheck`, `pnpm test -- --force`, `pnpm build` —
   all green.
2. **Protected-boundary evidence** (§10) — each an explicit empty diff or
   absence.
3. **Executable evidence** — at minimum:

   | # | Case |
   |---|---|
   | E1 | add an agent to a valid department → `ok: true` |
   | E2 | the resulting source **compiles** |
   | E3 | the agent appears in `graphTarget` output |
   | E4 | the agent appears in `inspectTarget` output |
   | E5 | unrelated source and comment content preserved (§5.1 P1–P6) |
   | E6 | the RFC-0008 governance marking survives (§5.2) |
   | E7 | determinism — same source + same intent → byte-identical output (§6) |
   | E8 | a nonexistent target department is **refused** (`conflict`) |
   | E9 | a duplicate agent id is **refused**, per existing language semantics |
   | E10 | an invalid candidate is refused as `invalid-result` carrying the **compiler's** diagnostics |
   | E11 | a non-compiling input is refused as `invalid-source` before any transformation |
   | E12 | **no Studio-owned YAML transformation** — Studio's production source contains no document mutation; verified by inspection and diff |
   | E13 | authoring never derives a `genomeRevision` (§7) — verified by absence |

4. **Studio integration evidence** — the §8 sequence executed end to end,
   including that the operation's output enters through the existing edit path
   and marks projections stale.
5. **Accessibility evidence** — the §8.1 floor, including the keyboard-only
   `add-agent` journey and axe-clean states for the new interaction.
6. **Product acceptance — a recorded reviewer walkthrough** of the remediation
   scenario (§13). Not a CI gate. Items 1–5 are **necessary but not sufficient**.

## 13. Product acceptance scenario

The remediation acceptance requirement:

> A first-time user can add an agent to Engineering **without external
> instruction or prior knowledge of Genome YAML structure.**

The Product Owner must be able to:

1. recognize that the organization is editable;
2. discover **Add agent** from the organization surface;
3. provide the required information;
4. see the resulting source change;
5. understand that the organization is now stale/uncompiled;
6. compile;
7. see the new agent in the organization projections.

This remains a **human** acceptance criterion, not merely CI (RFC-0009
Amendment 4). Every §10.1 criterion that already passed must still pass.

## 14. Open questions for the Architecture Board

Only questions that must be decided before implementation.

| # | Question | Proposed |
|---|---|---|
| **OQ1** | Given that `role` and `autonomy` are **optional** in the accepted language (§2.2), should the operation require `role`? | **No.** Requiring it would make the toolchain stricter than the compiler — a semantic change by the back door. Studio's form may still ask for it. |
| **OQ2** | Agents may live under a department **or** under a team (§2.3). Which does `add-agent` target? | **Department-scoped only.** Team placement is effectively a second operation, excluded under A5. |
| **OQ3** | Is **byte identity** (§6) the right determinism contract, or should it be a weaker semantic equivalence? | **Byte identity.** A weaker contract permits changes that alter the compiled revision, surfacing as spurious organizational change. |
| **OQ4** | Should the operation be exposed as a **CLI command** in this RFC? | **No** — excluded (§9). The capability is deliberately consumer-agnostic; a CLI surface is a separate decision with its own evidence burden. Noted because it is the obvious next consumer. |
| **OQ5** | Is the package name `@genome/authoring` correct, and does the operation belong as a named function (`applyAddAgent`) or a dispatched one (`applyOperation(doc, {kind})`)? | **`@genome/authoring`; a named function.** A dispatcher implies an operation language this RFC explicitly declines to define (§2.4). A dispatcher can be introduced later *if* a second operation earns it. |
| **OQ6** | Does the Board require an **ADR** for the authoring boundary, in addition to this RFC? | **Recommended yes** — the "compiler owns source → meaning; authoring owns intent → source" split is a durable architectural property, comparable to ADR-0003. |

## 15. Boundaries this RFC unexpectedly needs to cross

**None.**

No change is required to Genome language semantics, schema semantics, compiler
normative behavior, source identity/revision semantics, runtime semantics, or
governance semantics. This RFC adds a capability; it moves nothing already
accepted.

The §2.2 finding — that the language is more permissive than the product
scenario assumes — is a **finding about existing semantics, not a request to
change them.** The proposed resolution deliberately conforms the operation to
the language rather than the reverse.

If drafting the implementation reveals any accepted boundary must move, **work
stops and returns to the Architecture Board.**

## Constitutional check

- **P2 (source of truth):** the Genome document remains the single source of
  truth. The operation returns source; it creates no competing representation
  (A4).
- **P5 (views own no business logic):** the load-bearing constraint. Studio
  names an intent and renders a result; every structural decision lives in the
  toolchain (§1.4).
- **P6 (runtime produces events):** untouched. Authoring produces source, not
  events; durable organizational change still flows through Genome revisions.
- **P9 (human governance first-class):** unchanged — and better served, since a
  human can now express an organizational change without the language acting as
  a gate on participation.
- **P10 / Charter ("define the model before the UI"):** the operation contract
  and its evidence are defined here, before any interaction is built.

## Explicitly not authorized / not done by this RFC

- **No implementation.** Not of `add-agent`, not of the package, not of the
  Studio interaction.
- **No queue item.** Nothing enters `IMPLEMENTATION_QUEUE.md` until this RFC is
  accepted and ratified.
- **No Studio production-code change.**
- **No language, schema, compiler, runtime, event-taxonomy, revision or
  governance change.**
- **No milestone closed, no deliverable marked Done, no phase closed.** Phase 4
  remains open for Milestone 1 only; the Milestone-1 acceptance remains
  **Rejected pending remediation**.
- **No second operation**, no operation language, no CLI surface.
- **No ADR recorded** — recommended by OQ6, to be written if the Board agrees and
  the RFC is accepted.
