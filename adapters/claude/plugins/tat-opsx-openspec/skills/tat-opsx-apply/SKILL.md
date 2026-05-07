---
# GENERATED FROM core/workflows/opsx/apply - do not edit by hand
name: tat-opsx-apply
description: "Implement pending tasks from an active OpenSpec change and mark tasks complete as work is finished."
license: MIT
compatibility: "Requires openspec CLI."
metadata:
  adapter: claude
  generatedBy: tobias-agent-toolkit
---

# Apply An OpenSpec Change

Implement tasks from an active OpenSpec change.

## Steps

1. Select the change. Use the named change if provided. If no name is provided and only one active change exists, use it. If multiple active changes exist, ask the user to choose.

2. Check status:

   ```bash
   openspec status --change "<name>" --json
   ```

3. Get apply instructions:

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

4. Read every path listed in `contextFiles`.

5. Work through pending tasks in order. For each task:

   - Announce the task being worked on.
   - Make minimal scoped code changes.
   - Verify the work when possible.
   - Mark the task checkbox complete in `tasks.md`.

6. Pause if a task is unclear, implementation contradicts the design/specs, or verification exposes a blocker.

7. On completion, report completed tasks and current progress. If all tasks are complete, suggest archiving the change.

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
