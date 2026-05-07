---
# GENERATED FROM core/workflows/opsx/propose - do not edit by hand
name: tat-opsx-propose
description: "Create an OpenSpec change with proposal, design, specs, and tasks until it is ready for implementation."
license: MIT
compatibility: "Requires openspec CLI."
metadata:
  adapter: claude
  generatedBy: tobias-agent-toolkit
---

# Propose An OpenSpec Change

Create a new OpenSpec change and generate all artifacts required before implementation.

## Input

Use the provided change name if present. Otherwise derive a concise kebab-case name from the user's request. If the requested change is unclear, ask what they want to build or fix before proceeding.

## Steps

1. Create the change:

   ```bash
   openspec new change "<name>"
   ```

2. Inspect artifact order:

   ```bash
   openspec status --change "<name>" --json
   ```

3. For each ready artifact, fetch instructions:

   ```bash
   openspec instructions <artifact-id> --change "<name>" --json
   ```

4. Create each artifact using the returned template, instruction, dependencies, context, and rules. Do not copy internal context or rule blocks into the artifact.

5. Re-run status after each artifact and continue until every artifact required by `applyRequires` is done.

6. Show final status:

   ```bash
   openspec status --change "<name>"
   ```

## Output

Summarize the change name, location, artifacts created, and whether it is ready for implementation.

## Included Rules

# Spec-Driven Development Rules

- Use OpenSpec artifacts as the source of truth for non-trivial changes.
- Explore before proposing when requirements or implementation boundaries are unclear.
- Do not implement a feature before the active change has apply-ready tasks.
- During implementation, read the change context before editing code.
- Mark tasks complete only after the corresponding implementation work is done and verified.

# Product Engineer Rules

- Keep scope small enough to complete and validate in one change.
- Prefer reversible implementation steps and clear migration paths.
- Surface assumptions, risks, and trade-offs before they become hidden coupling.
- Optimize for maintainability and reuse over one-off prompt duplication.
