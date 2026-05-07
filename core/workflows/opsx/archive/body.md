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
