# Architecture Board Review — RFC-0010: Semantic Authoring Operations (`add-agent`)

**Status: RATIFIED by the Product Owner, 2026-09-13 — Option B.**

Held 2026-09-13. Subject: `RFC/0010-semantic-authoring-operations.md`.
Commit under review: **`82bcf3e`** (working tree clean at review time).

Board (`docs/GOVERNANCE.md`): Product Owner, Chief Architect, Lead Engineer.

**The Board recommends; it does not decide.** §§0–27 are the review as held,
with RFC-0010 unmodified at review time. The Product Owner's decision is recorded
in **§28: RATIFIED 2026-09-13 — Option B**, accepting RFC-0010 with amendments
A1–A12 and the §23 evidence changes. No package is implemented and no Studio code
is changed by that ratification.

Every material repository claim in the RFC was **re-executed**, not trusted.
Where the RFC's claims survived, this review says so. Where they did not, §4 and
§8 say so plainly: **the draft contains one materially unachievable contract and
two boundary errors.**

---

## 0. Method

The Board re-executed against `82bcf3e`:

- the accepted schema, language spec, AST, semantics and diagnostics sources;
- eleven behavioral probes of agent semantics compiled through the real
  `compile()`;
- eight source-preservation probes against `yaml` v2.9.0 as actually resolved in
  this workspace, including the canonical self-hosting example;
- three round-trip configurations of the canonical example;
- the full health suite, uncached.

Probes were run in scratch space. **No repository code was modified.**

## 1. Is the problem correctly classified?

**Confirmed.** The Milestone-1 rejection exposed a **missing platform
capability**, not a documentation, layout, usability or form-generation problem.

| Check | Re-executed finding |
|---|---|
| Does any accepted surface write a document? | **No.** `@genome/compiler` exports `compile` plus four read-only targets; `@genome/schema` exports `parseGenomeDocument`, `createValidator`, `formatErrors`. There is no writer anywhere in the toolchain. |
| Does Studio own any language semantics today? | **No.** `apps/genome-studio/src/genome/compilation.ts` delegates wholly to the compiler and adds nothing. |
| Could a schema-derived form have solved it? | **No** — and more emphatically than the RFC states. See below. |

**The Board records a finding that strengthens the classification beyond what
the RFC claims.** `SPEC/schema/genome.schema.json` types `departments` as:

```json
{ "type": "object", "additionalProperties": { "type": "object" } }
```

The schema has **no `$defs`**, and its only required top-level properties are
`genomeVersion` and `company`. It constrains agent shape **not at all**. A
"missing schema form" was therefore never available as a diagnosis: there is no
schema structure from which to derive a form. Agent shape lives exclusively in
`packages/genome-compiler/src/ast/index.ts` and
`packages/genome-compiler/src/semantics/index.ts`.

This retroactively confirms the rejection of Option D in the remediation review
on stronger evidence than that review had.

**Classification: correct. `user intent → valid Genome source change` is a
genuine missing platform capability.**

## 2. Is toolchain ownership correct?

**Confirmed, and the Board endorses the three-way split as written:**

```
compiler:   source → meaning
authoring:  intent → source
Studio:     collect intent + present result
```

**Why not Studio.** Constitution Principle 5 / Governance Rule 5. Placement
knowledge is language structure. The Board notes that F7 of the remediation
review is now *proven* rather than asserted: a probe of `workflows.w.owner`
naming `eng.ghost` is refused by the compiler with
`'eng.ghost' does not resolve to an existing agent` — a cross-reference the
schema cannot express. Studio reimplementing placement would have to
reimplement this class of rule to stay correct, and nothing would fail when it
drifted.

**Why not the compiler.** The Board affirms the RFC's §1.3 table and adds a
decisive structural fact: the compiler's canonical path **discards** what
authoring must preserve. `compile()` calls `parseGenomeDocument` (plain
`YAML.parse`), which returns data with no comments, no formatting, no key
positions. An authoring capability hosted in the compiler would need a *second*
parse path that the compiler otherwise has no use for — i.e. it would not share
the compiler's machinery, only its package. That is ownership by filing
convenience, which the Board is directed not to accept.

**Is a new package justified, or should an existing one own it?** The Board
considered `@genome/schema` as the alternative host, since it already owns
`yaml` and parsing. **Rejected:** `@genome/schema`'s accepted role is
validation-of-what-exists; giving it document *authorship* would silently widen
the most-depended-upon package in the workspace (`@genome/compiler` depends on
it), and would place authoring *below* the compiler in the dependency graph
while it needs to call the compiler for A2 validation — a cycle.

**A new package is justified.** Not for convenience: because every existing
candidate either creates a dependency cycle (`@genome/schema`) or requires a
parse path its host does not otherwise need (`@genome/compiler`).

## 3. Is `add-agent` the correct minimum scope?

**Confirmed.** One operation, excluding `edit-agent`, `delete-agent`,
`add-workflow`, `add-policy`, team-scoped creation, generic patching, generic
CRUD, schema-driven forms and dispatch languages.

The Board's test was whether the scope is *sufficient* to clear the recorded
blocker, not merely small. It is: the rejected acceptance criterion is
explicitly "add an agent to Engineering". One operation clears it exactly.

The Board affirms that the vocabulary is a **governed surface** and records that
growth requires a decision, not a convenience argument.

## 4. Existing language semantics — re-executed

All findings below are from probes compiled through the real `compile()`, not
from reading the RFC.

| # | Probe | Result |
|---|---|---|
| S1 | agent with **neither** `role` nor `autonomy` | **compiles, ok=true, no diagnostics** |
| S2 | agent with `role` only | compiles |
| S3 | agent with `autonomy: supervised` only | compiles |
| S4 | agent with `autonomy: wizard` | **refused** — `'wizard' is not a valid autonomy level (expected one of: manual, supervised, autonomous)` |
| S5 | team-scoped agent (`departments.eng.teams.plat.agents.t1`) | **compiles** — node id `agent:eng.plat.t1` |
| S6 | duplicate agent id in the **same** mapping | **refused at parse** — `Map keys must be unique at line 10, column 7` |
| S7 | same id in a department **and** in a team beneath it | **compiles** — both valid |
| S8 | same id in **two different** departments | **compiles** — both valid |
| S9 | `workflows.w.owner: eng.ghost` (nonexistent agent) | **refused** — `does not resolve to an existing agent` |

Corroborated by source: `AgentNode` declares `role?`, `autonomy?` **and
`skills: string[]`**; `checkAutonomy` validates only when `autonomy !== undefined`;
`SPEC/language.md` states *"If `autonomy` is omitted, it defaults to `manual`…
Absence of a declared autonomy level never grants autonomy (deny-safe)."*

### 4.1 OQ1 — resolved

> **Should `add-agent` require only `department` and `id`, with `role` and
> `autonomy` optional?**

**YES. The Board resolves OQ1 as the RFC proposes, and finds no accepted
evidence for a stronger contract.**

S1 is decisive: an agent with neither field is a valid Genome agent today.
Requiring `role` in the *operation* would make the toolchain stricter than the
compiler — a semantic change introduced by the back door, and a violation of the
Board's own instruction that the operation must not become stricter than
accepted semantics.

The Board draws the distinction the instruction asks for: **requiring a role is
a product-level requirement that belongs in Studio's form, not in the semantic
operation.** Studio may mark `role` as expected, prefill it, or warn on its
absence. The operation must accept its absence.

The Board further resolves, and the RFC does **not** currently address
(**Amendment A3**): when `autonomy` is omitted it must be **omitted from the
emitted source**, not materialized as `manual`. Writing `autonomy: manual`
would convert a deny-safe *default* into a declared *value* — a change in what
the document asserts, and a silent revision difference.

### 4.2 A finding the RFC omits — `skills`

`AgentNode` carries `skills: string[]`, built by `asStringList(agent.skills)`.
RFC-0010 §2.1's intent vocabulary does not mention `skills` at all, and §9 does
not exclude it. This is an **unaddressed gap**, not an error: the RFC is silent
where it must be explicit. **Amendment A4.**

### 4.3 Duplicate-agent semantics — the RFC is wrong

RFC-0010 E9 requires: *"a duplicate agent id is refused, **per existing language
semantics**."*

**There are no such semantics.** S6 shows a duplicate key is refused by the
**YAML parser** (`Map keys must be unique`), before Genome semantics run at all.
S7 and S8 show Genome imposes no cross-scope uniqueness whatsoever.

Consequences the RFC must absorb (**Amendment A5**):

1. Duplicate refusal is an **operation-level `conflict`**, not a language rule.
   The RFC must stop attributing it to language semantics.
2. It must be a **pre-check**. If the operation appended a duplicate key and
   deferred to validation, the candidate would fail at *parse* with
   `Map keys must be unique at line N` — a diagnostic about YAML mechanics
   presented to a user who asked to add a colleague. The `conflict` path exists
   precisely to prevent that.
3. Uniqueness is scoped to the **target mapping only**. The operation must not
   refuse an id that exists in another department (S8) or in a team beneath the
   target (S7). Inventing cross-scope uniqueness would again be stricter than
   accepted semantics.

## 5. Department-only placement — OQ2 resolved

**YES — department-scoped only. The Board confirms team placement is a
genuinely distinct operation, not a parameter variant.**

S5 establishes that team-scoped agents are valid and produce a **different node
identity**: `agent:<dept>.<team>.<id>` versus `agent:<dept>.<id>`. The two
placements differ in the container that must exist, the identity produced, and
the failure modes (a team may be absent independently of its department).

Against the instruction to prefer the smallest scope capable of clearing the M1
blocker: the canonical scenario is "add an agent to **Engineering**", a
department. Team placement is not required to clear the blocker and has no
demonstrated consumer. It is excluded under A5 of the ratified constraints.

The Board notes the canonical example contains **zero teams**
(`inspectTarget` reports `"Team": 0`), so team placement is not exercisable by
the acceptance scenario in any case.

## 6. Input boundary

**Confirmed: source text is the correct public input.**

The Board evaluated each alternative:

| Candidate input | Verdict |
|---|---|
| **Genome source text** | **Correct.** Comments and formatting exist only in the text; any other input has already discarded what the output must preserve. |
| Parsed YAML document (`YAML.Document`) | **Reject.** Promotes a third-party library object to a public Genome contract, making `yaml` normative by the back door — which the Product Owner explicitly forbade. |
| Compiler AST (`GenomeAst`) | **Reject.** The AST is currently an internal detail of a read-only pipeline; promoting it to a public authoring contract is a far larger commitment than this remediation needs, and it carries no comments or formatting. |
| Schema output | **Reject.** `ValidationResult` is a verdict, not a document. |
| Graph / runtime model | **Reject.** Both are lossy projections; neither can reconstruct source. |

The Board affirms the RFC's refusal to promote an internal AST or a YAML-library
object without concrete need. **No such need was demonstrated.**

## 7. Output boundary

**Confirmed: successful authoring returns canonical Genome source text**, and
nothing else — not an AST, graph, document object, or hidden Studio state.

The Board confirms the compiler remains solely responsible for deriving
`genomeRevision`, `graphTarget`, `inspectTarget` and `runtimeModelTarget`. The
RFC's §7 is correct and the Board adds no qualification.

The operation being a **pure function with no I/O** is endorsed: persisting the
returned source is the caller's business, which keeps the persistence boundary
(RFC-0009 §11) untouched.

## 8. Source preservation — **the RFC overclaims**

This is the Board's most consequential finding. The RFC's §5.1 P1–P6 were tested
against the actual library, on the actual canonical fixture.

### 8.1 What the probes found

| Probe | Result |
|---|---|
| Canonical example: comments, governance disclaimer, unrelated sections | **PASS** |
| Comments adjacent to the target department (leading, trailing-on-key, inside, above first agent, trailing-on-value, next department) | **PASS — all six** |
| Quoted keys and values (`"0.1"`, `"Acme, Inc."`, `'single quoted'`, `"engineering":`, `"quoted-agent":`) | **PASS** |
| Unrelated sections before **and** after `departments` (+ trailing file comment) | **PASS** |
| Flow-style `agents: { … }` target | **PASS** — stays flow style |
| Department with **no** `agents` key | **PASS** — block mapping created |
| **4-space indentation** | **FAIL by default** — document re-indented to 2-space |
| **CRLF line endings** | **FAIL** — 8 CRLF in, **0** out |

### 8.2 The decisive measurement

**A pure round-trip with *no edit at all* is not byte-identical under the
default configuration.** Parsing and re-stringifying the canonical example
differs on **100 lines** — because a long `mission:` value is re-wrapped at the
default line width, displacing everything after it.

Therefore **RFC-0010 §5.1 P2, P4 and P6 are false as drafted**:

- **P2** ("every key not on the path to the insertion point is byte-unchanged") —
  contradicted by a 100-line no-edit diff.
- **P4** ("indentation style, quoting style and line endings elsewhere are
  unchanged") — contradicted for indentation and line endings.
- **P6** ("content outside the requested edit is not reflowed, re-quoted, or
  re-serialized") — the whole document *is* re-serialized; the `mission:` line
  *is* reflowed.

### 8.3 What is actually achievable

The Board established the remedy rather than only the fault:

| Configuration | Canonical round-trip |
|---|---|
| default | **not identical**, 100 differing lines |
| **`{ lineWidth: 0 }`** | **byte-identical, 0 differing lines** |
| `{ lineWidth: 0, indent: 2 }` | byte-identical |

Under `{ lineWidth: 0 }`, an actual `add-agent` on the canonical example
**adds exactly 2 lines and removes 0**, and is byte-identical across runs.

Uniform non-default indentation is recoverable via `{ indent: N }`.
**Mixed indentation is not** — a single global option cannot represent a
document indented differently at different levels; a probe confirms it
normalizes. **CRLF is not recoverable by any option** and would require explicit
detection and re-application outside the library.

### 8.4 The Board's required classification

The instruction asks the Board to distinguish three tiers, and not to impose an
impossible byte-preservation contract for aesthetics. It does so
(**Amendment A6**):

**Tier 1 — required observable preservation (normative):**

- every comment preserved, with its anchoring — including the leading block and
  the RFC-0008 governance disclaimer;
- every mapping key and scalar value present in the input present in the output,
  unchanged in value;
- key ordering preserved outside the modified mapping; the new agent appended
  within it;
- quoting style preserved;
- no semantic content added or removed beyond the requested agent;
- **on the canonical fixture specifically: the diff is exactly the added agent's
  lines** — this is achievable (§8.3) and is the strongest honest statement.

**Tier 2 — desirable implementation quality (non-normative):**

- preservation of non-default uniform indentation;
- preservation of line endings.

**Tier 3 — library-specific behavior (must NOT be normative):**

- any `yaml`-specific option, node type, or stringification setting. The RFC may
  cite `{ lineWidth: 0 }` as the configuration under which its evidence was
  obtained, but must not make it part of the contract.

The Board is explicit: **a document with CRLF endings or mixed indentation will
be normalized, and the RFC must say so** rather than promise otherwise. This is
an honest limitation, disclosed — not a defect.

## 9. Determinism — OQ3 resolved

**YES — byte-identical output is normative, and the probes confirm it is
achievable** (two runs on the canonical example produced identical bytes).

The Board stresses a distinction the RFC **conflates**: byte-*determinism* (same
input → same output) is achievable and is the right contract;
byte-*preservation* (output ≈ input outside the edit) is the overclaim in §8.
Resolving OQ3 "yes" must not be read as endorsing §5.1 as drafted.

**Input identity is, exactly (Amendment A7):**

1. the input source **bytes**, and
2. the intent's declared field values — `department`, `id`, and `role` /
   `autonomy` **including whether each is present or absent**.

Nothing else. No clock, no environment, no locale, no filesystem, no id
generation, no iteration over an unordered collection. Determinism must hold
across invocations, processes and platforms — the Node↔browser conformance
harness already establishes the precedent for platform-crossing evidence.

The Board rejects a weaker "semantically equivalent" contract: it would permit
reformatting that changes the compiled `genomeRevision`, surfacing to a user as
a spurious organizational change.

## 10. yaml v2 evidence

**Feasibility is confirmed, with two documented exceptions.** All required
fixture classes were tested (§8.1): canonical example, comments adjacent to the
target department, quoted keys/values, varied indentation, CRLF, and unrelated
sections before and after `departments`. Two additional classes were tested on
the Board's initiative (flow-style target; department with no `agents` key) and
both pass.

**Preservation claims the proposed implementation cannot satisfy, reported as
instructed:**

1. **§5.1 P4 — line endings.** CRLF input yields LF output. Not recoverable by
   library configuration.
2. **§5.1 P4 — mixed indentation.** Normalized. Not recoverable by a single
   global option.
3. **§5.1 P2 / P6 — untouched regions byte-unchanged / not re-serialized.**
   False under the default configuration (100-line no-edit diff); **true under
   `{ lineWidth: 0 }`**, which the RFC does not mention.

This is **evidence of feasibility, not authorization to make `yaml` v2
normative.** The Board affirms: the contract is stated as observable behavior;
the library remains an implementation choice, replaceable by anything meeting
Tier 1.

## 11. Diagnostics model — **a boundary error**

The four failure classes (`invalid-source`, `invalid-intent`, `conflict`,
`invalid-result`) are **correct and sufficient**, and the Board endorses them.

**But the RFC's result type crosses a protected boundary.** §3.1 declares:

```
{ ok: false; failure: AuthoringFailure; diagnostics: readonly Diagnostic[] }
```

for **all four** classes. Re-executed against source:

```ts
export type CompileStage = "parse" | "schema" | "semantic";
export type Diagnostic = { stage: CompileStage; severity?: …; rule?: number; path: string; message: string };
```

`stage` is **required** and its union is **closed**. An authoring-originated
failure (`invalid-intent`, `conflict`) is not a parse, schema, or semantic
stage. Emitting one as a `Diagnostic` would require widening `CompileStage` —
**a production diff under `packages/genome-compiler/src`, which RFC-0010 §10
lists as an expected empty diff.** The RFC's own protected boundary forbids the
representation its own contract implies.

**Amendment A8** resolves this, and doing so *improves* the design:

- `invalid-source` and `invalid-result` carry the compiler's `Diagnostic[]`
  **verbatim** — the compiler and schema remain authoritative for Genome
  validity, and no diagnostic is re-worded.
- `invalid-intent` and `conflict` carry an **authoring-owned** failure
  description that is **not** a `Diagnostic`. This is not a second Genome
  diagnostic taxonomy: these failures describe *the operation*
  ("no department `engineering`"; "agent `dev` already exists there"), never the
  language.

**Should `invalid-result` expose compiler diagnostics verbatim?** **Yes** — and
the Board makes it normative. `invalid-result` means the toolchain produced a
document the compiler rejects; anything other than the compiler's own words
would obscure a toolchain bug. The Board notes this class should be rare to the
point of indicating a defect, and its diagnostics are the debugging surface.

**Cross-reference validation is not duplicated** — confirmed. Nothing in the
proposed design re-derives S9's owner-resolution rule.

## 12. Failure atomicity

**Pinned (Amendment A9): on any failure the operation returns diagnostics and/or
an authoring failure description — and NO source field at all.**

Not the original source, not the candidate. The Board's reasoning follows the
instruction to prefer the smallest contract that prevents a caller from treating
an invalid mutation as success:

- returning the **candidate** invites exactly the accident to be prevented — a
  caller that ignores `ok` gets a plausible-looking document that does not
  compile;
- returning the **original** is redundant (the caller passed it in) and equally
  invites `result.source` being used without checking `ok`;
- **omitting the field entirely** makes misuse a *type error* rather than a
  runtime surprise, since `source` exists only on the `ok: true` branch of the
  discriminated union.

The RFC's §3.1 already has this shape. The Board makes it **explicit and
normative** rather than incidental, and adds: the operation must never mutate
its input.

## 13. Duplicate agent behavior

Resolved in §4.3. **Amendment A5.** The Board re-states the rule it is imposing,
since the instruction warns against inventing uniqueness:

> The operation refuses **only** when the target department's `agents` mapping
> already contains the requested id. It must **not** refuse an id present in
> another department, in a team, or anywhere else.

This refusal derives from the **placement semantics of the operation** (YAML
mappings cannot carry duplicate keys — S6), not from an invented Genome
uniqueness rule. S7 and S8 prove Genome has none.

## 14. Revision semantics

**Confirmed, without qualification.** `@genome/authoring` must never derive,
predict, preserve, or supply `genomeRevision`. The returned source is compiled
normally; the compiler derives the revision at Stage 5 as it does for a
hand-edited document.

ADR-0011 and compiler ownership of revision identity are untouched. The Board
confirms RFC-0010 §7 and §10 are correct here and require no amendment.

The Board adds one observation supporting the §9 determinism contract: because
revision derives from the schema-valid document, any nondeterministic
reformatting would produce a different revision for the same intent. Determinism
is therefore not a cosmetic property — it protects revision identity.

## 15. Principle 5

**Confirmed: the proposed boundary fixes the acceptance problem while preserving
the view rule.** The Board affirms both lists as normative.

Studio **may**: display Add agent; collect intent; invoke the operation; place
returned source into its existing editor/source lifecycle; show returned
operation and compiler diagnostics.

Studio **must not**: know YAML placement rules; build YAML fragments; validate
Genome agent semantics independently; update graph/tree directly after mutation.

The Board notes the fourth prohibition is the subtlest and the easiest to
violate accidentally — an "optimization" that refreshes projections from the
operation's result rather than from a compile would reintroduce exactly the
second-implementation problem. **E12 must test for it** (§23).

## 16. Studio integration — the Board amends the RFC

RFC-0010 §8 step 7 requires the user to **compile** through the existing flow.
The Board was asked to determine whether explicit compile should remain required
or whether existing accepted auto-compile/debounce behavior already governs.

**Re-executed finding:** Studio already has accepted debounced auto-compile —
`DEFAULT_AUTO_COMPILE_DELAY_MS = 400` in `apps/genome-studio/src/app.tsx`, with
`Compile now` as the explicit escape hatch. The Checkpoint-2 state machine
marks projections stale on edit and clears on compile.

**Resolution (Amendment A10): the operation's output enters as an ordinary edit,
and the existing accepted lifecycle governs from there — whatever it does.** The
RFC must not require an explicit compile, because requiring one would create a
special authoring-only path: an edit that behaves differently from every other
edit. That is precisely what the instruction forbids.

The Board is deliberate about the consequence: under current accepted behavior
the projections will auto-compile ~400 ms after the operation returns. The
stale→current transition still occurs and is still observable; it is simply
governed by the same machinery as typing. If the Product Owner wants the stale
state to persist until an explicit compile, that is a **change to the accepted
Checkpoint-2 lifecycle for all edits** and belongs in its own decision, not
smuggled in through this RFC.

The acceptance scenario's step "understand that projections are now stale" (§24)
remains satisfiable: the stale marking appears on the edit regardless of what
clears it.

## 17. Canonical source visibility

**Confirmed and made normative (Amendment A11).** The user must be able to
inspect the source produced by `add-agent`. The operation's output enters the
visible editor; it is never applied invisibly.

The Board attaches weight to this beyond the RFC's: the passing Milestone-1
evidence includes the user's ability to trace a required principal back to the
line in the document that produced it (acceptance record §5, criterion 4).
An authoring surface that concealed the source would break a criterion that
**already passed**. Visibility is not a courtesy — it protects accepted
evidence.

## 18. Accessibility

**Confirmed.** The existing Milestone-1 WCAG 2.2 AA acceptance floor
(`IMPLEMENTATION_QUEUE.md`) applies to: Add agent discoverability; target
department context; field labels; validation and failure messages; keyboard
completion; cancel/recovery; and focus after a successful source mutation.

The Board explicitly **declines to expand** this RFC into a general Studio
accessibility redesign. The existing hardening (Checkpoint 6) stands as accepted.

One addition (**Amendment A12**): focus behavior must be defined for **both**
the success and failure paths. Checkpoint 6 already establishes the pattern —
focus recovery when a control disappears — and an authoring dialog that closes
on success while leaving focus nowhere would regress an accepted property.

## 19. CLI exposure — OQ4 resolved

**NO. No CLI command in this RFC.** The Board applies the stated default and
finds no concrete second consumer today: Phase 6 self-improvement is a *named
future* consumer, not a present one, and it would consume the package API
directly rather than a CLI.

Adding a CLI now would make the API feel complete at the cost of a surface with
its own exit codes, output contracts and evidence burden — none of which clears
the M1 blocker. Excluded, and recorded as the obvious next consumer when one
actually exists.

## 20. Public API shape — OQ5 resolved

**Option A — a named operation, `applyAddAgent(source, intent)`.**

The Board considered all three and states the reasoning the instruction asks
for explicitly:

| Shape | Assessment |
|---|---|
| **A. `applyAddAgent(...)`** | **Recommended.** Honest about its scope: one operation, one function. Adding a second operation later is an additive export, not a redesign. |
| B. `applyOperation({ kind: "add-agent", … })` | **Rejected.** A dispatcher **is** an operation language — it defines a `kind` space, a dispatch contract, and an implicit promise of extensibility, all on the strength of a single operation. It would also make every future operation feel like a mere parameter addition rather than a governed decision, eroding the A5 constraint the Product Owner ratified. |
| C. another minimal shape | Considered: a builder/fluent form. Rejected as more surface than A for no gain. |

The Board answers the question it was asked to consider directly: **yes, a
generic dispatcher would prematurely create an operation language with only one
operation.** A dispatcher can be introduced later *if and when* a second
operation earns it — and that introduction should itself be a decision.

## 21. ADR requirement — OQ6 resolved

**YES. Acceptance should create an ADR.**

The split is a durable architectural property of the platform, independent of
`add-agent`, Studio, and Milestone 1 — directly comparable to ADR-0003
(compiler package boundary). RFC-0010 will be closed one day; the property must
outlive it.

**What belongs in the ADR** (the durable property):

- `source → meaning` is owned by the compiler; `intent → source` is owned by
  authoring; views own neither;
- authoring never derives revision identity;
- the compiler remains authoritative for Genome validity — authoring proposes,
  the compiler judges;
- the canonical artifact is always Genome source.

**What stays in the RFC** (this milestone's specifics): the `add-agent` intent
vocabulary, the four failure classes, the preservation tiers, the determinism
contract, Studio integration, E1–E15, and the acceptance scenario.

**Numbering: `docs/adr/0012-semantic-authoring-boundary.md`** (ADR-0011 is the
highest in use). Created **on acceptance**, not now.

## 22. Language Complexity Budget — quantified

The Board re-executed the budget rather than accepting the RFC's table.

### New cost — confirmed, and bounded to five items

| Dimension | Count | Verified |
|---|---|---|
| New semantic operation (`add-agent`) | **1** | scope confirmed §3 |
| New document-transformation contract | **1** | §8 tiers |
| New public toolchain surface | **1** | §20, named function |
| New maintained package | **1** | §2, justified not convenient |
| New Studio authoring interaction | **1** | §16 |

### Unchanged — verified zero, each against source

| Dimension | Claimed | Board verification |
|---|---|---|
| Genome syntax | 0 | **0** — no new syntax; output is ordinary Genome |
| Genome language semantics | 0 | **0** — §4.1/§4.3 *conform the operation to the language*; the two places the draft would have diverged (requiring `role`; inventing uniqueness) are corrected by A3/A5 |
| Schema semantics | 0 | **0** — `SPEC/schema/genome.schema.json` untouched |
| Compiler semantics | 0 | **0 — but only after A8.** As drafted, the `Diagnostic.stage` closed union would have forced a compiler production diff (§11). **This dimension was not actually zero in the draft.** |
| Runtime | 0 | **0** — no contact |
| Events | 0 | **0** — authoring emits no events |
| Revision | 0 | **0** — §14 |
| Governance | 0 | **0** — the operation governs nothing; RFC-0008 classification preserved |
| Persistence | 0 | **0** — pure function, no I/O |

### Governance consequence of the one non-zero finding

The instruction directs the Board to identify the governance consequence if any
claimed-zero dimension is not actually zero. **One was not: compiler semantics.**

The consequence is **not** an escalation. A8 removes the need for the compiler
change entirely by keeping authoring failures out of the `Diagnostic` type. With
A8 applied, compiler semantics return to a genuine zero and no additional
governance act is required. **Without A8, RFC-0010 could not be implemented
without breaching its own §10 protected boundary** — which is why A8 is a
condition of acceptance rather than a refinement.

**Budget result: NON-ZERO on five capability dimensions, ZERO on all nine
accepted-semantics dimensions (compiler conditional on A8). An RFC is required
and this is it.**

## 23. Definition of Done — E1–E13 reviewed individually

| # | Case | Board assessment |
|---|---|---|
| E1 | add agent to a valid department → `ok: true` | **Keep.** |
| E2 | resulting source compiles | **Keep.** |
| E3 | agent appears in `graphTarget` | **Keep.** Verified shape: `agent:<dept>.<id>`. |
| E4 | agent appears in `inspectTarget` "where applicable" | **Keep, strengthen.** Re-executed: `inspectTarget` returns `departments[].agents[]` and `counts.Agent`. It **is** applicable; drop the hedge. |
| E5 | unrelated source and comment content preserved | **Keep, restate against §8.4 Tier 1** — P1–P6 as drafted are not all achievable. |
| E6 | RFC-0008 governance marking survives | **Keep.** Probed: passes. |
| E7 | determinism — byte-identical output | **Keep.** Probed: passes. Input identity per A7. |
| E8 | nonexistent department refused (`conflict`) | **Keep.** |
| E9 | duplicate id refused "per existing language semantics" | **Keep the case, fix the rationale** — there are no such semantics (§4.3). Must also assert the operation does **not** refuse S7/S8 shapes. |
| E10 | `invalid-result` carries the compiler's diagnostics | **Keep.** Made normative (§11). |
| E11 | non-compiling input refused as `invalid-source` before transformation | **Keep.** |
| E12 | no Studio-owned YAML transformation | **Keep, strengthen** — must also assert Studio does not refresh projections from the operation result (§15). |
| E13 | authoring never derives `genomeRevision` | **Keep.** |

### Cases the Board adds to protect the architectural boundary

| # | New case | Why |
|---|---|---|
| **E14** | `role` and `autonomy` **each omitted** → `ok: true`, and the emitted source contains **no** `autonomy` key | Protects §4.1/A3. Without it, nothing prevents the operation drifting stricter than the language or materializing a deny-safe default. |
| **E15** | Adding an id that exists **in another department** (S8) and **in a team beneath the target** (S7) both **succeed** | Protects §4.3/A5 against invented uniqueness. A test that only asserts refusal cannot catch over-refusal. |
| **E16** | The operation does not mutate its input source (the caller's string is unchanged) | Protects §12/A9 purity. |
| **E17** | A department whose `agents` key is **absent** → the key is created and the result compiles | Probed and passing; an obvious regression surface left untested by E1–E13. |

## 24. Product acceptance

**Confirmed: the remediation acceptance criterion remains human-reviewed**, per
RFC-0009 Amendment 4. Automated tests are **necessary but not sufficient**.

The Board affirms the seven-step criterion verbatim, and notes step 5
("understand that projections are now stale") survives Amendment A10: the stale
marking appears on the edit, whatever subsequently clears it.

The Board adds that **every §10.1 criterion that already passed must still
pass** — the remediation may not trade accepted evidence for new capability.

## 25. Existing M1 evidence

**Confirmed: Checkpoints 1–7 are preserved.** No redesign of the graph, tree,
compilation-state model, runtime session, governed execution, event stream,
approval flow, or accessibility hardening is authorized.

The Board records the **only** integration change the remediation requires: a
new entry point that produces an edit, plus the interaction that collects the
intent. Everything downstream of "the editor source changed" is existing
accepted machinery and must remain so. A10 exists precisely to keep it that way.

Re-executed: health is green at `82bcf3e` — `check-state` consistent, typecheck
7/7, **254 tests passing uncached across 7 packages** (studio 110, compiler 60,
CLI 44, runtime 18, browser-conformance 11, adapter 7, schema 4), 0 cached.

## 26. Governance lifecycle if accepted

1. Board recommends *(this document)*;
2. **Product Owner ratifies** — the pending act;
3. RFC-0010 becomes **Accepted**, amendments applied to the RFC text;
4. **ADR-0012** created (§21);
5. **one** implementation item enters `IMPLEMENTATION_QUEUE.md`;
6. `@genome/authoring` implemented to the amended Definition of Done;
7. Studio M1 remediation integrated (A10, A11, A12);
8. **product acceptance repeated** — a fresh recorded walkthrough;
9. only then may Milestone 1 proceed to implementation close review.

Nothing enters the queue before step 5. Milestone 1 remains **In Progress**, its
acceptance remains **Rejected**, and Phase 4 remains **open for Milestone 1
only**, throughout.

## 27. Amendments required before acceptance

Twelve. Listed, **not applied**.

| # | Amendment |
|---|---|
| **A1** | Correct §1 to record that `SPEC/schema/genome.schema.json` constrains agent shape **not at all** (`departments` is `object → object`, no `$defs`), so agent structure lives solely in the compiler's AST and semantics. |
| **A2** | State why `@genome/schema` was rejected as host: it would create a dependency cycle, since authoring must call the compiler for A2 validation while the compiler depends on `@genome/schema`. |
| **A3** | Pin OQ1 as resolved: require **only** `department` and `id`. Additionally require that an omitted `autonomy` is **omitted from the emitted source**, never materialized as `manual`. Record that requiring `role` is a Studio product decision, not an operation rule. |
| **A4** | Address `skills` (present on `AgentNode`): either include it in the intent vocabulary or **explicitly exclude** it in §9. Silence is not acceptable. |
| **A5** | Correct the duplicate-agent rationale: refusal is an **operation-level `conflict`** and a **pre-check**, not "existing language semantics" — Genome has none (S6/S7/S8). Scope uniqueness to the **target mapping only**; forbid refusing ids present elsewhere. |
| **A6** | Replace §5.1 P1–P6 with the three-tier classification of §8.4. P2, P4 and P6 as drafted are **false** against the real library. Disclose that CRLF and mixed indentation are normalized. |
| **A7** | Define determinism's **input identity** exactly: input source bytes + the intent's field values including presence/absence. Separate byte-*determinism* (normative, achievable) from byte-*preservation* (the §5.1 overclaim). |
| **A8** | **Required for the protected boundary.** `invalid-intent` and `conflict` must **not** be typed as compiler `Diagnostic` — `CompileStage` is a closed union and widening it is a compiler production diff forbidden by §10. Only `invalid-source` and `invalid-result` carry `Diagnostic[]`, verbatim. |
| **A9** | Make failure atomicity explicit: on failure **no `source` field is returned at all** — neither original nor candidate — and the input is never mutated. |
| **A10** | Correct §8 step 7: the operation's output enters as an **ordinary edit** and the existing accepted lifecycle (including 400 ms debounced auto-compile) governs. Do **not** mandate an explicit compile; that would create an authoring-only path. |
| **A11** | Make canonical source visibility normative, noting it protects the already-passing traceability criterion of the Milestone-1 acceptance record. |
| **A12** | Require focus behavior to be defined for **both** success and failure paths of the authoring interaction, consistent with Checkpoint 6. |

Additionally, fold in the evidence changes of §23: strengthen **E4**, restate
**E5** against Tier 1, fix **E9**'s rationale and add its non-refusal half,
strengthen **E12**, and add **E14–E17**.

---

## Options

### Option A — Accept RFC-0010 as drafted

**Consequence.** RFC-0010 becomes Accepted unchanged; ADR-0012 is created; one
implementation item enters the queue.

**Exact amendments.** None.

**Architectural-boundary effect.** **Negative and immediate.** §11 shows the
drafted result type cannot be implemented without widening `CompileStage`, a
production diff under `packages/genome-compiler/src` that the RFC's own §10
lists as an expected empty diff. Implementation would hit a protected-boundary
stop condition in its first week and return to this Board. Separately, §5.1's
preservation contract is **false** against the real library — including under a
no-edit round trip.

**Implementation-queue effect.** One item enters, scoped to a specification that
cannot be satisfied as written.

**Main risk.** The Board ratifies a contract it has just measured to be
unachievable. Either the implementer silently weakens it — putting the RFC and
the code permanently out of agreement — or the work stops and returns, having
spent a ratification cycle to learn what this review already established.

**Product Owner ratification statement.**
> I ratify RFC-0010 as drafted, with no amendments. RFC-0010 is Accepted;
> ADR-0012 is created; one implementation item enters `IMPLEMENTATION_QUEUE.md`.

---

### Option B — Accept RFC-0010 with amendments *(Board recommendation)*

**Consequence.** RFC-0010 is Accepted **subject to amendments A1–A12** and the
§23 evidence changes being applied to its text before any implementation intake.
ADR-0012 is created recording the durable `source → meaning` / `intent → source`
split. One implementation item then enters the queue. The architecture, the
operation, the boundaries, and every open question are settled.

**Exact amendments.** A1–A12 as listed in §27, plus §23: strengthen E4, restate
E5 against the §8.4 Tier 1 contract, fix E9's rationale and add its non-refusal
half, strengthen E12, and add E14–E17.

**Architectural-boundary effect.** **Strongly positive.** A8 keeps the compiler
boundary genuinely empty — the one dimension the draft's budget claimed as zero
but was not. A6/A7 replace an unachievable contract with one measured to be
achievable on the canonical fixture. A10 prevents an authoring-only compile path.
A3/A5 stop the toolchain drifting stricter than the accepted language. The
three-way ownership split is preserved intact and recorded durably in an ADR.

**Implementation-queue effect.** Exactly **one** item, after the amendments are
applied to the RFC and ADR-0012 exists. Nothing before.

**Main risk.** Twelve amendments is a substantial edit, and applying them is
itself work that can introduce drift between the RFC and the Board's intent. The
Board mitigates this by stating each amendment as a specific, checkable change
rather than a direction. A secondary risk: A10 means the stale state is cleared
by auto-compile, which the Product Owner may dislike — the Board has recorded
that changing it is a separate decision about the accepted Checkpoint-2
lifecycle, not a matter for this RFC.

**Product Owner ratification statement.**
> I ratify the Board's recommendation on RFC-0010: **Accept with amendments
> A1–A12** and the §23 evidence changes. RFC-0010 becomes Accepted once those
> amendments are applied to its text. `docs/adr/0012-semantic-authoring-boundary.md`
> is created recording the `source → meaning` / `intent → source` split. Exactly
> one implementation item then enters `IMPLEMENTATION_QUEUE.md`. Milestone 1
> remains In Progress, its acceptance remains Rejected, and Phase 4 remains open
> for Milestone 1 only.

---

### Option C — Return RFC-0010 for revision

**Consequence.** RFC-0010 remains **Draft**. It is revised and returns for a
second full Board review before any acceptance.

**Exact amendments.** The same A1–A12 and §23 changes, but applied **before**
acceptance rather than as conditions of it — with a further review cycle added.

**Architectural-boundary effect.** Neutral. The same boundaries end up in the
same place; only the timing differs.

**Implementation-queue effect.** **Nothing enters the queue.** The M1
discoverability blocker stays open for at least one additional governance cycle.

**Main risk.** Cost without benefit. The Board has already resolved all six open
questions, measured the library, and specified every amendment as a checkable
change. A second review would re-derive conclusions this one has recorded, while
Milestone 1 remains rejected. The Board would recommend C only if it believed an
amendment required judgement it could not supply — and it does not: the hardest
questions (§8 preservation, §11 diagnostics) were settled by measurement, not
opinion.

**Product Owner ratification statement.**
> I return RFC-0010 for revision. It remains Draft. The amendments in §27 and the
> §23 evidence changes are to be applied and the RFC resubmitted for a second
> Architecture Board review. No implementation item enters
> `IMPLEMENTATION_QUEUE.md`.

---

**Board recommendation: Option B — Accept with amendments A1–A12 and the §23
evidence changes.**

---

## 28. Product Owner disposition — RATIFIED

**Product Owner disposition: RATIFIED — 2026-09-13 — Option B (Accept RFC-0010
with amendments).**

| Field | Value |
|---|---|
| Disposition | **Option B — Accept with amendments** |
| Amendments | **A1–A12 and the §23 evidence changes, applied exactly as recorded** |
| Date | 2026-09-13 |
| RFC-0010 | **Accepted** once the amendments are applied to its text |
| ADR | **ADR-0012 — Semantic Authoring Boundary**, created |
| Queue | **exactly one** implementation item |

### 28.1 Explicit acceptance of A10

The Product Owner explicitly accepts the Board's resolution of A10:

> An `add-agent` result enters Studio through the existing **ordinary
> source-edit lifecycle**. RFC-0010 must not create an authoring-specific
> compile lifecycle.

Therefore:

- the returned source becomes the editor source;
- the existing Checkpoint-2 source state machinery applies;
- the existing accepted **400 ms auto-compile** behavior may compile it
  normally;
- the authoring operation must **not** introduce a special explicit-compile
  gate;
- Studio must **not** update graph/tree directly;
- projections change **only** after the existing compiler pipeline produces new
  accepted outputs.

**This preserves one lifecycle for all source edits.**

### 28.2 Decisions the accepted contract must carry

**Existing schema/language facts.** `role` optional; `autonomy` optional; an
omitted `autonomy` **remains omitted** and is never materialized as `manual`;
`skills` exists in the accepted agent shape and must be **explicitly addressed**
rather than silently ignored; `add-agent` is **department-scoped only**;
team-scoped placement is excluded as a distinct future operation.

**The semantic authoring operation must not become stricter than accepted Genome
language semantics.** Studio may ask for optional information for usability;
that is not a semantic requirement of `@genome/authoring`.

**Ownership.** The dedicated toolchain package `@genome/authoring` is accepted.
The durable split: compiler `source → meaning`; authoring `intent → source`;
Studio collects intent and presents the resulting source. Semantic authoring is
**not** placed in Studio, in `@genome/schema`, or in compiler targets.

**Public operation.** One named operation only — conceptually
`applyAddAgent(source, intent)`. **No** generic operation dispatcher and **no**
authoring operation language.

**Intent.** Minimum semantic intent: target department and agent id. Optional
accepted fields may include `role`, `autonomy` and `skills` — **only** where
they already exist in accepted Genome semantics. **No new Genome fields.**

**Duplicate behavior.** Genome does not currently define a general agent-id
uniqueness semantic. The operation refuses a duplicate mapping key in the
**specific target mapping**, as an operation-level conflict, **before** producing
invalid YAML. This is **not** generalized to cross-department or cross-team
uniqueness; existing accepted documents carrying the same local agent id in
different scopes remain valid wherever the current compiler accepts them.

**Source preservation.** The false all-or-nothing contract is replaced by the
Board's **three-tier model**: (1) required preservation, (2) desirable
preservation, (3) non-normative / disclosed normalization — the latter naming
CRLF normalization, mixed/custom indentation normalization, and any other
formatting empirically shown not to round-trip. **No byte-preservation claim may
be made for properties empirical testing disproved.** The implementation must not
perform unnecessary whole-document rewriting. The `yaml` v2 configuration used as
feasibility evidence, `lineWidth: 0` included, remains **implementation evidence,
not a normative dependency**.

**Determinism.** Pinned **separately** from preservation: same exact source bytes
plus same exact `add-agent` intent yields byte-identical resulting source, with
identical intent defined precisely. Deterministic output and byte preservation of
untouched formatting are **separate properties** and must not be conflated.

**Diagnostics (A8).** The compiler `Diagnostic.stage` union is **not** widened
and compiler diagnostics are **not** modified to host authoring failures.
`@genome/authoring` may define its own narrowly scoped operation-failure
representation for `invalid-intent` and `conflict`. Compiler diagnostics remain
**verbatim and authoritative** for invalid source and invalid resulting Genome
source. No competing Genome diagnostic taxonomy. Compiler semantics and
diagnostic contracts remain unchanged.

**Failure atomicity (A9).** Failure results contain **no successful mutated
`source`**. A caller must not be able to accidentally consume an invalid
candidate as success. On failure: failure classification, relevant operation
information, and compiler diagnostics where applicable — but no
successful-source field.

**Revision ownership.** Authoring never computes, predicts, stores, preserves as
metadata, or supplies `genomeRevision`. After mutation the normal compiler
derives the revision from the resulting source. **ADR-0011 remains unchanged.**

**Source visibility (A11).** The resulting source remains immediately
inspectable in Studio. Visual authoring does not hide the durable Genome
artifact.

**Accessibility (A12).** Both success and failure paths satisfy the existing
Milestone-1 WCAG 2.2 AA acceptance floor, with predictable focus behavior for
opening Add agent, validation errors, operation conflicts, successful mutation,
and cancel.

### 28.3 Evidence amendments

The strengthened **E4/E5/E9/E12** and the added **E14–E17** are applied exactly
as recorded in §23. The Definition of Done must mechanically prove the accepted
architecture, including: no compiler `Diagnostic` contract expansion; no
Studio-owned YAML mutation; no revision derivation in authoring; and **no
authoring-specific compile path**. `SPEC/examples/genome-project.yaml` remains a
**required** preservation fixture.

### 28.4 What this ratification authorizes

- RFC-0010 becomes **Accepted** with the amendments applied.
- **ADR-0012 — Semantic Authoring Boundary** is created.
- **Exactly one** implementation item enters `IMPLEMENTATION_QUEUE.md`, covering
  `@genome/authoring` (`add-agent` only), RFC-0010 evidence, and the minimal
  Studio integration required to repeat Milestone-1 product acceptance.

### 28.5 What it does not authorize

- **No implementation in the acceptance commit.**
- No Phase 4 roadmap deliverable moves to **Done**.
- No change to accepted language, schema, compiler, runtime, event, revision or
  governance semantics.
- Milestone 1 remains **In Progress**; the prior product acceptance remains
  **Rejected pending remediation**; Phase 4 remains **open for Milestone 1
  only**.
