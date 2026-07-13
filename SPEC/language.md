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

## Agent Autonomy Levels

Supported values:

- manual
- supervised
- autonomous

## Workflow Triggers

Supported values:

- manual
- event
- schedule
- webhook

## Compilation Targets

A Genome document may be compiled into:

- runtime graph
- office layout
- workflow definitions
- agent registry
- permission map
- knowledge graph
