## ADDED Requirements

### Requirement: Build command
The toolkit SHALL provide an `npm run build` command that generates adapter files from `core/`.

#### Scenario: Build generates adapters
- **WHEN** the user runs `npm run build`
- **THEN** generated Claude and Codex adapter files are written under `adapters/`

### Requirement: Generated file banner
Every generated adapter skill file SHALL include a banner identifying the `core/` source path and warning that the file must not be edited by hand.

#### Scenario: Generated skill is inspectable
- **WHEN** a generated skill file is opened
- **THEN** the first content includes a generated-file warning and source workflow path

### Requirement: Claude adapter output
The build script SHALL generate Claude-compatible plugin skill files under `adapters/claude/plugins/opsx-openspec/skills/`.

#### Scenario: Claude skill generated
- **WHEN** a workflow stage named `opsx-propose` exists in `core/`
- **THEN** the build output contains `adapters/claude/plugins/opsx-openspec/skills/opsx-propose/SKILL.md`

### Requirement: Codex adapter output
The build script SHALL generate Codex-compatible plugin skill files and plugin metadata under `adapters/codex/plugins/opsx-openspec/`.

#### Scenario: Codex skill generated
- **WHEN** a workflow stage named `opsx-propose` exists in `core/`
- **THEN** the build output contains `adapters/codex/plugins/opsx-openspec/skills/opsx-propose/SKILL.md`

#### Scenario: Codex plugin metadata updated
- **WHEN** the build script completes
- **THEN** `adapters/codex/plugins/opsx-openspec/plugin.json` lists the generated skills

### Requirement: Adapter generation preserves existing behavior
Generated OpenSpec workflow skills SHALL preserve the operational steps from the currently checked-in local OpenSpec skills.

#### Scenario: Existing apply workflow is migrated
- **WHEN** the apply workflow is generated
- **THEN** it still instructs the agent to read OpenSpec apply instructions, read context files, implement pending tasks, and mark completed tasks
