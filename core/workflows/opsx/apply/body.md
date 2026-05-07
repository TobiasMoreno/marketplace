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
