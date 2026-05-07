---
# GENERATED FROM core/workflows/opsx/archive - do not edit by hand
name: tat-opsx-archive
description: "Archive a completed OpenSpec change after checking artifact and task completion."
license: MIT
compatibility: "Requires openspec CLI."
metadata:
  adapter: claude
  generatedBy: tobias-agent-toolkit
---

# Archive An OpenSpec Change

Archive a completed OpenSpec change.

## Steps

1. Select the change. If no change name is provided, list active changes and ask the user to choose.

2. Check artifact completion:

   ```bash
   openspec status --change "<name>" --json
   ```

3. Read `tasks.md` if present and count incomplete checkboxes.

4. If artifacts or tasks are incomplete, warn the user and ask before proceeding.

5. Assess delta specs under `openspec/changes/<name>/specs/` and summarize what will be promoted to main specs.

6. Archive to `openspec/changes/archive/YYYY-MM-DD-<name>/`, preserving `.openspec.yaml`.

7. Report archive location, schema, whether specs were synced, and any warnings.

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
