# ADR-0008: Reference Execution Contract

## Status

Accepted (2026-07-13, RFC-0006 ratified under Option B —
`docs/reviews/rfc-0006-board-review.md`)

## Context

Phase 3's goal — execute a simple organization from a Genome file — was
demonstrable only in-process with an injected test adapter. The Phase 0–3
transition review held Phase 3 open and scoped in the reference adapter
and a `genome run` command, with boundary constraints (its Condition 4)
and a CLI-boundary evidence standard for closing the phase (its
Condition 5). RFC-0006 specifies both; the Board accepted it with eleven
amendments after two independent role reviews found the architecture
sound and the ambiguities textual.

## Decision

1. **Adapter naming convention.** Everything below the provider seam
   ships as a separate package named `packages/genome-adapter-*`
   (instantiating RFC-0003's package boundary). The first is
   `packages/genome-adapter-reference`: deterministic, local,
   provider-free, dependent only on `@genome/runtime` types. "Below the
   seam" is thereby a lexical property of the workspace.
2. **The settle contract.** `dispatch` never re-enters the runtime (it
   only enqueues); `settle()` drains the FIFO and **returns immediately
   on the first refused report**, holding the refused task at the head —
   `settle()` therefore always terminates. Adapter-held state (FIFO,
   dispatch record) is derivable from replay of the event log; note this
   is *stronger* than the seam requires (ADR-0004 demands disposability,
   not derivability) and is not precedent for provider adapters.
3. **Grant semantics.** `--grant` is deny-safe and explicit: matched by
   the runtime's rules (exact principal, or a concrete `human:<id>`
   against a pending `human:*` floor; `human:*` ungrantable). A grant is
   an **operator assertion** — the log attributes the response to the
   named principal; surfaces where principals respond for themselves
   require authentication and their own RFC. Unmatched grants warn on
   stderr; multiple grants matching one floor resolve
   first-in-command-line-order.
4. **Exit codes.** `genome run`: 0 completed / 1 failed / 2 trouble
   (including *all* invocation-level errors — parser defaults must be
   overridden) / 3 pending-approval. Exit 3 names deny-safe blockage as a
   first-class, non-failure outcome.
5. **Export and replay.** `--export-log` writes UTF-8 NDJSON (one
   envelope per line, LF, trailing newline), once, after settlement. The
   required invariant is **state-level**: `replay(parsedLog)` equals the
   reported final state. No shipped code path reads an exported log; any
   reader is the persistence gate's "first consumer" and requires its own
   RFC.
6. **Determinism.** Event sequences are identical across identical
   invocations (ids, types, sources, runIds, payloads); timestamps are
   informational except under the public `--clock` testing aid, where
   stdout and the export are byte-identical (asserted separately; stderr
   excluded).
7. **Scope locks.** `--fail-step` is defined by the reference adapter and
   not inherited by future adapter selection. No compiler or runtime
   public contract changes (verified by empty git diff plus unchanged
   suites). No providers, no persistence, no triggers, no Studio or
   Office View.

## Consequences

- The adapter seam has a permanent conformance implementation; RFC-0004's
  approval mechanics, failure semantics, and replay invariant become
  demonstrable by anyone at a terminal.
- Phase 3's close review can run on executable CLI-boundary evidence
  (`genome run` on the designated example through the reference adapter).
- The first provider adapter inherits the naming convention and the seam
  contract, but not the derivability property or `--fail-step`.
- Evidence runs must be uncached (`pnpm test -- --force`; other tasks via
  `turbo <task> --force` directly).
