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
