## Why

The README defines a portable agent toolkit architecture, but the repository still contains hand-maintained Claude and Codex skill copies instead of a reusable source-of-truth workflow. This change establishes the first executable MVP so future OpenSpec workflows can be edited once and generated consistently for both CLIs.

## What Changes

- Introduce a `core/` source tree for shared workflow bodies, metadata, rules, and templates.
- Migrate the existing OpenSpec skills into `core/workflows/opsx/*`.
- Add Node.js build tooling that generates Claude and Codex adapters from `core/`.
- Commit generated adapters with a clear generated-file banner.
- Add a drift check so generated adapters can be validated against `core/`.
- Add minimal package scripts needed to build and check the toolkit locally.
- Keep one-shot install, marketplace publishing, hooks, and MCP out of this MVP.

## Capabilities

### New Capabilities
- `core-workflow-source`: Defines how reusable workflow content is represented in `core/`.
- `adapter-generation`: Defines how Claude and Codex adapter files are generated from `core/`.
- `drift-validation`: Defines how the repo detects when generated adapters are out of sync with `core/`.

### Modified Capabilities

## Impact

- Adds `core/`, `adapters/`, `scripts/`, and `package.json`.
- Replaces duplicated hand-maintained skill content with generated adapter output.
- Keeps existing `.claude/` and `.codex/` project-local skill folders untouched unless implementation confirms they should be removed or replaced.
- Requires Node.js 20 or newer for local build and validation scripts.
