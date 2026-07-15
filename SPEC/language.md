# Genome Language Specification v0.1

## Overview

Genome Language is a declarative format for autonomous organizations.

The canonical format is YAML.

JSON is also supported as a compiled representation.

## File Extension

Recommended:

```text
company.genome.yaml
```

Short form:

```text
genome.yaml
```

## Versioning

`genomeVersion` declares the **language version** the document is written in
(currently `0.1`). It does not identify a revision of the organization.

A **Genome revision** identifies the exact content of a compiled document.
The compiler derives it as a content hash of the canonical parsed document;
revisions are derived, never declared, so a Genome document does not carry a
revision field. Each revision compiles to exactly one runtime model (1:1),
and runtime events attribute to the revision they executed under (RFC-0003).

The derivation is normative (RFC-0004): the revision is the lowercase hex
SHA-256 of the canonical JSON serialization — object keys sorted
lexicographically at every level, array order preserved — of the
schema-valid parsed document. Documents that differ only in YAML formatting
or key order share a revision; any semantic difference produces a new one.

A revision transition is *explained* by the `diff` compilation target
(RFC-0005): a structural comparison of the two compiled Organization
Graphs. Because the diff is computed over compiled documents, "no diff"
and "same revision" coincide for everything the graph surfaces; formatting
changes are invisible to both.

## Top-Level Structure

```yaml
genomeVersion: 0.1

company:
  name:
  mission:
  timezone:

departments:

workflows:

policies:

integrations:

memory:

objectives:

metrics:
```

## Identifiers

Identifiers should use kebab-case or snake_case.

Valid examples:

```text
engineering
customer-success
billing_platform
```

Invalid examples:

```text
Engineering Team!
sales ops
```

## References

Nested resources can be referenced using dot notation:

```text
engineering.platform.backend
```

### Reference resolution

A dotted reference traverses the organization hierarchy, **skipping the
`teams` and `agents` container keys**. A three-segment reference addresses a
team-level agent:

```text
engineering.platform.backend
→ departments.engineering.teams.platform.agents.backend
```

A two-segment reference addresses a department-level agent:

```text
operations.coordinator
→ departments.operations.agents.coordinator
```

### Principals

Fields that name an approver or actor — for example
`policies.*.requiresApprovalFrom` — accept either:

- a **human principal** of the form `human:<id>`, where `<id>` is a kebab-case
  or snake_case identifier:

  ```text
  human:engineering-manager
  ```

- an **agent reference** resolved by the dotted-reference rules above.

The wildcard principal `human:*` is **reserved** for the runtime's intrinsic
supervised-approval floor (RFC-0004) and is not a valid identifier, so it can
never be declared in a Genome document.

## Agent Autonomy Levels

Supported values:

- manual
- supervised
- autonomous

If `autonomy` is omitted, it defaults to `manual`. Absence of a declared
autonomy level never grants autonomy (deny-safe).

### Behavioral semantics (v0.1)

- `manual` — the agent acts only on explicit human instruction.
- `supervised` — the runtime requires an approval before the agent initiates
  each workflow it executes (an intrinsic floor), in addition to any
  policy-declared checkpoints (see Policy Scope).
- `autonomous` — the agent acts within policy limits; it is gated only by
  policy-declared checkpoints.

At every level, approval is deny-safe: absence of an approval response blocks
the governed action; it never defaults to granted.

## Policy Scope

A policy declares which resources it governs with `appliesTo`: a list of
workflow identifiers and/or agent references (dotted-reference rules above).

```yaml
policies:
  production-deploy:
    appliesTo:
      - build-feature                   # a workflow id
      - engineering.platform.backend    # an agent reference
    requiresApprovalFrom:
      - human:engineering-manager
```

Semantics:

- A policy applying to a **workflow** gates initiation of that workflow: an
  approval from each declared principal must exist before the workflow starts.
- A policy applying to an **agent** gates every run that agent participates
  in: every workflow initiation *by* that agent, and every initiation *of* a
  workflow that agent executes (in v0.1, a workflow whose `owner` resolves to
  that agent) — whoever initiates it. Autonomy levels are unaffected: they
  continue to govern only the agent's own initiative (see Agent Autonomy
  Levels).
- `appliesTo` entries are policy-declared **checkpoints** in the sense of the
  autonomy semantics above.
- `appliesTo` is optional in v0.1. A policy without it declares an approval
  requirement bound to no action; compilers should surface an *unbound
  policy* diagnostic (warning). The same warning covers a policy that binds
  only `manual` agents owning no workflow — under participation semantics such
  a policy can never gate a run.

## Workflow Triggers

Supported values:

- manual
- event
- schedule
- webhook

If `trigger` is omitted, it defaults to `manual` (deny-safe: an undeclared
trigger never makes a workflow start by itself).

### Executability (v0.1)

All workflow initiation in v0.1 is **explicit**: a start instruction from a
principal. The runtime auto-initiates nothing. `event`, `schedule`, and
`webhook` declare how the organization *intends* the workflow to start, but
v0.1 defines no event selector, schedule expression, or webhook binding —
those grammars are deferred language work, each gated on the phase that
consumes it (RFC-0004). An explicitly started workflow may have any declared
trigger.

## Compilation Targets

Targets are plain, provider-free functions owned by the compiler package
whose inputs are compiled artifacts (RFC-0002; arity is not the boundary —
RFC-0005). The v0.1 set is fixed:

- CLI inspection (`inspect`)
- graph output (`graph`)
- documentation output (`docs`)
- runtime model (`runtime-model`, RFC-0003/RFC-0004 — the compiled artifact
  the runtime consumes)
- structural diff (`diff`, RFC-0005 — compares two compiled documents by
  their Organization Graphs; explains a revision transition)

Office layout, workflow model, and memory graph targets are deferred to the
RFCs of their consuming phases (RFC-0002, Compilation Targets).
