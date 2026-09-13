# ADR-0011: Platform-Neutral Compiler and Compiler-Owned Revision Derivation

## Status

Accepted (2026-09-13). Ratified by the Product Owner as Option A of
`docs/reviews/rfc-0009-m1-compiler-portability-board-review.md`, which is also
the one-time authorization to cross the `RFC/0009-phase-4-governed-authoring.md`
§11 protected boundary ("no production diff under
`packages/genome-compiler/src`") for that work alone. Recorded as an ADR rather
than an RFC because nothing normative changes: the accepted derivation and its
observable output are preserved exactly, and the decision records a durable
architectural property rather than a new contract (ADR-0007/ADR-0010 precedent
for decision-worthy, non-RFC-worthy decisions).

## Context

RFC-0009 Milestone 1 opens the first Genome view. The Product Owner fixed
browser-first as its topology, gated behind a compatibility spike.

The spike found that `@genome/compiler` cannot be bundled for a browser as it
stood. Three Node built-ins were imported, and they are not equal in kind:
`node:crypto`'s `createHash` is **exercised on the canonical compilation path**
(once per compilation, inside the Stage-5 revision derivation), while `node:fs`
and `node:url` are **inert** — reached only through default-schema loading, which
a browser caller bypasses by supplying `options.schema` — yet a bundler must
still resolve every static import. `@genome/schema`, `@genome/runtime`, and
`@genome/adapter-reference` import no Node built-in and bundle unchanged.

The Genome revision is the most load-bearing value in the system: every runtime
event attributes to the revision it executed under, and `SPEC/language.md`,
`RFC/0004-runtime-implementation.md`, and `docs/adr/0005-runtime-execution-contract.md`
make its derivation normative. Three ways out were rejected before this one:

- a **Studio-local hash** would place a second implementation of a normative
  derivation inside a view whose defining constraint is that it derives nothing
  (Constitution Principles 2 and 5; RFC-0009 §3);
- an **injectable hashing primitive** would make revision identity a function of
  what a caller passes, contradicting "derived, never declared";
- an **asynchronous derivation** over WebCrypto would force `compile` to become
  asynchronous, converting an accepted API contract (RFC-0002: targets are plain
  functions) into a different one across the CLI, the runtime intake path, and
  the whole suite.

## Decision

1. **Revision derivation is exclusively compiler-owned.** One implementation,
   inside `packages/genome-compiler`, serves every consumer. No view, adapter,
   application, or bundle carries its own.

2. **The normative derivation is unchanged.** The input is the schema-valid
   parsed document; canonicalization is the accepted one (JSON, object keys
   sorted lexicographically at every level, array order preserved), shared with
   the `diff` target; the serialization is UTF-8; the algorithm is SHA-256; the
   representation is lowercase hexadecimal; derivation happens at Stage 5 and is
   carried as `genomeRevision` on the Organization Graph.

3. **The compiler is platform-neutral on its canonical compilation path.** That
   path imports no runtime-specific built-in, so it executes identically under
   Node and in a browser. Portability is a property of the compiler, not of a
   consumer's bundler configuration.

4. **`compile` remains synchronous**, with its accepted signature and its
   defaulting behavior unchanged: a caller that omits `options.schema` still
   compiles against the canonical schema, and does so identically on every
   platform.

5. **Callers cannot inject or replace the revision algorithm.** No option, hook,
   or registration point accepts a hashing primitive. A caller that wants a
   different revision must change the Genome document, which is what a revision
   means.

6. **Node-only concerns must not contaminate the browser-facing compiler path.**
   Default-schema loading is resolved through the module system from the SPEC
   source of truth (`SPEC/schema/genome.schema.json`) rather than through a
   filesystem read at runtime, so the browser-facing path imports no Node
   built-in and the schema cannot diverge from the specification it is taken
   from. Where a Node-only concern genuinely remains in future, it belongs
   behind its own Node-only entry point, never inside the shared path.

7. **Inert or throwing platform shims are not product architecture.** A build
   that succeeds because a code path is promised never to run has hidden
   coupling no test enforces and no reader can see. Shims of that kind are
   permitted as investigation instruments only, never as shipped design.

8. **Views consume compiler-owned identity; they never reproduce it.** Studio
   and every later view render the revision, the graph, the tree, and the events
   the compiler and runtime produce. A view that recomputes any of them is
   rejected regardless of product appeal.

9. **Byte-identical output across platforms is evidenced, not asserted.** A
   permanent conformance harness proves Node ↔ browser equality of the revision
   and the compiler projections over a committed fixture set, and fails CI on
   divergence. Golden revision values are pinned as literals in the repository,
   captured from the pre-change baseline, so any drift in the derivation is a
   test failure rather than a discovery.

## Consequences

- The project now owns an implementation of SHA-256 instead of borrowing the
  platform's. That is the real cost of this decision: a subtle defect would
  corrupt the identity every event attributes to. It is bounded by published
  test vectors, by the pinned golden revisions, and by cross-platform equality
  evidence — bounded, not eliminated.
- Every future browser consumer — a second view, an SDK, an embedded playground
  — inherits portability instead of renegotiating it, and no consumer gains a
  reason to reimplement compiler behavior.
- `state() == replay(log)` and the attribution chain are unaffected: the runtime
  consumes the same revision it always did.
- The authorization that accompanies this ADR is one-time and narrow. Anything
  beyond it — an asynchronous compiler, a caller-supplied primitive, a change to
  the canonicalization or to any golden revision, or a portability fix that
  requires a view to reproduce compiler semantics — stops the work and returns to
  the Architecture Board (`docs/reviews/rfc-0009-m1-compiler-portability-board-review.md`,
  stop conditions).
- Scope exclusions are unchanged: no language or schema change, no runtime
  semantic change, no new event types, no persistence, no exported-log reader,
  no provider adapter, no triggers, no external effects, no simulation, no
  Office View, no self-improvement.
