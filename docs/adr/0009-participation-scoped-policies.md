# ADR-0009: Participation-Scoped Policies

## Status

Accepted (2026-07-14, RFC-0007 ratified under Option A —
`docs/reviews/rfc-0007-board-review.md`)

## Context

The self-hosting investigation demonstrated, and the Board reproduced
from reconstructed fixtures, the one place v0.1's deny-safe posture
inverts: a policy whose `appliesTo` names an agent gates only workflow
initiation *by* that agent, so the common governance declaration ("this
agent's work requires sign-off") binds zero runs under operator
initiation — silently, since the document validates, compiles, and runs
to completion. The behavior matched the specification exactly, making
the correction language evolution (Governance Rule 2), not a bug fix.
The gap was classified an RFC candidate on ratified evidence
(`docs/reviews/self-hosting-evidence-board-review.md`, Gap 1); RFC-0007
was commissioned under the adopted product strategy's Option A and
accepted with five amendments.

## Decision

1. **Participation binding.** A policy whose `appliesTo` names an agent
   gates every run in which that agent **participates**: runs it
   **initiates** (the prior binding, retained) and runs of workflows it
   **executes** — union, not replacement, so no previously gated run is
   released. Workflow-scoped `appliesTo` entries are unchanged.
2. **Executor = owner in v0.1.** An agent executes a workflow when the
   workflow's `owner` resolves to it (every step of a run is assigned
   to the owner). The term is defined so that future multi-agent step
   work extends it ("any step performer") rather than redefines it.
3. **The autonomy/policy boundary (normative).** *Autonomy governs the
   agent's initiative; policies govern the agent's work.* Autonomy
   levels (`manual`/`supervised`/`autonomous`) continue to bind on
   initiation by the agent only — an operator-initiated run is the
   explicit human instruction they exist to require, and the
   demonstrated pattern of `manual` agents executing human-initiated
   governance workflows must keep working. Future autonomy RFCs inherit
   this sentence.
4. **Compiler-boundary derivation.** The binding resolves at compile
   time: each agent-scoped `appliesTo` entry yields, in addition to the
   existing agent→policy `requires` edge, one workflow→policy
   `requires` edge per workflow owned by that agent, in a
   deterministic, pinned order. The `RuntimeModel` shape is unchanged;
   the shipped runtime's policy union (which already honors
   `workflow.governedBy` and deduplicates by id) gates the new binding
   with **zero production-source change** — the runtime suite may gain
   additive cases only, with the existing 17 tests byte-unchanged. No
   interpretation of Genome YAML occurs outside the compiler boundary
   (ADR-0002/0003 preserved).
5. **Correction within v0.1.** No `genomeVersion` bump: the change is
   monotone in the deny-safe direction, no external document relies on
   the initiator-only reading (verified by the review's inventory), and
   a v0.2 would freeze the defective reading as a supported dialect.
6. **Diagnostic, warning-severity forever.** The existing unbound-policy
   warning is extended to the one provably-inert shape (a policy whose
   `appliesTo` resolves only to `manual` agents owning no workflows).
   It must never become an error: declared-ahead-of-wiring
   organizations are legitimate authoring.
7. **Scope locks.** No schema change, no CLI surface change (commands,
   options, exit codes, output contracts), no new event types, no new
   language constructs. Approval mechanics — conjunctive drain,
   deny-safe matching, `runId` matching, the `human:*` floor,
   `policy.enforced` on the denial path only — are untouched
   (ADR-0005/ADR-0008 undisturbed).

## Consequences

- The dominant governance sentence is writable in one declaration,
  correct by construction: gates follow every future workflow owned by
  a governed agent automatically, removing a hand-maintained invariant
  no tool enforced.
- Documents using the per-workflow restatement workaround transition as
  no-ops (policy dedup by id); documents with the mis-modeled shape
  move from silently ungated completion to parking deny-safe at exit 3
  — the intended reading.
- One defined term ("participation", with executor = owner in v0.1)
  enters the language's conceptual inventory; future RFCs touching
  policies, ownership, or multi-agent steps must respect it.
- The previously untested initiating-agent half of the runtime's policy
  union gains coverage via the required additive runtime test.
- The Board's Language Complexity Budget (0 syntax / 1 widened rule /
  1 derivation + 1 diagnostic extension / 0 runtime / 0 schema / 0 CLI
  / 1 term) is part of the review record; its recommendation that
  future language RFCs carry such a section is **non-binding review
  guidance only** — not a standing governance requirement (Product
  Owner disposition, 2026-07-14).
- Evidence runs must be uncached (`pnpm test -- --force`; other tasks
  via `turbo <task> --force` directly).
