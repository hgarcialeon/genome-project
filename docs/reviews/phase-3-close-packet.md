# Phase 3 Close — Architecture Board Review Packet

- **Process:** `docs/GOVERNANCE.md` → Phase Transition Review / ADR-0007
  (Product Owner · Chief Architect · Lead Engineer)
- **Date prepared:** 2026-07-13
- **Prepared by:** Lead Engineer
- **Status:** Awaiting Board review. This packet decides nothing: it
  assembles evidence and proposals. Phase 3 remains open until the Board
  closes it.
- **Source:** branch `claude/rfc-0006-genome-bootstrap-bt067h`,
  HEAD `53e474f`, clean working tree; all evidence below from uncached
  runs at that commit.
- **Bound by:** the Phase 0–3 review's Condition 4 (boundary constraints)
  and Condition 5 (phase-close evidence standard), and ADR-0008.

## The single question under review

> Does the repository provide executable evidence that RFC-0006 was
> implemented exactly as accepted?

Everything in this packet serves that question. Phase 3's other
deliverables were already classified Done by the Phase 0–3 review; the
RFC-0006 items were the only work holding the phase open.

## 1. Implementation evidence

### Validation commands (uncached, HEAD `53e474f`)

| Command | Result |
|---------|--------|
| `pnpm check-state` | ✅ exit 0 — project state documents consistent with the repository |
| `turbo typecheck --force` | ✅ 5/5 packages, 0 cached |
| `pnpm test -- --force` | ✅ **93/93, 0 cached** — adapter-reference 7, schema 4, compiler 36, runtime 17, CLI 29 |
| `git diff f576593..HEAD -- packages/genome-compiler packages/genome-runtime` | ✅ **empty** (0 lines) |
| `genome run SPEC/examples/company.yaml --workflow build-feature --grant human:engineering-manager` | ✅ exit 0, the Board-verified 16-event sequence, `Run run-1: completed`, 6 steps |

The compiler (36) and runtime (17) suites are byte-identical to the ones
the RFC-0006 board review verified, and pass unchanged — the executable
half of the no-contract-change Definition-of-Done item; the empty git
diff is the mechanical half.

### The eight RFC-0006 evidence cases, mapped to tests

All CLI cases run at the subprocess boundary (spawn, exit codes,
stdout/stderr, parsed JSON) in `packages/genome-cli/src/cli.test.ts`;
the adapter cases in `packages/genome-adapter-reference/src/index.test.ts`.

| RFC case | Test(s) |
|----------|---------|
| 1. Condition 5 verbatim → exit 0 | `drives the designated example workflow to completion (Board Condition 5)` |
| 2. Missing/unknown `--workflow` → exit 2 with reason | `exits 2 when --workflow is missing (parser default overridden)`; `exits 2 with the reason for an unknown workflow`; plus `exits 2 for an unknown option (parser default overridden)` and `exits 2 with the refusal reason verbatim for a reserved principal` |
| 3. Gated, no grant → exit 3, `approval.requested` visible, pending listed | `parks deny-safe at exit 3 when a required approval has no grant` |
| 4. Matching grant → exit 0, attribution in log | `runs the gated workflow with a matching grant, attributed in the log` — under the proposed erratum reading (§3); plus the floor variant `satisfies the supervised intrinsic floor with a concrete human grant` |
| 5. `--fail-step` → exit 1, `agent.task.failed` then `workflow.failed` | `exits 1 on --fail-step with agent.task.failed then workflow.failed` (fixed detail `simulated failure` asserted); qualified-over-bare in the adapter suite (`matches a qualified failStep only in the named workflow`) |
| 6. Export parses as NDJSON; `replay(parsedLog)` equals reported final state | `exports NDJSON whose replay equals the reported final state` — state-level equality, pinned framing (LF, trailing newline) asserted |
| 7. Determinism under `--clock` | `produces byte-identical stdout and export across runs under --clock` (stdout and export asserted separately, stderr excluded); plus `produces identical event sequences without --clock (timestamps excluded)` — the guarantee-1 test from the Lead Engineer's evidence inventory |
| 8. Adapter unit suite with a `test` script | 7 tests in `packages/genome-adapter-reference`; `check-state` rule 4 verifies the script mechanically |

Amendment-specific evidence beyond the eight cases:

- **Settle termination on refusal (amendment 1):** adapter test
  `returns immediately on a refused report, holding the task at the head`
  — drives a real halt between dispatch and settle, then resumes and
  completes with no re-dispatch.
- **Unmatched grants warn without changing exit codes (amendment 4):**
  `warns on stderr for an unmatched grant without changing the exit code`.
- **Grant attribution as operator assertion (amendments 2–3):** the
  granted-path tests assert the `approval.granted` event carries the
  named principal as both source and payload.
- **Parser defaults overridden (amendment 7):** the `run` command carries
  a `commander` `exitOverride` mapping every invocation-level error to
  exit 2 (help/version keep 0); tested for both a missing required option
  and an unknown option.

## 2. Compiler/runtime contracts unchanged — confirmation

- `git diff f576593..HEAD -- packages/genome-compiler packages/genome-runtime`
  is empty. `f576593` is the merge-base with `main` (the commit the
  RFC-0006 board review examined).
- Both packages' test suites are untouched and pass uncached (36 and 17).
- No new event types: the CLI's view of a run derives exclusively from
  `subscribe()` and `state()`; the final-state line is CLI output, not an
  event.
- **Persistence tripwire (amendment 10) verified:** `genome run` accepts
  no log or resume argument; the only `readFileSync` calls in the shipped
  CLI read Genome documents and the schema; the only reader of an
  exported log anywhere in the repository is the replay-equality test.
- The adapter package depends only on `@genome/runtime`
  (`workspace:*`), names no provider, performs no I/O (the export is
  written by the CLI), and instantiates the `genome-adapter-*` naming
  convention (ADR-0008 decision 1).

## 3. Proposed specification erratum (not applied)

Treated as a specification erratum, not an implementation defect. No
change has been made to the RFC text or the runtime; the Board is asked
to approve the correction before it is applied.

- **Affected document:** `RFC/0006-reference-adapter-and-genome-run.md`
- **Affected section:** *Testing and Executable Evidence*, required
  case 4
- **Current wording:**
  > 4. The same workflow with the matching `--grant` → exit 0, with
  >    `approval.granted` and `policy.enforced` attribution in the log.
- **Corrected wording:**
  > 4. The same workflow with the matching `--grant` → exit 0, with the
  >    `approval.granted` event attributing the response to the granting
  >    principal in the log.
- **Reason:** the shipped runtime emits `policy.enforced` only on the
  denial path (`packages/genome-runtime/src/runtime/index.ts`, denial
  branch; asserted by the runtime suite's
  `terminates on denial: approval.denied, policy.enforced, workflow.failed`).
  In v0.1 a `policy.enforced` event therefore implies a denial, which
  terminates the run as `failed` — exit 1. Case 4's required exit 0 and
  its required `policy.enforced` event are mutually unsatisfiable, and
  the RFC itself prohibits the runtime change that could reconcile them.
  The Board-verified 16-event Condition 5 sequence contains no
  `policy.enforced` event, confirming the current wording was a drafting
  slip, not a verified expectation.
- **No runtime behavior change required:** the correction is text-only.
  The shipped test already asserts the corrected reading (with a comment
  recording the deviation), the empty-diff DoD item is unaffected, and no
  event, exit code, or output contract moves.

## 4. Recommendation: a lightweight specification-maintenance mechanism (proposal only)

The erratum above is the first case where an accepted, ratified document
contains a textual defect that is neither an architectural decision nor
new architecture. Governance currently offers only the full RFC/Board
cycle for any change to accepted text, which is disproportionate for a
one-sentence correction — and doing nothing leaves accepted documents
wrong. The Board is asked to consider adopting the following distinction:

| Instrument | Scope | Weight |
|------------|-------|--------|
| **Erratum** | Editorial or normative-wording corrections to accepted documents with **zero behavioral change** — no test, contract, event, or exit code moves | Registry entry + Board sign-off, applied by direct commit citing the erratum |
| **ADR** | Accepted architectural decisions (existing practice: ADR-0001…0008) | Recorded on acceptance of an RFC or a Board ruling |
| **RFC** | New or changed architecture, contracts, or scope | Full lifecycle: draft → Board review → ratification → queue |

Sketch of the erratum mechanism, for discussion: a single
`docs/ERRATA.md` registry where each entry carries an id, the affected
document and section, the wording before and after, the reason, an
explicit no-behavioral-change confirmation, the approving roles, and the
date. The litmus test for eligibility: **if any test or any runtime
behavior would have to change, it is not an erratum** — it is ADR or RFC
territory. Corrected documents gain a one-line pointer to the erratum id
at the corrected site, so accepted text never silently diverges from its
ratified form.

This is a proposal only. No registry, document, or process has been
created; adopting the mechanism requires Board approval and would itself
be recorded as a short ADR, following the ADR-0007 precedent for
governance-process decisions.

## 5. Remaining risks

1. **The erratum is pending.** Until the Board rules, RFC-0006's case 4
   text and its evidence diverge; the divergence is documented in the
   test itself, `IMPLEMENTATION_QUEUE.md`, and §3 here. Approving the
   erratum (or explicitly recording another disposition) should be part
   of this review.
2. **CLI suite runtime grows linearly** (~600 ms per subprocess spawn;
   29 CLI tests ≈ 17 s standalone). The mitigation recorded in the
   RFC-0006 board review (compile once, spawn `node` against `dist/`)
   would introduce `build` scripts no package has today — a change to
   flag before improvising, per the Lead Engineer review.
3. **Export scope-creep pressure stands.** The tripwire holds today
   (§2); every future review touching the CLI should re-verify that no
   shipped code path reads an exported log — any reader is the
   persistence gate's "first consumer" and requires its own RFC.
4. **`dispatched` invites misuse** as an observation surface competing
   with the event log; it is doc-commented as an inspection aid only.
5. **`human:*` shown raw at exit 3** when an intrinsic-floor run parks
   (cosmetic, recorded in the board review; the Condition-5 example's
   gate names a concrete principal, so the common path is unaffected).
6. **Derivability is not precedent** (ADR-0008): the reference adapter's
   derivable-from-log property is stronger than the seam requires; the
   first provider adapter must not be held to it.

## 6. Recommendation on closure

**Recommend: close Phase 3**, subject to the Board's own judgment half
of the review.

- The phase's goal sentence — *execute a simple organization from a
  Genome file* — is demonstrable by anyone at a terminal, at the CLI
  boundary where this project's evidence standard lives (Condition 5,
  reproduced verbatim at HEAD).
- Every Phase 3 roadmap deliverable is classified Done with executable
  evidence; none is Deferred or De-scoped.
- Both binding boundary constraints (Condition 4) held: adapter below the
  seam as a separate package, no provider names above it, compiled
  artifacts only, no state outside `replay(log)`, and no retries,
  persistence, or trigger grammars.
- Compiler and runtime public contracts are unchanged, verified
  mechanically and by their unchanged suites.

The recommendation is conditional on the Board disposing of the §3
erratum in the same review, so the phase does not close on evidence whose
specification text is known-defective.

## Decisions requested from the Board

1. Close Phase 3, or hold it open with stated conditions.
2. Disposition of the §3 erratum (approve the corrected wording, amend
   it, or return it).
3. Disposition of the §4 specification-maintenance proposal (adopt via a
   short ADR, amend, defer, or decline).

## Explicitly not done by this packet

- Phase 3 is **not closed**; `PROJECT_STATE.md` still records it active.
- The erratum is **not applied**; RFC-0006 text is untouched.
- No governance document or process has been introduced; §4 is a
  proposal.
- No Phase 4 work, and no RFC-0007 draft.
