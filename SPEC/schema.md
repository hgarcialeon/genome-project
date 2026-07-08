# Genome Schema

The canonical machine-readable schema is:

```text
SPEC/schema/genome.schema.json
```

The schema validates Genome v0.1 documents.

Initial validation scope:

- `genomeVersion` is required
- `company.name` is required
- departments are objects
- workflows are objects
- agents may define role, skills, tools, and autonomy

Future schema work:

- strict reference validation
- workflow step validation
- policy validation
- integration provider contracts
- schema version migration
