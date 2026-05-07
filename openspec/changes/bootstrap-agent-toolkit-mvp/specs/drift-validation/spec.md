## ADDED Requirements

### Requirement: Drift check command
The toolkit SHALL provide an `npm run build:check` command that fails when generated adapter output differs from what `core/` would currently generate.

#### Scenario: Generated files are current
- **WHEN** generated adapter files match `core/`
- **THEN** `npm run build:check` exits successfully

#### Scenario: Generated files are stale
- **WHEN** a core workflow changes and adapters are not regenerated
- **THEN** `npm run build:check` exits with a non-zero status and reports drift

### Requirement: Check mode does not rewrite files
The drift check SHALL compare expected generated output without modifying the working tree.

#### Scenario: Check finds drift safely
- **WHEN** `npm run build:check` detects a stale adapter
- **THEN** it reports the stale path and leaves existing files unchanged

### Requirement: Build after check resolves drift
Running `npm run build` after a drift failure SHALL rewrite generated adapters so a subsequent `npm run build:check` succeeds.

#### Scenario: Drift is resolved
- **WHEN** the user runs `npm run build` after a drift failure
- **THEN** a later `npm run build:check` exits successfully
