# RFC-0006: Reference Adapter and Genome Run (Phase 3 completion)

## Status

Accepted

Accepted by the Architecture Board (Product Owner, Chief Architect, Lead
Engineer) on 2026-07-13 under **Option B — Approve with Amendments**; the
eleven consolidated amendments have been incorporated into this document
and the six open questions resolved per the Joint Board Recommendation.
See `docs/reviews/rfc-0006-board-review.md` for the decision record and
`docs/adr/0008-reference-execution-contract.md` for the recorded
architectural decision.

Authorized by the Phase 0–3 transition review
(`docs/reviews/phase-0-3-board-review.md`, ratified 2026-07-13), which
held Phase 3 open and scoped exactly this work into it, with boundary
constraints pinned in that review's Condition 4 and the phase-close
evidence standard pinned in its Condition 5. This RFC opens no new phase.

## Summary

Phase 3's goal — *execute a simple organization from a Genome file* — is
today demonstrable only inside a test process with an injected adapter.
This RFC specifies the two artifacts that make the goal demonstrable at
the CLI boundary, where this project's evidence standard lives:

- a **deterministic local reference adapter**,
  `packages/genome-adapter-reference`: the first real consumer of the
  RFC-0004 adapter seam, living below it as a separate package
  (ADR-0004 §8), simulating agent work with no provider, no network, and
  no nondeterminism;
- **`genome run <file>`**: a CLI command that compiles a Genome document,
  builds its `RuntimeModel`, executes one explicitly selected workflow
  through the reference adapter, streams the event log to the terminal,
  and can export the activity log.

Nothing new is invented above the seam: the command composes the existing
compiler pipeline, the existing runtime core, and the existing CLI
plumbing. The runtime's observed state remains `replay(log)` by
construction; this RFC adds no state anywhere else.

## Motivation

Three accepted decisions converge on this work:

1. **ADR-0004 §8**: "Adapters ship as separate packages when Phase 3
   needs the first one." The Phase 0–3 review ruled that Phase 3 needs
   the first one now — the adapter seam is the only shipped contract with
   no real consumer, and ADR-0003's precedent gates each increment on
   exactly such a consumer.
2. **The Board's evidence standard** (review Condition 5): Phase 3 closes
   only when `genome run` drives at least one workflow of a designated
   example to completion through the reference adapter, with exit codes
   and output contract covered by CLI-boundary tests — the same standard
   the other four commands already meet.
3. **The Charter's biases**: examples before abstractions, and CLI
   commands that make documentation executable. `genome run` makes
   RFC-0004's execution semantics — approval gates, the intrinsic
   `human:*` floor, structured refusals, replayable state — observable by
   a person at a terminal instead of only by a test harness.

## Goals

- Define the reference adapter contract: deterministic, local,
  provider-free, below the seam, with scripted failure for simulation.
- Define the `genome run` CLI contract: explicit workflow selection,
  execution from compiled artifacts only, terminal event output,
  exportable activity log, pinned exit codes.
- Preserve every existing contract untouched: the RFC-0003 event
  envelope and taxonomy, RFC-0004 execution semantics, `state() ==
  replay(log)`, deny-safe approvals, the compiler boundary.
- Close the Phase 3 goal-sentence gap so the follow-up transition review
  can close the phase on executable evidence.

## Non-goals

- **No provider adapters** (OpenAI, Anthropic, or any other): the
  reference adapter simulates work; real providers remain out of scope
  for Phase 3 (`PROJECT_STATE.md`, Explicitly Out of Scope).
- **No durable or distributed event persistence**: the log stays
  in-memory for the process lifetime; the export is a file written once
  at the end, not a store. Persistence stays gated on its first consumer
  (Board review, amendment to Outcome B). No shipped code path reads an
  exported log as input: `genome run` accepts no log or resume argument,
  and the only reader of an export is the replay-equality test. Any
  command or flag that consumes an exported log is the "first consumer"
  the Board's gate names, and requires its own RFC.
- **No trigger auto-initiation**, no schedulers, no watch mode
  (ADR-0005: explicit initiation only in v0.1).
- **No retries, no concurrency**: execution stays sequential and
  non-preemptive per RFC-0004.
- **No Studio or Office View work.**
- **No redesign of the compiler or runtime**: if implementing this RFC
  appears to require changing either package's existing public contract,
  the implementation must stop and return to the Board.
- **No new event types**: the RFC-0003 taxonomy is sufficient; the final
  state line (below) is CLI output, not an event.

## User-Facing CLI Contract

```text
genome run <file> --workflow <id> [options]
```

| Option | Meaning |
|--------|---------|
| `--workflow <id>` | **Required.** The workflow to execute. There is no default and no "run everything": initiation is explicit (ADR-0005), and selection is part of that explicitness. |
| `--as <principal>` | Initiating principal: `human:<id>` or an agent node id/reference. Default `human:operator`. |
| `--grant <principal>` | Repeatable. Pre-authorized approval, matched by the runtime's rules — the exact requested principal, or a concrete `human:<id>` grant against a pending `human:*` intrinsic floor; `--grant human:*` itself is refused by the runtime (`reserved-principal`). No `--grant`, no approval — deny-safe. |
| `--fail-step <step>` | Repeatable. Simulation aid: the reference adapter reports failure for the named step (`workflowId:step` or bare step name). `--fail-step` is defined by the reference adapter; a future adapter-selection surface does not inherit it. |
| `--json` | Machine output: NDJSON event stream plus a final-state line. |
| `--export-log <path>` | Write the complete event log as NDJSON after the run reaches its terminal or blocked state. |
| `--clock <iso8601>` | Testing aid: fixes the injectable runtime clock to a constant, making output byte-stable. Not a scheduling feature. |

Semantics: compile the file; on success, build the `RuntimeModel`, create
the runtime with the reference adapter, call
`startWorkflow(<id>, <principal>)`, submit grants for requested approvals
(in event order), settle the adapter to quiescence, print the final
state, optionally export the log, and exit with the codes pinned below.

## Reference Adapter Contract

Package: `packages/genome-adapter-reference` (pinned by the Board — the
`genome-adapter-*` prefix instantiates the RFC-0003 package-boundary
convention and becomes the rule for everything below the seam). Depends
only on `@genome/runtime` types; exports no provider identifiers;
performs no I/O and no network access.

```ts
type ReferenceAdapterOptions = {
  /** Steps to fail, as "workflowId:step" or bare "step". */
  failSteps?: string[];
};

function createReferenceAdapter(options?: ReferenceAdapterOptions): ReferenceAdapter;

type ReferenceAdapter = AgentAdapter & {
  /** Attach the runtime whose reportTask receives outcomes. */
  bind(runtime: Runtime): void;
  /** Drive all queued tasks to quiescence, synchronously, FIFO. */
  settle(): void;
  /** Every task ever dispatched, in dispatch order (inspection aid). */
  dispatched: readonly AgentTask[];
};
```

Normative behavior:

1. `dispatch(task)` **never re-enters the runtime**: it appends the task
   to an internal FIFO and returns. All reporting happens inside
   `settle()`, which pops tasks in order and calls
   `reportTask(runId, outcome, detail)` until the queue is empty **or a
   report is refused; a refusal ends the `settle()` call immediately**,
   leaving the refused task at the head (behavior 3) and everything
   behind it queued for a later `settle()`. `settle()` therefore always
   terminates. (Completing a step enqueues the next dispatch, which the
   same `settle()` call also drains.) Single-threaded, no timers, no
   promises.
2. Outcome is `"failed"` exactly when the task matches `failSteps`
   (qualified match wins over bare match); otherwise `"completed"`. The
   failure `detail` is the fixed string `simulated failure`.
3. A refused report (e.g. the runtime was halted between dispatch and
   settle) leaves the task at the head of the queue; the adapter holds it
   for a later `settle()`. Adapter-held state is disposable, per the seam
   contract — it never becomes divergent truth.
4. The adapter holds no state other than the FIFO and the `dispatched`
   record; both are derivable from the event log it was driven by.

## Compiler/Runtime Boundary

- `genome run` consumes **compiled artifacts only**: `compile(source)` →
  `runtimeModelTarget(graph)` → `createRuntime`. It interprets no raw
  Genome YAML (ADR-0002; the existing `compileOrFail` path is reused).
- Nothing above the adapter seam names a provider (Governance Rule 7).
  The reference adapter itself names no provider either — "reference" is
  the product.
- The runtime core is consumed as-is: no new methods, no new event
  types, no state outside `replay(log)`. The CLI's view of the run —
  streamed events and the final state — is derived exclusively from
  `subscribe()` and `state()`.
- The compiler package is untouched.

## Event and Final-State Output

Default (human-readable): one line per event as it is appended, carrying
the sequence id, type, source, and a payload summary; after settlement, a
final-state block showing the run's status, completed steps, and any
pending approvals.

`--json`: one JSON object per line — each event exactly as the RFC-0003
envelope serializes (no reshaping), followed by one final line that is
**not an event**:

```json
{"finalState": {"runId": "run-1", "status": "completed", "completedSteps": 5, "pendingApprovals": []}, "exitCode": 0}
```

`--export-log <path>`: the complete event log, written once after
settlement. Framing is pinned: UTF-8, one `JSON.stringify(envelope)` per
line, LF separators, with a trailing newline. The export is
**descriptive**: it is not the Phase 6 proposal payload (that reservation
stands, ADR-0006), and feeding it back into `replay` must reproduce the
reported final state exactly — this equality is a required test, defined
at **state level** (`replay(parsedLog)` equals the reported final state):
payload fields with `undefined` values do not survive JSON serialization,
so deep-equality of individual events is deliberately not the contract.

## Failure and Exit-Code Behavior

| Exit | Meaning |
|------|---------|
| 0 | The selected workflow ran to `completed`. |
| 1 | The workflow reached `failed` (task failure; approval denial is reachable only through the runtime API in v0.1 — `genome run` has no deny surface, and absent grants park at exit 3). |
| 2 | Trouble: unreadable file, compile failure, missing/unknown `--workflow`, ownerless workflow, or any structured runtime refusal at initiation (`unknown-agent`, `manual-agent`, `reserved-principal`, …). The refusal reason is printed verbatim. |
| 3 | Blocked, not terminal: the run parked in `pending-approval` because a required approval had no matching `--grant`. The pending principals are listed. |

The 0/1/2 skeleton deliberately mirrors `genome diff` (ADR-0006):
scripts can distinguish "the organization's run failed" from "the
invocation broke". Exit 3 is new and names the one state that is neither
success nor failure — deny-safe blockage.

All invocation-level failures — including missing or unknown options and
arguments — are "trouble" and exit 2. The implementation must override
the argument parser's default exit behavior (commander exits 1 on a
missing required option) so the pinned codes, not the library's, are the
contract.

## Determinism Requirements

1. Given the same document, command line, and package versions, the
   produced event sequence — ids, types, sources, `runId`s, payloads — is
   **identical across runs**. Sources of this guarantee: sequential event
   ids, FIFO settlement, `run-<n>` id derivation from replayed state, and
   an adapter with no clock, randomness, or I/O.
2. Timestamps remain informational only (RFC-0004) and are excluded from
   the guarantee — except under `--clock`, where the injected constant
   makes stdout and the exported log **byte-identical** across runs. The
   required determinism test asserts stdout and the export file
   separately; stderr (compile warnings, unmatched-grant warnings) is
   excluded from the byte-identity assertion.
3. Grant submission order is deterministic: grants are applied to
   requested approvals in event order, not command-line order. When
   multiple grants match one pending `human:*` floor, the first in
   command-line order is submitted, so log attribution is deterministic.

## Testing and Executable Evidence

All contracts above are tested **at the CLI boundary** (subprocess spawn,
exit codes, stdout/stderr, parsed JSON), extending
`packages/genome-cli/src/cli.test.ts` in the established pattern. Required
cases:

1. `genome run SPEC/examples/company.yaml --workflow <designated id>`
   (with the grants the example's policies require) → exit 0 — the Board's
   Condition 5 evidence, verbatim.
2. Missing `--workflow` and unknown workflow → exit 2 with the reason.
3. A policy-gated workflow with no `--grant` → exit 3, the
   `approval.requested` event visible, pending principals listed.
4. The same workflow with the matching `--grant` → exit 0, with
   `approval.granted` and `policy.enforced` attribution in the log.
5. `--fail-step` → exit 1, `agent.task.failed` then `workflow.failed`.
6. `--export-log`: the file parses as NDJSON envelopes and
   `replay(parsedLog)` equals the reported final state.
7. Determinism: two identical invocations under `--clock` produce
   byte-identical stdout and exported logs.
8. The adapter package carries its own unit tests and a `test` script
   (`pnpm check-state` requires one for every package).

The suite keeps the subprocess boundary; if its runtime grows past
comfort, the mitigation recorded in the Board review (compile once,
spawn `node` against `dist/`) applies without changing any contract.

## Security and Human-Approval Behavior

- **Deny-safe is preserved end-to-end**: absence of `--grant` never
  approves anything; a gated run parks and exits 3. There is no
  `--approve-all`.
- **Grants are explicit and attributable**: each grant names a concrete
  principal, is submitted through `submitApproval` (so it appears in the
  log as an ordinary attributable approval), and is matched by the
  runtime's existing rules. The reserved principal `human:*` cannot be
  granted — the runtime refuses it, and the CLI does not special-case it.
- **A grant is an operator assertion**: the CLI submits the response on
  the named principal's behalf, and the log attributes the response to
  that principal, exactly as a test driving `submitApproval` would. This
  is simulation semantics, appropriate to a local reference run; any
  future surface where principals respond for themselves must
  authenticate responders and requires its own RFC.
- **Unmatched grants are surfaced, not silent**: a `--grant` that matches
  no requested approval produces a stderr warning and does not change the
  exit code.
- **The intrinsic floor stands**: a supervised agent initiation
  (`--as <agent>`) still requires a concrete human grant to start, per
  ADR-0005.
- **No ambient authority**: the reference adapter has no network, no
  filesystem access (the log export is written by the CLI, not the
  adapter), no environment-variable configuration, and no secrets.
- **Halt/resume are not exposed** by `genome run`: it is a single-process
  run-to-quiescence command; the operator stop surface remains the
  runtime API until a long-running host exists to need it.

## Definition of Done

- Reference adapter package landed with the normative contract above,
  unit-tested, with a `test` script — ✅/❌
- `genome run` landed with the exact option set, output contracts, and
  exit codes pinned here — ✅/❌
- All eight CLI-boundary test cases above passing, uncached — exact
  incantations: `pnpm test -- --force` for tests; other tasks invoke
  turbo directly (`./node_modules/.bin/turbo <task> --force` —
  `pnpm typecheck -- --force` does not work, pnpm forwards the flag into
  `tsc`) — ✅/❌
- The Board's Condition 5 evidence reproducible on demand — ✅/❌
- No change to compiler or runtime public contracts — verified by an
  **empty git diff under `packages/genome-compiler` and
  `packages/genome-runtime`** and by their unchanged test suites
  passing — ✅/❌
- `pnpm check-state` passing — ✅/❌
- Open questions resolved and ADR recorded — ✅/❌
- Board decision recorded in `docs/reviews/` — ✅/❌
- **Project state and governance documents reconciled.** — ✅/❌

## Open Questions (resolved)

All open questions were resolved by the Architecture Board on 2026-07-13
per the Joint Board Recommendation in
`docs/reviews/rfc-0006-board-review.md`; both role reviews reached
identical dispositions independently:

1. **`--grant` ships in v0.1**, with the matching rule and attribution
   semantics as amended above — it is the only non-interactive way to
   demonstrate the approval gate at the CLI boundary, and the Condition 5
   workflow is policy-gated.
2. **The package is `packages/genome-adapter-reference`** — the
   `genome-adapter-*` prefix instantiates RFC-0003's stated convention
   and makes "below the seam" a lexical property of the workspace.
3. **The exported-log format is not pinned in `SPEC/language.md`** —
   it waits for its second consumer (Studio runtime logs or the Phase 6
   observe step), whose RFC pins it in the appropriate spec surface. The
   framing is nonetheless normative *in this RFC* (Event and Final-State
   Output) and frozen by the byte-identity test.
4. **`--clock` is optional and public**, documented as a testing aid — a
   determinism guarantee users cannot verify is a claim, not a contract.

The Board additionally resolved: **`--export-log` ships in v0.1** (it is
the CLI-boundary witness of the replay invariant; tests 6–7 depend on
it), and **`--fail-step` is public**, scoped to the reference adapter as
amended above.

## Alternatives Considered

- **Library-only demonstration** (a documented script invoking the
  runtime in-process): rejected — it repeats the exact evidence gap the
  Phase 0–3 review identified; the project's evidence standard lives at
  the CLI boundary.
- **Interactive TTY approvals** instead of `--grant`: rejected for v0.1 —
  nondeterministic, untestable at the subprocess boundary without PTY
  machinery, and an approval UX deserves its own design when a
  long-running surface exists.
- **Housing the adapter inside `packages/genome-runtime`**: rejected —
  ADR-0004 §8 mandates separate packages, and the seam is only proven by
  a consumer that lives outside the package that defines it.
- **A real provider adapter as the first consumer**: rejected — it would
  smuggle provider assumptions into Phase 3, violate the explicit
  out-of-scope list, and couple the phase-close evidence to network
  nondeterminism.
- **Persistence-first** (export as a durable store with replay-on-start):
  rejected — the Board explicitly excluded persistence from Phase 3 and
  gated it on its first consumer; a write-once export file satisfies the
  "exportable activity log" requirement without becoming a store.
