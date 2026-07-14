# Phase 3 Retrospective

- **Date:** 2026-07-13
- **Prepared by:** Lead Engineer, after the Phase 3 closure commit
- **Scope:** Phase 3 — Runtime Prototype, from the Phase 0–3 transition
  review through RFC-0006 implementation, the close review, and closure.
- **Standing:** a retrospective record, not a decision document. The
  recommendations below bind nothing; any that the Board adopts should be
  recorded through the existing instruments (ADR for process decisions,
  RFC for architecture).

## What worked well

1. **The repository as the only source of truth.** Every engineer and
   review in this phase bootstrapped from documents, not chat history —
   and it held: the RFC-0006 implementation was built by a fresh session
   from `docs/BOOTSTRAP.md` alone, and its Bootstrap Report caught a
   specification defect *before* a line of code was written.
2. **Evidence at the CLI boundary.** Pinning the phase-close standard to
   a reproducible subprocess invocation (Condition 5) turned "done" from
   an assertion into a command anyone can run. The 16-event sequence the
   RFC-0006 review verified in-process was reproduced identically at
   implementation, at the close packet, and at the close review.
3. **Boundary constraints stated before work, not after.** Condition 4's
   three constraints (adapter below the seam, compiled artifacts only,
   no retries/persistence/triggers) plus the empty-git-diff DoD item made
   scope discipline mechanical: the protected diff was checked at every
   stage and stayed empty without any judgment call.
4. **Two independent role reviews before acceptance.** The RFC-0006
   review's parallel Chief Architect / Lead Engineer reads found the
   `settle()` livelock ambiguity and the `--grant` floor contradiction
   independently and converged on identical fixes — defects that would
   have shipped into a normative package contract under a single-reader
   review.
5. **Deny-safe defaults end to end.** No stage of the phase required
   arguing about safety posture: absence of a grant parks a run, exit 3
   names blockage as a first-class outcome, and the reserved `human:*`
   principal stayed ungrantable from the schema through the CLI.

## Governance improvements that emerged

1. **The erratum path.** The phase surfaced a gap: accepted, ratified
   text can be defective in ways that are neither architectural (ADR/RFC
   territory) nor ignorable. The close review handled the first instance
   deliberately — classification (normative, zero behavioral change),
   severability analysis, ordered disposition before closure — and that
   handling is now a worked example any future erratum can cite.
2. **The litmus test for corrections:** *if any test or runtime behavior
   must change, it is not an erratum.* This one sentence did most of the
   classification work in the close review.
3. **Application conditions as review outputs.** The close review didn't
   just decide; it recorded the three conditions its application had to
   satisfy (erratum first; next phase named but not opened; `check-state`
   on the application commit). Ratification could then be executed
   mechanically, without interpretation.
4. **Uncached-evidence discipline** (`pnpm test -- --force`,
   `turbo <task> --force`), inherited from the Phase 0–3 review and now
   named in every Definition of Done, removed a whole class of
   false-positive evidence (turbo replaying cached logs).

## Recommended to become permanent

For Board adoption through the existing instruments; listed in rough
order of value:

1. **The empty-git-diff protected-contract check** for any RFC that
   declares packages untouched — it is the cheapest strong guarantee this
   phase produced.
2. **Bootstrap Report before implementation**, including its
   contradiction section: it caught the case-4 defect at zero cost. The
   protocol exists (`docs/BOOTSTRAP.md`); the practice of *requiring the
   contradiction scan before file edits* is what should be kept.
3. **Uncached evidence incantations named verbatim in every DoD** —
   already de facto standard; worth writing into `docs/GOVERNANCE.md`'s
   evidence rule when next amended.
4. **The erratum instrument itself**, per the close packet's §4 proposal
   (registry, litmus test, Board sign-off, pointer at the corrected
   site). The Phase 3 close review executed the pattern once by hand; a
   short ADR would make it repeatable without re-deriving it. This is
   the one item with an open disposition — the close review explicitly
   deferred it.

## Recommended to remain experimental

Not yet earned; re-evaluate after another phase of use:

1. **Two independent role reviews for every decision.** Invaluable for
   RFC-0006's normative contracts, but the cost is real; smaller
   decisions (the erratum disposition, for instance) were well served by
   a single review with re-executed evidence. Keep the parallel-review
   pattern for RFCs that pin package contracts; stay flexible elsewhere.
2. **The reference adapter's derivability property.** ADR-0008 already
   marks it non-precedential; treat it as an experiment in what the seam
   *can* guarantee, not what adapters *must*.
3. **Exit 3 as a general "blocked, not terminal" convention.** It is
   pinned for `genome run`; whether it generalizes to future commands
   should wait for the second command that needs it (examples before
   abstractions).
4. **The review-packet-then-board-review two-document shape.** It worked
   twice (Phase 0–3, Phase 3 close), but both were phase transitions;
   whether ordinary RFC reviews need a separate packet stage is untested.
5. **`check-state` as the mechanical half of reviews.** It is a tripwire,
   not a proof (its own recorded risk); resist growing it into a
   framework — each new check should keep paying rent.

## Closing note

Phase 3 ended with the runtime's central claim — observed state is
`replay(log)`, by construction — demonstrable by anyone with a terminal,
under contracts that survived two adversarial reviews unchanged. The
phase's most transferable lesson is procedural: every defect found in
this phase was found by *reading against the repository* (bootstrap
contradiction scan, independent reviews, re-executed evidence), never by
trusting a summary. The documents did their job.
