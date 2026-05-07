## Context

The repo currently has project-local Claude and Codex OpenSpec skills under `.claude/skills` and `.codex/skills`, plus a README describing a future toolkit repository layout. There is no `core/` source tree, no generated `adapters/`, no package manifest, and no build/check tooling.

The MVP must turn the README architecture into a working local generator without taking on distribution concerns. The immediate user is the toolkit author, not an external installer.

## Goals / Non-Goals

**Goals:**
- Establish `core/` as the editable source of workflow instructions.
- Generate Claude and Codex adapter skill files from the same core workflow definitions.
- Provide repeatable `npm run build` and `npm run build:check` commands.
- Keep the generated adapters committed and visibly marked as generated.
- Preserve the existing OpenSpec skill behavior while moving it into the new architecture.

**Non-Goals:**
- Publishing an npm package.
- Adding Claude marketplace installation.
- Installing Codex plugins globally.
- Adding hooks, MCP servers, or CI.
- Rewriting OpenSpec itself.

## Decisions

1. Use one workflow directory per stage under `core/workflows/opsx/<stage>/`.

   Rationale: This mirrors the README, keeps each skill independently editable, and maps cleanly to generated skill folders. The alternative was one monolithic YAML/JSON file, but that would make long Markdown prompts harder to review.

2. Store metadata in `meta.yaml` and prompt/playbook content in `body.md`.

   Rationale: Metadata is structured and needed by the generator; body content is Markdown and should stay readable. The alternative was frontmatter in one `SKILL.md`, but that would couple core too closely to one adapter format.

3. Implement build tooling in plain Node.js ESM using only built-in modules plus a small YAML dependency if needed.

   Rationale: Node matches the README's Windows-first constraint and keeps scripts portable. Avoiding shell scripts removes Git Bash/WSL assumptions.

4. Treat `adapters/` as generated output and compare generated output in-memory for drift.

   Rationale: Committing generated adapters makes the repo installable and inspectable. `build:check` prevents manual edits or stale generation.

5. Leave `.claude/` and `.codex/` project-local folders untouched during the MVP.

   Rationale: They may be active local tooling. The new generated adapters should live under `adapters/` first; cleanup or replacement can be a later deliberate change.

## Risks / Trade-offs

- Generated output could diverge from current local skills → Mitigate by migrating existing skill bodies first and running `build:check`.
- YAML parsing adds dependency surface → Mitigate with a focused dependency and locked package metadata, or a constrained parser if metadata remains simple.
- Claude and Codex plugin schemas may evolve → Mitigate by keeping adapter formatting isolated in `scripts/build.mjs`.
- Keeping generated files committed duplicates content in git → Mitigate with generated banners and drift validation.
