# RFC-0002: Genome Compiler

## Status

Accepted

Accepted by the Architecture Board (Product Owner, Chief Architect, Lead
Engineer) on 2026-07-09. The board's vote was **Request Changes**; the
conditions have been incorporated into this document. See
`docs/reviews/RFC-0002-board-decision.md` for the decision record and
`docs/adr/0003-compiler-package-boundary.md` for the recorded architectural
decision.

## Summary

The Genome Compiler transforms Genome documents into stable intermediate representations that can power runtimes, views, workflows, analysis, and tooling.

The compiler is the boundary between declarative organization documents and executable systems.

## Motivation

Subsystems should not interpret raw Genome YAML independently.

Without a compiler boundary:

- validation logic is duplicated
- views may introduce domain logic
- runtime behavior becomes inconsistent
- provider-specific assumptions may leak into the language
- future tooling becomes harder to build

The compiler makes Genome executable while preserving the specification as the source of truth.

## Goals

- reuse the existing parse and schema-validation layer (`@genome/schema`)
- perform semantic validation
- produce an AST
- produce an Organization Graph
- expose a small, fixed set of compilation targets
- centralize interpretation rules

## Non-goals

The compiler does not:

- execute workflows
- run agents
- render the office
- store runtime events
- call external integrations
- make product decisions

## Compiler Pipeline

```text
Genome Document
→ Parse
→ Schema Validation
→ AST
→ Semantic Validation
→ Organization Graph
→ Compilation Targets
```

## Reuse Contract

Stages 1 and 2 already exist in `packages/genome-schema` and MUST be reused,
not reimplemented. The compiler package (`packages/genome-compiler`) depends on
`@genome/schema` for parsing (`parseGenomeDocument`) and schema validation
(`createValidator`). Reimplementing parse or schema validation inside the
compiler is explicitly disallowed — it would recreate the "validation logic is
duplicated" problem this RFC exists to prevent.

Because `@genome/schema` currently parses with `YAML.parse`, source locations
are discarded. Source-location preservation (Stages 1 and 3) is therefore
**best-effort and optional** in v0.1 (see AST decision below). Upgrading the
parse layer to a location-preserving representation (e.g. `YAML.parseDocument` /
CST) is deferred to a future change and is not required for a v0.1 build.

## Stage 1 — Parse

Input:

- YAML
- JSON

Output:

- raw parsed document

Responsibilities:

- parse syntax (via `@genome/schema`)
- report syntax errors
- preserve source locations where possible (best-effort)

## Stage 2 — Schema Validation

Input:

- raw parsed document

Output:

- schema-valid document

Responsibilities:

- required fields
- allowed value types
- structural validation
- version compatibility

This stage is provided by `@genome/schema`'s validator against
`SPEC/schema/genome.schema.json`.

## Stage 3 — AST

Input:

- schema-valid document

Output:

- Genome AST

Responsibilities:

- normalize identifiers
- preserve hierarchy
- attach source mappings when available (`SourceSpan | undefined`)
- represent declared organizational intent

The AST should remain close to the source document. A node is valid without a
source span; spans are attached when the parse layer can supply them.

## Stage 4 — Semantic Validation

Input:

- AST

Output:

- semantically valid AST

Responsibilities:

- reference validation
- ownership validation
- workflow owner validation
- autonomy value validation
- duplicate detection
- unresolved dependency detection

### Reference resolution rules

Dotted references (e.g. `engineering.platform.backend`) resolve by traversing
the organization hierarchy, **skipping the `teams` and `agents` container
keys**. That is, `engineering.platform.backend` resolves to:

```text
departments.engineering.teams.platform.agents.backend
```

A two-segment reference (e.g. `operations.coordinator`) resolves to a
department-level agent:

```text
departments.operations.agents.coordinator
```

Principals in `policies.*.requiresApprovalFrom` are either:

- a `human:<id>` principal (e.g. `human:engineering-manager`), or
- a dotted agent reference resolved by the rules above.

These grammars are specified normatively in `SPEC/language.md`.

### Minimal semantic-validation set for v0.1

The v0.1 compiler MUST implement the following, and they are the acceptance
criteria for Stage 4:

1. `agent.autonomy` is one of `manual`, `supervised`, `autonomous`.
2. Duplicate-identifier detection within a level (no two sibling teams or
   agents sharing an id).
3. `workflow.owner` resolves to an existing agent via the reference rules
   above.
4. `policy.*.requiresApprovalFrom` principals are valid (`human:<id>` or an
   existing agent reference).
5. No dangling references in `workflows`, `objectives`, or `metrics`.

Rules 1 and 2 depend only on structure already present and are implementable
immediately. Rules 3–5 depend on the reference grammar now specified in
`SPEC/language.md`.

## Stage 5 — Organization Graph

Input:

- semantically valid AST

Output:

- immutable Organization Graph

Responsibilities:

- model nodes and relationships
- support dependency analysis
- support impact analysis
- support compilation targets

## Organization Graph

The Organization Graph is the canonical compiled representation. It is
**normative**: the following node and relationship sets are the v0.1 graph
contract (not merely illustrative), so downstream targets and tests have a
stable shape to assert against.

### Node types (v0.1)

- Company
- Department
- Team
- Agent
- Workflow
- Policy
- Integration
- Objective
- Metric
- MemoryStore

### Relationship types (v0.1)

- `belongs_to`
- `owns`
- `uses`
- `requires`
- `triggers`
- `approves`
- `measures`
- `depends_on`

The graph is represented as an adjacency list maintained by the compiler
package itself (no third-party graph library in v0.1).

## Compilation Targets

Targets are plain functions of the form `(OrganizationGraph) => T`. They are a
small, fixed, internal set in v0.1 — **not** a plugin system.

Initial targets (v0.1):

- CLI inspection
- graph output
- documentation output

The following targets are **deferred to future RFCs** tied to their consuming
phases, and are intentionally out of scope here to avoid building ahead of a
live consumer:

- runtime model (Phase 3 — Runtime)
- office layout input (Phase 5 — Office View)
- workflow model (Phase 3 — Runtime)
- memory graph seed (Phase 6 — Self-Improvement Loop)

## Immutability

The Organization Graph is immutable.

Runtime execution produces events.

Durable organizational change happens by producing a new Genome version and recompiling.

## Decisions

These resolve the RFC's original open questions, per the Architecture Board
decision of 2026-07-09.

1. **AST and Organization Graph live in the same package.** A single
   `packages/genome-compiler` with separate `ast/` and `graph/` modules. One
   owner layer; split only if a second consumer of the AST (without the graph)
   appears.
2. **The graph uses a plain adjacency list**, not a third-party graph library,
   to avoid leaking external assumptions into the core.
3. **Source-location metadata is optional** on the AST (`SourceSpan |
   undefined`) and best-effort, decoupling the AST from any specific parser.
4. **Compilation targets are plain functions, not plugins, in v0.1.** A plugin
   system is deferred until a real external consumer exists (a future RFC).
5. **The minimal semantic-validation set for v0.1** is the five rules listed
   under Stage 4.

### Layer partition rule

To prevent Stage 2 and Stage 4 from overlapping or contradicting each other:

- **Schema validation (Stage 2)** owns *shape*: required fields, value types,
  structural validity.
- **Semantic validation (Stage 4)** owns *coherence*: cross-node references,
  ownership, uniqueness, and dependency resolution.
