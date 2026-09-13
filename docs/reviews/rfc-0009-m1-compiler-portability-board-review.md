# Architecture Board Review — Browser Portability of the Genome Revision Derivation (RFC-0009 Milestone 1)

## Status

**Board review complete; awaiting Product Owner ratification. No option is
applied and no code is changed by this review.**

Commissioned 2026-09-13 by the Product Owner, following the RFC-0009 Milestone 1
browser-compatibility spike. The disposition that commissioned it accepted the
spike as valid implementation evidence, rejected a Studio-local revision
implementation, rejected a local companion process for Milestone 1 at this time,
and directed the Board to evaluate a narrowly scoped compiler change — **subject
to this review**, because `RFC/0009-phase-4-governed-authoring.md` §11 pins "no
production diff under `packages/genome-compiler/src`" as a protected boundary and
requires returning to the Board before crossing it.

This review **does not** authorize the crossing. It records the evidence, the
normative reading, the alternatives, the boundary classification, the evidence
bar, and three options for ratification.

## Instrument and scope

- **Decision under review:** browser portability of the accepted Genome revision
  derivation, as required by RFC-0009 Milestone 1 under the ratified
  browser-first topology (`IMPLEMENTATION_QUEUE.md`, "Milestone-1 acceptance
  floor").
- **In scope:** whether, and by what governance vehicle, a narrowly scoped change
  inside `packages/genome-compiler` may be authorized to make revision derivation
  platform-neutral with the accepted observable result preserved exactly.
- **Out of scope:** everything in §8 below. This review opens no milestone,
  commissions no work, and changes no semantics.
- **Evidence base:** the spike, independently re-executed by the Board at commit
  `8b62039`, uncached.

## Re-executed evidence (at `8b62039`, uncached)

| # | Check | Result |
|---|---|---|
| E-a | Browser bundle of `@genome/compiler`, unmodified, `--platform=browser` | **Fails** with exactly three resolution errors: `node:fs` and `node:url` (`packages/genome-compiler/src/index.ts` lines 11–12), `node:crypto` (`packages/genome-compiler/src/revision.ts` line 12) |
| E-b | Node builtins imported by `@genome/schema`, `@genome/runtime`, `@genome/adapter-reference` | **None**; all three bundle for the browser unchanged |
| E-c | Instrumented shim call counts across nine compiled fixtures in Chromium | `readFileSync` **0**, `fileURLToPath` **1** (module-scope constant, value never read), `createHash` **9** (once per compilation) |
| E-d | Revision equality, Node vs. browser, nine fixtures | **Identical for all nine** |
| E-e | `graphTarget`, `inspectTarget`, `runtimeModelTarget` serialized equality, Node vs. browser, nine fixtures | **Identical for all nine** |
| E-f | Formatting invariance in the browser (`base.yaml` vs `base-reformatted.yaml`) | Same revision — the normative invariance holds |
| E-g | Distinctness in the browser (`base.yaml` vs `base-changed.yaml`, and a structurally different document) | Different revisions |
| E-h | Canonical demo in Chromium (`SPEC/examples/genome-project.yaml` / `rfc-lifecycle`) | Park: 1 `approval.requested`, 0 steps, `human:product-owner` pending; grant: `approval.granted` attributed, at event index 1, before the first `agent.task.assigned` at index 3; completion with 5 steps; the full 14-event sequence **byte-identical to the CLI's** |
| E-i | Determinism under a fixed clock, inside the browser | Two runs byte-identical |
| E-j | Node regression baseline | `pnpm test -- --force`: **113 tests, 5 suites, 0 cached, all green**; `pnpm typecheck` green; `pnpm check-state` green |

Revision goldens observed at `8b62039` (Node and browser alike) are listed in §6;
they are the baseline any authorized change must reproduce byte-for-byte.

## 1. Browser incompatibility — confirmed, with one dependency actually exercised

Direct browser bundling of `@genome/compiler` is blocked by all three imports
(E-a): a bundler must resolve every static import whether or not it runs. But the
three are not equal in kind, and the distinction decides the scope of any fix:

- **`node:crypto` — exercised on the canonical compilation path.** `createHash`
  is called once per compilation (E-c: nine calls for nine documents), inside
  `deriveGenomeRevision` at Stage 5. There is no browser-native substitute:
  WebCrypto's SHA-256 is asynchronous only, and the derivation sits inside a
  synchronous pipeline. **This is the real incompatibility.**
- **`node:fs` — inert on the browser path.** `readFileSync` is reached only
  through `loadDefaultSchema`, which `compile` calls only when the caller omits
  `options.schema`. A browser application supplies the schema explicitly through
  that already-accepted public option; the spike's shim threw if called and was
  never called (E-c: zero calls).
- **`node:url` — inert, but evaluated at module scope.** `fileURLToPath` runs
  exactly once when the module initializes, to build the default schema path
  constant (E-c: one call); the resulting value is never read on the browser
  path. It is a build-time resolution problem, not a runtime one.

**Finding 1.** Browser consumption of the compiler is blocked by one exercised
dependency (`node:crypto`) and two inert ones (`node:fs`, `node:url`) that a
bundler must still resolve.

## 2. Revision semantics — what is normative

Sources: `SPEC/language.md` ("Versioning"), `RFC/0004-runtime-implementation.md`
("Genome Revision Derivation"), `docs/adr/0005-runtime-execution-contract.md`
(Decision 1).

Normative, in all three and mutually consistent:

| Element | Normative content |
|---|---|
| Canonical input | the **schema-valid parsed document** (Stage 2 output) |
| Canonicalization | **JSON**, object keys sorted **lexicographically at every level**, **array order preserved** |
| Encoding | **UTF-8** serialization of that canonical form |
| Algorithm | **SHA-256** |
| Representation | **lowercase hex** |
| Placement | computed at **Stage 5**, carried as top-level `genomeRevision` on the Organization Graph |
| Derived, never declared | documents carry no revision field; formatting/key-order differences share a revision, any semantic difference produces a new one |
| Shared canonicalization | `canonicalJson` is the single serialization used by both revision hashing and the `diff` target (RFC-0005 board condition 2), so "same revision" and "no diff" cannot drift apart |

**Not normative anywhere: the implementation of the hash, its provider, or its
synchrony.** No accepted document names `node:crypto`, a Node runtime, or a
synchronous hashing API. `createHash` is the current implementation shape.

One distinction matters and the Board draws it explicitly:

- **Synchronous *hashing* is implementation shape** — nothing normative depends
  on it.
- **Synchronous *compilation* is an accepted API contract** — RFC-0002 pins
  targets as "plain functions of the form `(OrganizationGraph) => T`"; `compile`
  returns a `CompileResult`, not a promise; the CLI, the runtime intake path, and
  all 113 tests depend on it. Making the *hash* async therefore forces the
  *compiler* async, which is an API change of a different magnitude (§4, option C).

**Finding 2.** Replacing the hash implementation with a platform-neutral one that
produces the same lowercase-hex SHA-256 over the same canonical bytes changes
nothing normative. Changing the compiler to an asynchronous derivation changes an
accepted API contract.

## 3. Scope of the exception under evaluation

The property the Board requires of any authorized change:

> **One compiler-owned implementation of the revision derivation, used
> identically by Node and browser consumers, with the accepted observable result
> preserved exactly. Studio contains no implementation of it.**

This follows from Constitution Principle 2 (the Genome is the source of truth;
subsystems derive from it, they do not silently replace it), Principle 5 (views
own no business logic), and RFC-0009 §3, which forbids Studio deriving compiler
outputs independently. A revision computed by the view — even a correct one — is
a second locus of a normative derivation, and correctness today is not a
guarantee of correctness after either copy changes.

## 4. Implementation alternatives

| | A. Compiler-owned platform-neutral SHA-256 | B. Injectable hashing primitive | C. Async WebCrypto derivation | D. Studio-local shim | E. Local companion process |
|---|---|---|---|---|---|
| Semantic impact | none — same algorithm, same bytes, same output (E-d) | none if defaulted; **unbounded if a caller injects a divergent hash** | output unchanged; pipeline becomes asynchronous | none today; **two implementations free to diverge** | none |
| API impact | none | additive public option on `CompileOptions` | **breaking**: `compile` and every caller become async | none in the compiler | none in the compiler |
| Determinism | unchanged; strengthened by pinned goldens | **caller-determined** | unchanged | unchanged while the copies agree | unchanged |
| Browser portability | complete for the exercised dependency | complete, by pushing the implementation to the caller | complete, using a platform primitive | complete | not achieved — abandons browser-first |
| Maintenance burden | ~60 lines of well-specified hash code in the compiler, needing its own vectors and multi-block/Unicode tests | two surfaces plus a contract nobody can enforce mechanically | large one-off churn across CLI, runtime intake, and 113 tests | a second copy maintained forever in the view | a process, a transport, and a topology to maintain |
| Hidden coupling | **removed** — no platform coupling left on the canonical path | **introduced** — behavior depends on what the caller passed | introduces asynchrony into a pure pipeline | **introduced** — Studio's build silently determines revision identity | Node coupling preserved, deferred to the next browser consumer |
| Principle 5 | strongest — the view carries no algorithm | fails if Studio supplies the primitive | compliant | **fails** — the view owns a normative derivation | compliant |
| Protected boundary | production diff under `packages/genome-compiler/src` → §11 crossing, implementation-only | §11 crossing **plus** a public API change | §11 crossing **plus** a semantic/API change → dedicated RFC | no compiler diff — passes §11's letter, defeats its intent | none |

Board reading, alternative by alternative:

- **A** is the only alternative that satisfies §3's property while leaving every
  accepted contract — normative derivation, synchronous compilation, public API
  shape — untouched. Its one real cost is that the project maintains a hash
  implementation; that cost is bounded by published test vectors and by pinned
  revision goldens, both of which §6 requires.
- **B** looks conservative and is not. An injectable primitive makes revision
  identity a function of what a caller passes, which contradicts "derived, never
  declared" and hands the view exactly the ownership Principle 5 denies it. If
  Studio supplies the primitive, B *is* D wearing a compiler-shaped interface.
- **C** is architecturally clean about crypto and expensive about everything
  else: it converts the accepted synchronous compiler API into an asynchronous
  one, cascading through the CLI's exit-code paths, the runtime intake path, and
  the full suite. That is a compiler API change, not a portability fix, and it
  belongs to a dedicated RFC if it is ever wanted on its own merits.
- **D** is rejected on architecture, independently of the Product Owner's
  disposition: it places a second implementation of a normative derivation inside
  a view whose defining constraint is that it derives nothing.
- **E** changes no code and solves nothing durable: the compiler stays
  non-portable, and the next browser consumer meets the same wall. It remains the
  honest fallback if no compiler change is authorized.

**Board preference: A**, with the §9 portability cleanup folded into the same
change. The Product Owner's stated preference was not assumed: B, C, D and E were
each evaluated on their own terms, and B in particular — the superficially
smaller change — is rejected on architectural grounds rather than on scope.

## 5. Protected-boundary classification

Under alternative A, the change is an **implementation-only compiler portability
change**: same public API, same call shape, same observable output, no new
concept. It nonetheless produces a production diff under
`packages/genome-compiler/src`, which RFC-0009 §11 pins as protected, so it
requires explicit authorization — RFC-0009 does **not** silently authorize it,
and the Amendment 2 allowance for additive public interfaces does not reach it
(that allowance covers Studio-side interfaces over already-accepted behavior, not
changes inside the compiler).

Classification of the §9 cleanup, if folded in: moving default-schema loading to a
Node-only entry module adds one module and moves one exported function between
entry points, with in-repo consumers only (the packages declare no `exports` map
and are not published). The Board classifies that as **additive plus an internal
consumer update**, not a semantic change — provided `compile`'s signature,
defaulting behavior in Node, and every output stay identical.

Under B or C the classification changes to a **compiler semantic/API change
requiring its own RFC**, which is why the Board does not recommend reaching them
through this exception.

## 6. Conformance evidence required of any authorized implementation

Permanent, executable, uncached, and committed with the change:

1. **Revision equality, Node vs. browser**, over a fixture set that includes:
   the canonical example `SPEC/examples/genome-project.yaml`; `SPEC/examples/company.yaml`;
   a minimal valid document; an ASCII document; a Unicode-heavy document
   (multi-byte characters in names and missions); a formatting-only variant of a
   document (same revision required); a semantically changed variant (different
   revision required); and at least one structurally different document.
2. **`graphTarget` equality**, Node vs. browser, over the same fixtures.
3. **`inspectTarget` equality**, over the same fixtures.
4. **`runtimeModelTarget` equality** over the same fixtures, compared on the
   serialized form.
5. **Deny-safe park equality** — the canonical demo parks with one
   `approval.requested`, zero completed steps, and the pending principal, in the
   browser as at the CLI.
6. **Granted execution event equality** — the full event sequence of the granted
   run, browser vs. CLI, compared element-wise.
7. **Attributed approval ordering** — `approval.granted` attributed to
   `human:product-owner` and ordered before the first step event.
8. **Determinism under a fixed clock** — repeated browser runs byte-identical.
9. **Pinned revision goldens.** No test in the repository currently pins a
   literal revision value: the suite asserts the 64-hex *shape*, stability, and
   distinctness, but never the value. An output-preserving change therefore has
   nothing to regress against today. The Board requires golden values to be
   pinned **before** any implementation change, using the pre-change baseline
   observed at `8b62039`:

   | Fixture | Revision at `8b62039` |
   |---|---|
   | `SPEC/examples/company.yaml` | `a0ef705c96a0355d630f731c77dec8c62f23a796acd663509260a9f5c30dd6bb` |
   | `SPEC/examples/genome-project.yaml` | `f86a6a1b0736bfba1b7c2b5209818740082b0e9fea0246f47201653f3074571b` |
   | `packages/genome-cli/src/__fixtures__/base.yaml` | `8dc0e9ef6e0e1e07d6324b342eabfd1f02d8dbda07ab7912ff88ee8fec585b72` |
   | `packages/genome-cli/src/__fixtures__/base-reformatted.yaml` | `8dc0e9ef6e0e1e07d6324b342eabfd1f02d8dbda07ab7912ff88ee8fec585b72` |
   | `packages/genome-cli/src/__fixtures__/base-changed.yaml` | `3466864b2df5183721d6b97a9b29d8dad6b52fb70dfcdce25c83b37dd71321f8` |
   | `packages/genome-compiler/src/__fixtures__/participation-binding.yaml` | `ec2099777fbbe21d518eb916946e56bf142a3e3dcbc5d63c3ee885bd74269afc` |

   Documents introduced for the Unicode and minimal cases must be committed as
   fixtures and carry their own pinned goldens.
10. **Hash-implementation vectors**, if an implementation is written: published
    SHA-256 test vectors including the empty input, a single-block input, a
    multi-block input, and a multi-byte UTF-8 input.

**Harness constraint (normative for the evidence).** The browser harness must
exercise **compiler-owned behavior**: it imports the compiler and compares the
compiler's outputs against the same compiler's outputs under Node. It must not
reimplement, inline, or approximate the algorithm in test code, and it must not
compare against a hash computed by the test itself. A harness that computes the
expected revision independently proves nothing about the compiler.

## 7. Node regression

The existing suite must remain green and unchanged in meaning: **113 tests across
five packages, uncached (`pnpm test -- --force`), plus `pnpm typecheck` and
`pnpm check-state`** — the baseline recorded at `8b62039` (E-j). CLI behavior must
remain byte-identical: the `--json` and `--export-log` contracts, all exit codes,
and the pinned NDJSON framing. The revision goldens of §6.9 must reproduce
byte-for-byte before and after.

## 8. Scope containment

No option in this review authorizes, and no implementation following it may
include: Studio UI implementation beyond consuming the accepted compiler; schema
changes; language changes; runtime semantic changes; new event types;
persistence; exported-log readers; provider adapters; triggers; external effects;
simulation; Office View; or self-improvement. Milestone 2 (durable runtime logs)
remains unopened and undesigned.

## 9. `node:fs` / `node:url` portability

Two ways to clear the inert dependencies:

- **(i) Remove them from the browser-facing compiler path** — keep the
  browser-facing entry free of Node imports, and move default-schema loading
  (`loadDefaultSchema` and its module-scope path constant) into a Node-only entry
  module consumed by Node callers. Explicit schema supply through
  `options.schema` is already an accepted public option and is what a browser
  application uses.
- **(ii) Leave them and let the application shim them** — what the spike did, to
  answer the question it was asked.

**The Board rejects (ii) as product architecture.** The spike's throwing
`readFileSync` and identity `fileURLToPath` were instruments, not a design: they
make a browser build succeed by promising that a code path is never taken, which
no test enforces and no reader can see. A shipped Studio whose correctness rests
on "this Node call never happens" has hidden coupling of exactly the kind the
Charter tells the Architect to reject.

**Finding 3.** If a compiler portability change is authorized at all, (i) belongs
in the same change: the browser-facing path should import no Node builtin, so
that portability is a property of the compiler rather than a property of one
consumer's bundler configuration. If no compiler change is authorized, (ii) must
not be adopted as a substitute — the correct response is then topology (§Option C).

## 10. Governance vehicle

Smallest vehicle that correctly represents the impact, under alternative A:

- **Not a new RFC.** Nothing normative changes: no language, schema, semantic,
  API-shape, or event change; the accepted derivation and its observable output
  are preserved exactly and proven so by §6 evidence. Reserving an RFC for an
  output-identical implementation change would misrepresent the impact.
- **Not an RFC-0009 amendment.** RFC-0009's scope, canonical demo, evidence set,
  success criteria, and the other eight protected boundaries are untouched. The
  §11 boundary is not being *redefined*; a single, evidenced crossing is being
  authorized under the procedure §11 itself prescribes.
- **A Board-authorized implementation exception, recorded in this review and
  ratified by the Product Owner** — the authorization instrument.
- **Plus one ADR**, recording the durable architectural property this establishes
  (Governance Rule 3): the compiler is platform-neutral on its canonical
  compilation path, and the revision derivation is compiler-owned and
  dependency-free, so every future consumer — Studio, a second view, an SDK —
  inherits portability instead of renegotiating it. The precedent for an ADR
  without an RFC is `docs/adr/0010-erratum-mechanism.md`.

If the Product Owner selects Option B instead, the vehicle is a dedicated
compiler-portability RFC through the normal lifecycle.

## Decision options

Exactly three, as commissioned. None is applied by this review.

### Option A — Authorize narrow compiler portability work (Board recommendation)

- **Exact authorized scope:** a single implementation-only change inside
  `packages/genome-compiler` that (1) replaces the `node:crypto` hashing call in
  the revision derivation with one compiler-owned, platform-neutral, synchronous
  SHA-256 implementation producing byte-identical lowercase-hex output, and
  (2) removes `node:fs`/`node:url` from the browser-facing compiler path by
  moving default-schema loading into a Node-only entry module, updating the CLI
  import accordingly. Plus the §6 conformance evidence, the §6.9 goldens pinned
  first, and the §10 ADR.
- **Prohibited scope:** any change to the normative derivation (input,
  canonicalization, encoding, algorithm, representation, Stage-5 placement); any
  change to `compile`'s synchronous signature or defaulting behavior in Node; an
  injectable or caller-supplied hashing primitive; any Studio-side implementation
  of the derivation; inert or throwing shims as the shipped design; and every
  item in §8.
- **Governance artifact required:** this review, ratified by the Product Owner,
  as the Board-authorized implementation exception to RFC-0009 §11; plus one ADR
  recording compiler platform-neutrality. No new RFC; no RFC-0009 amendment.
- **Implementation-queue effect:** no new item. The existing Milestone-1 item
  gains a recorded precondition — the portability change and its evidence land
  before substantive Studio UI work — under its acceptance floor.
- **Evidence required:** §6.1–§6.10 in full, uncached and committed; §7 Node
  regression green with goldens byte-identical; `pnpm check-state` green.
- **Main architectural risk:** the project takes ownership of a cryptographic
  primitive it previously borrowed from the platform. A subtle implementation
  defect would corrupt revision identity — the value every event attributes to.
  Mitigated, not eliminated, by published vectors (§6.10), pinned goldens
  (§6.9), and cross-environment equality (§6.1).
- **Exact Product Owner ratification statement:**

  > As Product Owner, I ratify **Option A**. I authorize the narrow,
  > implementation-only compiler portability change scoped in this review as an
  > exception to RFC-0009 §11, conditional on the §6 evidence, the §6.9 goldens
  > being pinned before the implementation changes, the §7 Node regression
  > remaining green, and the §10 ADR being recorded. No other protected boundary
  > is opened, and nothing in §8 is authorized.

### Option B — Require a dedicated RFC

- **Exact authorized scope:** commissioning a compiler-portability RFC covering
  the platform boundary of the compiler, the revision derivation's
  implementation ownership, and the entry-point structure for non-Node
  consumers. No implementation is authorized by the commissioning.
- **Prohibited scope:** any change under `packages/genome-compiler` before that
  RFC is accepted and ratified; Studio-side derivation; inert shims as an interim
  design; and every item in §8.
- **Governance artifact required:** a new RFC through the full lifecycle (draft →
  Board review → Product Owner ratification), with an ADR if it decides an
  architectural boundary.
- **Implementation-queue effect:** no engineering item enters the queue until the
  RFC is accepted; the Milestone-1 item stays **Not Started** and blocked on the
  browser-first path for the RFC's duration.
- **Evidence required:** everything in §6–§7, plus whatever the RFC itself pins;
  this review's evidence carries into it as prior art.
- **Main architectural risk:** cost and delay disproportionate to an
  output-identical change, and a precedent that every platform-portability fix
  needs an RFC — which will slow exactly the kind of boundary hygiene the
  Charter encourages. The countervailing argument the Board records fairly:
  revision identity is the most load-bearing value in the system, and a
  deliberate, fully-specified decision about who owns its implementation is
  defensible on those grounds alone.
- **Exact Product Owner ratification statement:**

  > As Product Owner, I ratify **Option B**. I commission a dedicated
  > compiler-portability RFC and authorize no change under
  > `packages/genome-compiler` until that RFC is accepted and ratified. The
  > Milestone-1 item remains blocked on the browser-first path in the meantime.

### Option C — Preserve the compiler unchanged

- **Exact authorized scope:** Milestone 1 proceeds on a different topology — a
  local companion process hosting the compiler and the ephemeral runtime in Node,
  with the browser surface consuming it — within the ephemeral-session invariant
  (RFC-0009 §4, Amendment 1). The acceptance floor's browser-first choice is
  superseded by the Product Owner in this option.
- **Prohibited scope:** any diff under `packages/genome-compiler/src`;
  Studio-side derivation of the revision or of any compiler output; persistence
  of any kind, including the companion process's session state; and every item
  in §8.
- **Governance artifact required:** a Product Owner disposition amending the
  Milestone-1 acceptance floor in `IMPLEMENTATION_QUEUE.md` to record the
  topology change and its rationale. No RFC, no ADR, no RFC-0009 amendment.
- **Implementation-queue effect:** the Milestone-1 item is unblocked immediately;
  its acceptance floor is amended (topology, and the companion process's
  ephemerality constraint).
- **Evidence required:** §6.5–§6.8 and §7 unchanged; §6.1–§6.4 become
  process-boundary equality checks rather than cross-environment ones; the
  ephemeral-session invariant must be evidenced explicitly, since a process that
  outlives a tab is the easiest place for durable state to appear by accident.
- **Main architectural risk:** the compiler stays non-portable, so the next
  browser consumer — a second view, an SDK, an embedded playground — meets the
  same wall, having paid a process boundary in the meantime. The topology also
  introduces a transport and a lifecycle that Milestone 1 does not otherwise
  need, and a place for hidden session state to accumulate.
- **Exact Product Owner ratification statement:**

  > As Product Owner, I ratify **Option C**. The compiler is not modified.
  > Milestone 1 proceeds on a local companion topology within the ephemeral
  > session boundary, and I will amend the Milestone-1 acceptance floor
  > accordingly. Nothing in §8 is authorized.

## Explicitly not done by this review

- No option applied; no ratification recorded.
- No change to `packages/genome-compiler` or any other package.
- No Studio UI implementation begun.
- No change to `RFC/0009-phase-4-governed-authoring.md`, to any ADR, to
  `SPEC/`, or to any test.
- No milestone opened, no queue item added, no capability commissioned.
