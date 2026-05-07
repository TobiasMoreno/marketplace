## 1. Source Structure

- [x] 1.1 Create `package.json` with Node.js 20 engine metadata and `build` / `build:check` scripts.
- [x] 1.2 Create `core/workflows/opsx/{explore,propose,apply,archive}/` with `meta.yaml` and `body.md` files migrated from the existing local OpenSpec skills.
- [x] 1.3 Create `core/rules/` with the shared rule files referenced by workflow metadata.
- [x] 1.4 Create `core/templates/openspec/` with minimal proposal, design, and tasks templates.

## 2. Adapter Generator

- [x] 2.1 Implement `scripts/build.mjs` to read workflow metadata and bodies from `core/`.
- [x] 2.2 Implement rule include resolution so each generated skill includes only rules referenced in its `meta.yaml`.
- [x] 2.3 Generate Claude adapter plugin skill files under `adapters/claude/plugins/opsx-openspec/skills/`.
- [x] 2.4 Generate Codex adapter plugin skill files and `plugin.json` under `adapters/codex/plugins/opsx-openspec/`.
- [x] 2.5 Ensure every generated skill has a generated-file banner with its source workflow path.

## 3. Drift Validation

- [x] 3.1 Implement `scripts/build-check.mjs` or a check mode in `scripts/build.mjs` that compares expected output without rewriting files.
- [x] 3.2 Wire `npm run build:check` to fail with a non-zero exit code and report stale generated paths when drift exists.
- [x] 3.3 Verify `npm run build` followed by `npm run build:check` succeeds.

## 4. Documentation Alignment

- [x] 4.1 Update `README.md` so MVP status and execution commands match the implemented files.
- [x] 4.2 Fix README encoding issues so Spanish accents and diagrams render correctly as UTF-8.
- [x] 4.3 Document that install, marketplace, hooks, MCP, and CI remain outside this MVP.
