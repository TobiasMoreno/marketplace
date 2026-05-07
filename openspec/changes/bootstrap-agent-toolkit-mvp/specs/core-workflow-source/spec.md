## ADDED Requirements

### Requirement: Workflow source layout
The toolkit SHALL define each reusable workflow stage under `core/workflows/opsx/<stage>/` with a `meta.yaml` file and a `body.md` file.

#### Scenario: Stage has required source files
- **WHEN** a workflow stage is added to `core/workflows/opsx/`
- **THEN** the stage directory contains both `meta.yaml` and `body.md`

### Requirement: Workflow metadata
Each workflow `meta.yaml` SHALL define the generated skill name, description, trigger guidance, and referenced rules using structured fields.

#### Scenario: Generator reads metadata
- **WHEN** the build script processes a workflow stage
- **THEN** it reads the stage metadata without requiring adapter-specific files to be edited

### Requirement: Shared workflow body
Each workflow `body.md` SHALL contain the reusable instruction body without Claude-specific or Codex-specific wrapper syntax.

#### Scenario: Body is reused by adapters
- **WHEN** the build script generates Claude and Codex skill files
- **THEN** both generated outputs include the same workflow body content from `core/`

### Requirement: Referenced rules
Workflow metadata SHALL allow a stage to reference shared rules under `core/rules/`, and generated skill content SHALL include only the rules referenced by that stage.

#### Scenario: Stage includes selected rules
- **WHEN** a workflow references `sdd` in `meta.yaml`
- **THEN** generated skill content includes the `sdd` rule content and does not include unrelated rules
