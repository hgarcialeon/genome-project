# RFC-0001: Genome Language v0.1

## Status

Draft

## Summary

This RFC defines the first version of the Genome Language.

Genome Language v0.1 is a YAML-first declarative language for describing autonomous organizations.

## Top-Level Fields

```yaml
genomeVersion:
company:
departments:
workflows:
policies:
integrations:
memory:
objectives:
metrics:
```

## Required Fields

- `genomeVersion`
- `company.name`

## Company

```yaml
company:
  name: Acme
  mission: Build the world's best billing platform.
  timezone: America/Mexico_City
```

## Departments

```yaml
departments:
  engineering:
    mission: Build and operate the product.
    teams:
      platform:
        agents:
          backend:
            role: Backend Engineer
            skills:
              - node
              - postgres
```

## Agents

Agents represent autonomous or semi-autonomous workers.

```yaml
agents:
  qa:
    role: Quality Engineer
    autonomy: supervised
    skills:
      - playwright
      - exploratory-testing
    tools:
      - github
      - browser
```

## Workflows

Workflows describe repeatable execution patterns.

```yaml
workflows:
  release:
    owner: engineering.platform.backend
    trigger: manual
    steps:
      - plan
      - implement
      - review
      - test
      - deploy
```

## Policies

Policies define constraints and approvals.

```yaml
policies:
  production-deploy:
    requiresApprovalFrom:
      - human:engineering-manager
```

## Integrations

Integrations expose external systems.

```yaml
integrations:
  github:
    type: source-control
    provider: github
```

## Memory

Memory defines what the organization remembers.

```yaml
memory:
  retention: long-term
  stores:
    - decisions
    - architecture
    - incidents
```

## Future Work

- Type system
- Imports
- Modules
- Versioning
- Marketplace packages
- Policy engine
- Runtime compatibility checks
