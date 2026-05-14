# Review An Implemented Change Against Its Spec

Bridge between `tat-opsx-apply` and `tat-opsx-archive`. Verifies the code that was actually written matches the approved delta specs in an OpenSpec change. Read-direction: produces a findings report, does not modify code or specs.

## When to use this skill

- All tasks in `tasks.md` are marked complete, but you have not archived yet.
- A reviewer asks "does the implementation actually match what we approved?".
- Before promoting delta specs to main specs, confirm the code agrees with them.

Do not use this skill to *write* missing implementation — that is `tat-opsx-apply`. Do not use it to redesign the spec — that is `tat-opsx-propose`.

## Input

Use the provided change name if present. If none is provided and only one active change exists, use it. If multiple active changes exist, list them and ask the user to choose.

## Steps

1. Confirm the change is in a reviewable state:

   ```bash
   openspec status --change "<name>" --json
   ```

   Required artifacts (proposal, design, specs, tasks) should be present and `tasks.md` should have most/all checkboxes complete. If artifacts are missing, stop and tell the user to finish proposing/applying first.

2. Read the delta specs under `openspec/changes/<name>/specs/`. These are the contract the implementation must satisfy.

3. For each requirement / acceptance criterion in the delta specs, locate the implementing code. Read the actual files — do not infer from filenames or task names.

4. Categorize each requirement into one of:

   - **Met** — code clearly implements the requirement.
   - **Partial** — implementation exists but misses a stated condition, error path, or edge case from the spec.
   - **Missing** — no code change addresses this requirement.
   - **Drift** — code does something the spec did not approve (extra behavior, different contract, scope creep).

5. Check tests separately: for each acceptance criterion that implies observable behavior, confirm at least one test exercises it. Tests-not-found is a Partial, not Missing, unless the spec explicitly required them.

6. Read `tasks.md` and flag any task marked complete whose corresponding code change you could not find.

## Output

A findings report with this structure:

### 1. Summary

One sentence per category count: `N met / M partial / K missing / D drift`.

### 2. Findings

One bullet per non-Met item:

```text
- [Partial] <requirement summary> — <file:line>: <what is missing>
- [Drift]   <unexpected behavior> — <file:line>: <which spec section it violates>
```

Cite `file:line` whenever possible. If a finding is inferred without a code reference, mark it `(inferred)`.

### 3. Tasks vs code

Tasks marked complete in `tasks.md` whose code change could not be located. Empty list is the happy path.

### 4. Verdict

One of:

- **Ready to archive** — only Met items, optionally a few low-severity Partials the user accepts.
- **Needs more work** — any Missing or Drift, or Partials the user wants closed. Suggest going back to `tat-opsx-apply` or, for Drift, possibly `tat-opsx-propose` to amend the spec.

## Criteria

- **Evidence over claims.** Every finding cites `file:line` or is marked `(inferred)`.
- **Spec is the contract.** If code disagrees with the spec, that is Drift — not a "the spec was wrong" call to make here. Surface it; let the user decide whether to amend the spec or change the code.
- **Do not modify anything.** This skill reads. Fixing belongs to `tat-opsx-apply`; amending the spec belongs to `tat-opsx-propose`.
- **Stop early if the spec itself is ambiguous.** If a requirement cannot be checked because the spec does not pin down the behavior, list it under findings as `(ambiguous spec)` and recommend the user clarify before archive.
