---
# GENERATED FROM core/skills/specs-index - do not edit by hand
name: tat-specs-index
description: "Use when: you work across multiple repos and need a unified view of OpenSpec changes (active and archived) without designating any one repo as the source of truth. Walks each repo's openspec/ directory and produces a cross-repo index of changes, stale entries, and overlap signals. Read-only — never modifies any repo."
license: MIT
disable-model-invocation: true
metadata:
  adapter: codex
  generatedBy: tobias-agent-toolkit
---

# Multi-Repo OpenSpec Index

Read-direction skill: aggregates OpenSpec changes across multiple repositories into a single navigable index. Solves the multi-repo visibility problem ("which changes are in flight, where, and are any of them related?") without making any repo the central source of truth. This skill reads — it never writes, moves, or links spec files across repos.

## When to use this skill

- You maintain or coordinate work across several repos that each use OpenSpec.
- You need a portfolio view of in-flight changes before a planning session, demo, or release cut.
- You suspect two repos are proposing overlapping changes and want to confirm.
- You want to find stale changes (open too long, never archived) without opening each repo manually.

Do not use this skill to:

- Author or modify a change — use `tat-opsx-propose` / `tat-opsx-apply` in the owning repo.
- Move specs between repos. Specs live next to the code they describe.

## Input

Ask the user (or infer from context) one of:

- A list of repo paths.
- A parent directory containing multiple repos (the skill will detect `openspec/` subfolders inside immediate children).
- An explicit allowlist + denylist if the parent dir has unrelated repos mixed in.

If none is given, ask for a parent path before scanning.

## Working approach

1. **Discover repos.** For each candidate repo, confirm it has an `openspec/` directory. Skip silently if not.

2. **Read each repo's index.** Per repo, list:

   - Active changes under `openspec/changes/<name>/` (folders that are not `archive/`).
   - Archived changes under `openspec/changes/archive/`.
   - Optional: count incomplete checkboxes in `tasks.md` for active changes.
   - Optional: last-modified date of the change folder (filesystem mtime is enough — do not require git).

3. **Detect staleness.** Flag active changes where the most recent file under the change folder is older than a threshold. Default threshold: 30 days. Let the user override.

4. **Detect overlap signals.** Heuristic only, never authoritative:

   - Same kebab-case change name across repos (e.g., two repos both have a change named `add-rate-limiter`).
   - Significant keyword overlap in `proposal.md` first paragraph (top-3 nouns) — only mention if the match is strong.

5. **Do not invent links.** If a relationship is inferred, mark it `(inferred)` and explain the evidence.

## Output format

### 1. Summary

One line: `N repos scanned · A active changes · S stale · O overlap signals`.

### 2. Per-repo table

```text
repo                    active   archived   stale (>Nd)
----------------------  -------  ---------  -----------
acme-api                3        12         1
acme-web                1        4          0
acme-jobs               0        7          0
```

### 3. Active changes

Grouped by repo:

```text
acme-api/
  - add-rate-limiter        (open 14d, 2/5 tasks)
  - migrate-auth-tokens     (open 41d, 0/8 tasks)   [stale]
```

Cite the change path so the user can `cd` into it.

### 4. Overlap signals (if any)

```text
- "add-rate-limiter" exists in: acme-api, acme-gateway
  evidence: same change name, both proposals mention "token bucket" (inferred)
```

### 5. Open questions

Anything the scan could not determine (e.g., "acme-legacy has openspec/ but no changes/ folder — unclear if intentional").

## Criteria

- **Read-only, always.** Never write, move, rename, or link spec files. This skill produces a report.
- **No central source of truth.** Each repo owns its specs. The index is a view, not storage.
- **Cite paths.** Every change reference includes the repo + change folder so the user can navigate directly.
- **Mark inferences.** Overlap and relatedness are heuristics — label them `(inferred)`.
- **Stop early if scope is unclear.** If "all my repos" is ambiguous, ask for a parent path or an explicit list before scanning.
