# Architecture Board Decision — RFC-0002: Genome Compiler

- **Process:** `docs/GOVERNANCE.md` → Architecture Board (Product Owner ·
  Chief Architect · Lead Engineer)
- **Date:** 2026-07-09
- **RFC:** RFC-0002 — Genome Compiler
- **Quorum:** 3/3

## Votes

| Role | Verdict |
|------|---------|
| Product Owner | Request Changes |
| Chief Architect | Request Changes |
| Lead Engineer | Request Changes |

**Outcome: Request Changes — unanimous.** The compiler design is sound and is
approved once the conditions below are incorporated. It was not approved in
Draft state because the RFC's Definition of Done requires the open questions
to be closed and because two specification preconditions were missing.

The conditions have since been applied. RFC-0002 is now marked **Accepted**,
its decisions recorded in `docs/adr/0003-compiler-package-boundary.md`.

## Consensus

1. **Sequencing right, scope too broad.** The compiler is the correct next
   investment, but the compilation-targets list built for consumers
   (runtime, office, workflow, memory) that `PROJECT_STATE.md` marks
   out of scope. Trimmed to CLI inspect + graph + documentation; the rest
   moved to future RFCs tied to Phases 3–6. (Constitution Principle 8.)
2. **No plugin targets in v0.1** (open question 4) — rejected by all three
   roles as YAGNI. Targets are plain functions.
3. **Minimal semantic-validation set** (open question 5) pinned inside the RFC
   so acceptance criteria are concrete.
4. **Blocking `packages/genome-compiler` was healthy**, but trimming scope
   unblocks `genome inspect` and the Organization Graph now.

## Per-role contributions

### Product Owner
Non-goals are the guardrail that keeps this a compiler; the targets list
quietly reintroduced the coupling the Non-goals disown. Approve a scoped
compiler to unblock value now; spin runtime/office/workflow/memory targets
into their own RFCs.

### Lead Engineer (feasibility)
- Reuse contract was unstated: `@genome/schema` already implements Stages 1–2;
  the compiler must depend on it, not reimplement.
- Source-location goal (Stages 1/3) conflicts with `YAML.parse`, which
  discards locations — resolved by making spans optional/best-effort.
- Organization Graph node/relationship set was "Example" only → made
  normative so there is a stable test target.
- Deferrable without risk: open questions 1, 2, 3.

### Chief Architect (rulings)
- Q1 → one package, separate `ast/` and `graph/` modules.
- Q2 → adjacency list, no graph library.
- Q3 → `SourceSpan | undefined` (optional).
- Q4 → no plugins.
- Layer partition: schema = shape; semantic = coherence.

## Corrections to input material

- The Chief Architect's pre-review claimed `autonomy` was not enumerated in
  the spec. **Incorrect** — `SPEC/language.md` already defines `manual`,
  `supervised`, `autonomous`. Caught by the Lead Engineer. `autonomy`
  validation is implementable today.
- Confirmed genuinely missing (and now added to `SPEC/language.md`): the
  `human:<id>` principal grammar and the rule that dotted references skip the
  `teams`/`agents` container keys.

## Applied changes

- `RFC/0002-compiler.md` — status Accepted; open questions → Decisions;
  targets trimmed; reuse contract added; Organization Graph made normative;
  layer partition rule added.
- `SPEC/language.md` — reference-resolution rule and principal grammar.
- `docs/adr/0003-compiler-package-boundary.md` — recorded decision.
- `PROJECT_STATE.md`, `IMPLEMENTATION_QUEUE.md` — state advanced;
  `packages/genome-compiler` unblocked.
