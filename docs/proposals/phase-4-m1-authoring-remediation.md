# Proposal: Milestone-1 Authoring Remediation

**Status: Draft — prepared for Architecture Board review. Not ratified.**

Prepared 2026-09-13 by the Lead Engineer, in response to the Product Owner's
rejection of Phase 4 Milestone 1 product acceptance
(`docs/reviews/phase-4-m1-product-acceptance.md` §12).

This proposal **commissions nothing, opens no milestone, adds no queue item, and
authorizes no implementation.** It exists to give the Board a decision to make.

---

## 1. The acceptance failure

Product Owner acceptance was performed 2026-09-13 and **rejected**. The
rejection is narrow and its boundaries matter.

**Primary blocker:**

> Milestone 1 successfully demonstrates organization projection, compilation,
> and governed execution, but fails Governed Authoring product acceptance
> because a user cannot discover or perform the canonical organizational change
> ("add an agent") without understanding and manually editing the Genome source
> structure.

**Secondary observation:**

> The primary visible actions are Run workflow and Compile now, causing Studio
> to communicate execution and compilation more strongly than organizational
> authoring.

**What passed and is preserved:** organization projection, compiler feedback,
stale/current behavior, governed execution, deny-safe parking, policy and
principal visibility, explicit grant, attributed completion, ephemeral session
behavior, and the accessibility/error-recovery evidence.

**What is blocking:** authoring discoverability, and the inability to perform
the canonical "add an agent" task without external knowledge of the Genome
source structure.

The vertical slice did not fail as a whole. Neither the compiler/runtime
architecture nor the technical implementation of Checkpoints 1–7 is rejected.

## 2. Root-cause analysis

### 2.1 This is not a documentation problem

The tempting reading — "add a help panel" — is wrong, and the Product Owner
explicitly ruled it out. A user who reads documentation and then hand-edits YAML
has still not been given an authoring capability; they have been given
instructions for operating a text editor. The acceptance criterion is that a
first-time user can *make an organizational change*, not that they can be
taught the file format.

### 2.2 This is not a Studio layout problem either

Re-ordering panels or renaming buttons would address the *secondary*
observation while leaving the primary blocker untouched. Even with a perfectly
signposted editor, the user must still know that an agent is a keyed entry under
`departments.<id>.agents.<id>` carrying `role` and `autonomy`. That knowledge is
Genome language structure. No amount of UI arrangement supplies it.

### 2.3 The actual gap is a missing direction in the architecture

Genome has strong, accepted surfaces in **one** direction:

```
Genome source → schema validation → compiler → projections / runtime model → governed execution
```

Every layer in that chain has an owner, a contract, and evidence.

The inverse direction has **no accepted surface at all**:

```
user organizational intent → valid Genome document change
```

Milestone 1 was scoped as "Governed **Authoring**", but RFC-0009 §8 enumerates a
*document editor* as deliverable 1 and defines Studio as a
projection/interaction layer (§3). Nothing in the accepted architecture owns the
transformation from intent to source. Studio was therefore correct to refuse to
invent one — and the product consequently cannot author.

**The failure is architectural, not a defect.** Checkpoints 1–7 correctly
implemented what was accepted. What was accepted was incomplete with respect to
its own product outcome.

### 2.4 Why this was not caught earlier

RFC-0009 §10.1 criterion 2 ("an edit causes an understandable Organization Graph
update") is satisfiable by *any* edit mechanism, including typing YAML. The
executable evidence in `acceptance.test.tsx` performs the edit programmatically,
so it passes while saying nothing about whether a human could have originated
it. The criterion measured the *consequence* of an edit, never its *origin*.
That is the gap the human walkthrough found, which is precisely why Amendment 4
required one.

## 3. The architectural question

> **How should Genome support semantic organizational authoring without making
> Studio a second implementation of the Genome language?**

The goal is **not** to hide YAML. The goal is for Genome to have a coherent,
owned answer to: *how is an organization changed?*

The boundary to hold:

**Good**

```
user intent → Studio interaction → accepted semantic authoring capability → Genome source → compiler
```

**Risky**

```
user intent → Studio JavaScript that knows Genome YAML structure → rewritten YAML → compiler
```

The difference is ownership, not ergonomics. In the first, exactly one component
knows what an agent is and where it lives. In the second, two do — and they will
drift, because only one of them has tests that fail when the language changes.

## 4. Alternatives evaluated

### Option A — Source-navigation assistance only

Studio remains fundamentally a source editor. "Add agent" does not mutate the
document; it focuses the relevant source location and shows schema-derived
guidance. The user still types.

| | |
|---|---|
| **Ownership** | Clean. Studio owns navigation only; no semantics leave the compiler/schema. |
| **Language Complexity Budget** | Plausibly **zero** — it consumes `loadDefaultSchema()`, already public. |
| **Cost** | Lowest. Weeks, not months. |
| **Risk** | Low technical risk. |

**Does it satisfy the failed criterion?** **No.** The recorded blocker is that
the user cannot perform the change *without understanding and manually editing
the Genome source structure*. Option A improves discovery of **where** to type
and **what** is valid, but the user still authors by hand-editing structure.
It makes manual YAML editing easier; it does not make the product author. It
also leaves the first-time user's "I don't know what I'm doing in Studio"
largely intact, because the answer remains "edit this file correctly".

**Verdict:** insufficient as the remediation. Valuable as a *component* of one —
its schema-derived explanation is exactly what should accompany a real authoring
operation, and it directly serves the secondary observation.

### Option B — Studio-owned document mutation

Studio implements `addAgent(...)`, `addWorkflow(...)`, `addPolicy(...)` and
rewrites the Genome source itself.

| | |
|---|---|
| **Ownership** | **Violates** Constitution Principle 5 / Governance Rule 5 (views own no domain logic) and RFC-0009 §3. |
| **Language Complexity Budget** | Nominally zero — which is exactly the trap: the language cost is real but hidden inside an app. |
| **Cost** | Lowest to implement. |
| **Risk** | **Highest.** |

**Major risks:**

1. **Semantic duplication.** Studio would encode placement rules, required
   fields, defaulting and cross-reference rules that the compiler and schema
   already own. Two implementations, one set of tests.
2. **Silent drift.** A schema or language change would not fail any Studio test
   that asserts *structure*; it would fail later, in a user's document.
3. **Source preservation.** Naive round-tripping destroys comments, key order
   and formatting. The canonical example opens with a governance-critical
   non-normative marking (RFC-0008 §1) that a careless rewrite would drop.
4. **Precedent.** Once the view mutates documents, "views own no business logic"
   is no longer true, and every future surface inherits the exception.

**Verdict: reject.** It is the easiest option and that is not a reason. This is
the specific failure mode the architectural question was written to prevent.

### Option C — Toolchain-owned semantic authoring operations

Introduce an accepted toolchain capability that represents a semantic
organizational change, conceptually:

```
applyOperation(document, { kind: "add-agent", department: "engineering", … })
  → { ok: true, source } | { ok: false, diagnostics }
```

Studio expresses intent. The toolchain owns language semantics, validation of
the operation, the document transformation, and the resulting source. The
ordinary compiler then consumes that source — unchanged.

| | |
|---|---|
| **Ownership** | Correct. One owner for "what an agent is and where it lives". |
| **Language Complexity Budget** | **Not zero.** New public toolchain API and new document-transformation semantics. |
| **Cost** | Highest of the viable options. |
| **Risk** | Moderate, and concentrated where it can be tested. |

**Package/boundary ownership.** The proposal is that this is **not** the
compiler. The compiler's accepted boundary (ADR-0003, RFC-0002) is
*source → meaning*: it parses, validates, analyzes and projects. Authoring is
the inverse, *intent → source*, and carries concerns the compiler deliberately
has none of — comment and formatting preservation, key placement, partial
documents. Folding the inverse into the compiler would widen a boundary the
project has defended twice. A distinct package — provisionally
`@genome/authoring`, depending on `@genome/schema` and `@genome/compiler` —
keeps the compiler's contract intact and makes the new capability separately
reviewable, versionable and testable.

**Source preservation is tractable with an already-accepted dependency.**
`yaml` v2 is already a dependency of `@genome/schema`. Its document/CST API
performs targeted edits that preserve comments, key order and formatting. No new
runtime dependency is implied, and the non-normative marking at the top of the
canonical example survives an edit.

**Determinism.** The same document plus the same operation must yield
byte-identical source. This is testable exactly as RFC-0008 E9 and the golden
revision fixtures are, and should be pinned the same way.

**Diagnostics.** The operation reuses the compiler's and schema's diagnostics
rather than inventing a second vocabulary. An operation that would produce an
invalid or semantically broken document fails *before* writing, returning
diagnostics in the compiler's existing worded form.

**Operation vocabulary.** Deliberately tiny to begin with. For remediation:
`add-agent` only. The vocabulary is a governed surface that grows by decision,
not by convenience.

**Schema evolution.** Operations are anchored to the accepted schema, so a
schema change surfaces as a failing operation test in one package rather than as
a user-visible breakage in a view.

**Testability.** A pure function from (document, operation) to (source |
diagnostics) is testable without a browser, and provable at the CLI boundary in
the same style as every other accepted surface.

**Non-Studio consumers.** This is the strongest structural argument. A
toolchain-owned operation is immediately available to the CLI, to scripts, and —
materially — to the Phase 6 self-improvement work, where an *agent* proposing an
organizational change needs exactly this capability. Option B would leave that
consumer with nothing, or with a second implementation.

**Verdict: recommended.** It is the only option that answers the architectural
question rather than working around it.

### Option D — Structured projection editor

Studio exposes structured editing (forms, inline fields) derived from accepted
language/schema information; source remains canonical.

| | |
|---|---|
| **Ownership** | Depends entirely on what materializes the change. |
| **Language Complexity Budget** | Zero for the *rendering*; unresolved for the *writing*. |

**Analysis.** Rendering a form from `loadDefaultSchema()` is legitimate — the
schema is accepted public data, and this embeds no semantics. But the schema
describes **validity**, not **intent** or **placement**, and it cannot express
Genome's cross-references (a workflow `owner` must resolve to a declared agent;
`appliesTo` must resolve to a workflow or agent). A form alone therefore cannot
guarantee a valid organizational change.

Critically, **D does not answer how the change reaches the source.** Whatever
materializes it is either Studio (Option B, with its violation) or a toolchain
capability (Option C). Option D is therefore **not an alternative to C — it is a
presentation choice layered on top of one.** It should be evaluated as such, and
is out of scope for the minimum remediation.

### Option E — Compiler-owned authoring target

A considered alternative: add an `authoring` target to `packages/genome-compiler`
alongside `inspect`/`graph`/`docs`/`runtime-model`.

**Analysis.** Superficially economical — one package, one dependency. But
targets are *projections of meaning out of source*; an authoring target would
run the other way and would import concerns (formatting preservation, partial
documents) the compiler has none of. It would also make every authoring change a
change to the most protected package in the repository, permanently entangling
the language's most stable surface with its least settled one.

**Verdict: reject in favor of a distinct package.** Recorded so the Board can
see the compiler-hosted option was considered rather than assumed away.

## 5. Trade-off summary

| | A — Navigation | B — Studio mutation | C — Toolchain operations | D — Structured editor |
|---|---|---|---|---|
| Clears the primary blocker | ❌ no | ⚠️ yes, wrongly | ✅ yes | ⚠️ only atop B or C |
| Addresses secondary observation | ✅ partly | ✅ yes | ✅ yes | ✅ yes |
| Principle 5 / Rule 5 | ✅ holds | ❌ **violates** | ✅ holds | depends |
| Single owner of language semantics | ✅ | ❌ | ✅ | depends |
| Source preservation | n/a | ❌ risk | ✅ designed for | depends |
| Serves non-Studio consumers | ❌ | ❌ | ✅ | ❌ |
| Language Complexity Budget | zero | zero *(hidden)* | **non-zero, declared** | zero *(incomplete)* |
| Implementation cost | low | low | **high** | medium |
| Requires an RFC | probably not | — | **yes** | yes, if it writes |

## 6. Recommendation

**Adopt Option C — toolchain-owned semantic authoring operations — as the
architectural direction, with Option A's schema-derived explanation folded in as
the presentation.**

Option C is the only alternative that gives Genome an owned answer to "how is an
organization changed?". Option A alone does not clear the recorded blocker.
Option B clears it by breaking the principle that makes the rest of the
architecture trustworthy. Option D is a presentation layered on C.

The honest cost: Option C is the most expensive option and it **spends language
complexity budget** (§8). The recommendation is made on the judgement that the
alternative — a product that cannot author, or a view that owns semantics — is
more expensive over the life of the project, and that the Phase 6 self-
improvement work will require this capability regardless of what Studio does.

## 7. Proposed scope (remediation minimum)

Enough capability to **prove the authoring model**, not to build a no-code
Studio.

1. **One operation: `add-agent`.** Placement under a named department, with
   `role` and `autonomy`, validated before the document is written.
2. **A distinct authoring package** (provisionally `@genome/authoring`) owning
   the operation, its validation, and the source transformation — with source
   preservation and determinism pinned by committed fixtures.
3. **A Studio interaction expressing intent only** — Organization → a department
   → "Add agent" → required information → the operation is applied → the source
   in the editor updates visibly → the projections mark themselves stale →
   Compile → graph and tree show the new agent.
4. **The resulting Genome source stays visible and canonical.** The user must be
   able to see exactly what changed in the document. Authoring must not become a
   layer that conceals the source; the product's honesty about the document is
   part of what already passed.
5. **Schema-derived explanation** at the point of authoring (Option A folded in).

## 8. Language Complexity Budget

Assessed in the RFC-0007/0008/0009 format. **This is not zero, and is not hidden
inside a Studio implementation task.**

| Dimension | Expected default | This remediation (Option C) |
|---|---|---|
| New syntax | 0 | **0** |
| New language semantics | 0 | **0** — an authored document is an ordinary Genome document |
| Schema change | 0 | **0** |
| Compiler production change | 0 | **0** — the compiler is unchanged and remains the semantic authority |
| Runtime production change | 0 | **0** |
| Event-taxonomy change | 0 | **0** |
| Source identity / revision semantics | 0 | **0** — revision still derives from the schema-valid document, unchanged |
| Governance semantics | 0 | **0** |
| **New semantic operations** | 0 | **1** — `add-agent` |
| **New document-transformation semantics** | 0 | **1** — source-preserving application of an operation |
| **New public toolchain API** | 0 | **1** — the authoring package's operation surface |
| **New maintained package** | 0 | **1** — `@genome/authoring` |
| New Studio product surface | minimal | 1 — the authoring interaction |

**Budget result: NON-ZERO on four dimensions.**

Under Governance Rule 2 ("no major architectural change without an RFC") a new
public toolchain capability with its own package and transformation semantics
**requires an RFC**. It cannot be delivered as a Studio implementation task, and
this proposal explicitly declines to route it as one.

Note the shape of the result: the budget is spent entirely on **new capability**,
and **zero** on changing anything already accepted. No accepted semantics move.

## 9. Explicit exclusions

Not proposed, not implied, not authorized:

- **No visual authoring for every Genome construct.** One operation, to prove
  the model.
- **No hiding of the Genome source.** Source stays canonical and visible.
- **No change** to language semantics, schema semantics, compiler normative
  behavior, source identity/revision semantics, runtime semantics, or governance
  semantics. *(Any of these would trip a stop condition — see §12.)*
- **No persistence**, no durable log, no exported-log reader.
- **No Milestone 2** (durable runtime logs).
- **No Autonomy Substrate**, no Office View, no Marketplace, no simulation.
- **No redesign of unrelated Studio surfaces.** Graph, tree, execution,
  governance attribution, the ephemeral session model and the accessibility
  floor are accepted and stay as they are.
- **No API specification.** §7 is deliberately conceptual; the shape is an RFC's
  job, not a proposal's.
- **No re-opening** of the compiler portability authorization (ADR-0011).

## 10. Proposed remediation acceptance requirement

Narrow, and derived from the recorded failure:

> A first-time user can understand that Studio is for describing and operating a
> governed organization, and can successfully make one meaningful organizational
> change without external instruction.

**Canonical remediation scenario — "add an agent to Engineering":**

1. Organization → Engineering
2. → Add agent
3. → provide the required information
4. → the organization becomes edited/stale
5. → inspect the resulting source change
6. → Compile
7. → graph and tree reflect the new agent

Every other §10.1 criterion that already passed must still pass, and the
accessibility floor (WCAG 2.2 AA target, keyboard-operable) applies to the new
interaction exactly as to the existing ones.

## 11. Is a new RFC required?

**Yes.**

Governance Rule 2 and the §8 budget both require it: this introduces a new
public toolchain capability, a new package boundary, and new document-
transformation semantics. Per the Approval criteria in `docs/GOVERNANCE.md` it
also needs a clear owner layer and must not duplicate existing concepts — both
of which are precisely what the RFC must establish.

The RFC would need to settle, at minimum: the owning package and its boundary;
the operation vocabulary and how it grows; the operation result contract; source
preservation and determinism guarantees; diagnostic reuse; CLI exposure; schema
evolution; and the evidence required to close.

Whether the remediation is scoped as an amendment to RFC-0009's Milestone 1 or
as a new RFC that Milestone 1 depends on is a **Board decision**, not a
Lead Engineer one. This proposal recommends a **new RFC**, because the capability
outlives Studio and has consumers RFC-0009 does not govern.

## 12. Stop conditions

Work stops and returns to the Board / Product Owner if remediation is found to
require changing:

- Genome language semantics;
- schema semantics;
- compiler normative behavior;
- source identity / revision semantics;
- runtime semantics;
- governance semantics.

**None of these is currently believed necessary** — Option C adds a capability
without moving any accepted semantics, which is the principal reason it is
recommended. If analysis during RFC drafting shows otherwise, that is a stop
condition, not an implementation detail.

## 13. Exact next governance action

1. **Architecture Board review** of this proposal →
   `docs/reviews/phase-4-m1-authoring-remediation-board-review.md`. *(Prepared.)*
2. **Product Owner ratification** of a Board-recommended option. **This is the
   pending act.** Nothing is ratified by this proposal or by the Board review.
3. *Only if ratified:* commission the RFC per §11, draft it, Board-review it,
   ratify it — and only then does anything enter `IMPLEMENTATION_QUEUE.md`.

**No implementation is authorized at any point before step 3 completes.**
Milestone 1 remains In Progress, the queue item remains In Progress, and Phase 4
remains open for Milestone 1 only.
