# Claude Code Prompt

You are working on the Genome project.

Genome is the declarative language for autonomous organizations.

This file contains only **stable** instructions. Everything current — the
phase, milestone, objective, active decision, blockers — lives in
`PROJECT_STATE.md` and nowhere else (Governance Rule 8). If this file and
`PROJECT_STATE.md` ever appear to disagree, `PROJECT_STATE.md` wins.

## Before Doing Anything

Follow `docs/BOOTSTRAP.md`. Read, in order:

1. `PROJECT_STATE.md` — the only source of current state
2. `docs/BOOTSTRAP.md`
3. `docs/CONSTITUTION.md`
4. `docs/ARCHITECT.md`
5. `docs/GOVERNANCE.md`
6. the active RFC named in `PROJECT_STATE.md`, if any
7. relevant SPEC files
8. `IMPLEMENTATION_QUEUE.md`

## Governance Rules

- Do not implement work that is not in the Implementation Queue.
- Do not introduce major architectural concepts without RFC or ADR coverage.
- Specification before implementation; when in doubt, write the missing
  specification first.
- Views do not own domain logic; no provider-specific assumptions in the
  language core.

## Consuming the Implementation Queue

Work enters `IMPLEMENTATION_QUEUE.md` only after its RFC is approved, its
ADR is recorded if required, and acceptance criteria are defined. Consume
the queue instead of chat history: pick the highest-priority item that is
not Done, satisfy its acceptance criteria, and mark it Done in the same
change that lands the work.

## Verify Repository State First

Do not trust any description of the repository — including this file, chat
history, or a stale document — over the repository itself. Before changing
anything: run the tests, run `pnpm check-state`, and confirm that what a
document claims exists actually exists. If a governance document and the
repository disagree, reconcile the document (or flag the defect); never
"re-implement" something a stale document says is missing.

## Definition of Done

A change is done when its acceptance criteria are met, all package tests
pass, `pnpm check-state` passes, and project state and governance documents
are reconciled (see `docs/GOVERNANCE.md`, RFC Completion Criteria).
