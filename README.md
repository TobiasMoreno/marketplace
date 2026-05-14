# tobias-agent-toolkit

Toolkit personal multi-agente para reutilizar workflows de desarrollo entre Claude Code y Codex.

La idea central es mantener una sola fuente de verdad en `core/` y generar adapters finos para cada CLI. El primer flujo soportado es `opsx`, un wrapper práctico sobre OpenSpec / Spec-Driven Development.

## Quickstart

Instalar los plugins en Claude Code (requiere `gh auth login` o git autenticado):

```bash
claude plugin marketplace add TobiasMoreno/marketplace
claude plugin install tat-core@tat-marketplace
claude plugin install tat-explain-tools@tat-marketplace
claude plugin install tat-opsx-openspec@tat-marketplace
claude plugin install tat-review-tools@tat-marketplace
```

`tat-core` es el plugin de infraestructura (auto-update hook + `/tat-update`). Instalalo siempre.

Si ya tenías una sesión abierta:

```text
/reload-plugins
```

Probar:

```text
/tat-review-tools:tat-review
/tat-opsx-openspec:tat-opsx-explore
/tat-explain-tools:tat-describe-architecture
```

Más detalle (instalación local, preregistro por proyecto, updates, Codex) en [Distribución](#distribución).

## Estado actual

Este repo está en MVP local.

Ya incluye:

- `core/` como fuente editable de workflows, skills, agents, commands, rules y templates.
- Workflows `tat-opsx-explore`, `tat-opsx-propose`, `tat-opsx-apply`, `tat-opsx-review-spec` y `tat-opsx-archive`.
- Cuatro plugins generados: `tat-core`, `tat-explain-tools`, `tat-opsx-openspec`, `tat-review-tools`.
- Routing por plugin mediante el campo `plugin:` en `meta.yaml` y en el frontmatter de agents/commands.
- Generación de adapters para Claude y Codex.
- Validación de drift entre `core/` y `adapters/`.
- Scripts Node.js portables para Windows, macOS y Linux.
- Distribución como marketplace de Claude Code (`tat-marketplace`).
- SessionStart hook de auto-update (`check-updates.mjs`) en `tat-core`.

Fuera de este MVP:

- Instalador `npx`.
- Instalación automática por `npx` para Codex.
- MCP.
- CI.

## Arquitectura

```text
core/
  workflows/opsx/<stage>/   meta.yaml + body.md  → skill por stage
  skills/<name>/            meta.yaml + body.md  → skill standalone
  agents/<name>.md          frontmatter + body   → solo Claude
  commands/<name>.md        frontmatter + body   → solo Claude
  hooks/                    JSON de hooks
  scripts/                  scripts referenciados por hooks/commands
  rules/                    rule chunks reutilizables
  templates/                templates de OpenSpec
        |
        | npm run build
        v
adapters/
  claude/
    CLAUDE.md
    plugins/tat-core/            hooks + scripts + commands + rules
    plugins/tat-explain-tools/   skills
    plugins/tat-opsx-openspec/   skills
    plugins/tat-review-tools/    skills + agents
  codex/
    AGENTS.md
    plugins/tat-core/            rules
    plugins/tat-explain-tools/   skills
    plugins/tat-opsx-openspec/   skills
    plugins/tat-review-tools/    skills
```

## Principios

- Single source of truth: el contenido reutilizable vive en `core/`.
- No duplicar instrucciones a mano entre Claude y Codex.
- Los adapters son generados y se commitean.
- Las rules se incluyen por workflow, no globalmente.
- El tooling es Node.js, no bash.
- La distribución se resuelve después de validar el flujo local.

## Estructura

```text
.claude-plugin/
  marketplace.json              catálogo del marketplace tat-marketplace

core/
  workflows/opsx/{explore,propose,apply,archive}/
    meta.yaml                    plugin: opsx (default para workflows)
    body.md
  skills/{review,openspec-guardian,unused-files}/
    meta.yaml                    plugin: review (default si no se declara)
    body.md
  skills/describe-architecture/
    meta.yaml                    plugin: explain
    body.md
  agents/security-reviewer.md    frontmatter plugin: review (default)
  commands/tat-update.md         frontmatter plugin: core
  hooks/session-start.json       copiado a tat-core/hooks/hooks.json
  scripts/check-updates.mjs      copiado a tat-core/scripts/
  rules/{sdd-rules.md, product-engineer-rules.md, tat-rules.md}
  templates/openspec/

scripts/
  build.mjs                     genera adapters/ desde core/

adapters/                       generado, no editar a mano
  claude/
  codex/

openspec/
  changes/
  specs/

docs/
  claude-plugin-root.md
```

## Desarrollo

Requisitos:

- Node.js 20 o superior.
- OpenSpec CLI si vas a trabajar con changes.

Comandos:

```bash
npm run build
npm run build:check
```

`npm run build` regenera los adapters desde `core/`.

`npm run build:check` compara los adapters generados contra lo que `core/` produciría ahora. Si hay drift, falla sin modificar archivos.

## Cómo editar `core/`

Editá solo `core/`. La estructura tiene cuatro tipos de fuente:

- `core/workflows/opsx/<stage>/{meta.yaml, body.md}` — workflows OPSX (4 stages, llegan a Claude y Codex). Default plugin: `opsx`.
- `core/skills/<name>/{meta.yaml, body.md}` — skills standalone (llegan a Claude y Codex). Default plugin: `review`. Override con `plugin: <id>` en `meta.yaml` (ej. `plugin: explain` para `describe-architecture`).
- `core/agents/<name>.md` — subagents con frontmatter completo (solo Claude). Default plugin: `review`. Override con `plugin: <id>` en el frontmatter.
- `core/commands/<name>.md` — slash commands con frontmatter completo (solo Claude). Default plugin: `review`. Override con `plugin: <id>` en el frontmatter (ej. `tat-update` declara `plugin: core`).

Plugins disponibles como target: `core`, `explain`, `opsx`, `review` (definidos en el dict `PLUGINS` de `scripts/build.mjs`).

Para distribuir un archivo estatico (hook, script, rule) dentro de un plugin, agregalo a `PLUGINS.<id>.extraFiles.{claude,codex}` en `scripts/build.mjs` con `from` (ruta en `core/`) y `to` (ruta dentro del plugin).

Ejemplo de cambio en una skill standalone:

```text
core/skills/review/body.md
core/skills/review/meta.yaml
```

Después regenerá:

```bash
npm run build
npm run build:check
```

No edites a mano archivos bajo `adapters/`. Los archivos generados incluyen un banner como comentario YAML dentro del frontmatter (`# GENERATED FROM ...`).

Para que los usuarios reciban un cambio via `claude plugin update`, hay que bumpear `version` en la entrada correspondiente de `PLUGINS` dentro de `scripts/build.mjs`.

## Plugins publicados

El marketplace publica cuatro plugins:

### `tat-core` — infraestructura del marketplace

| Componente             | Tipo    | Propósito                                                                                            |
| ---------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `tat-update`           | Command | `/tat-update` — aplica updates pendientes del marketplace y reporta el delta. (Solo Claude.)         |
| SessionStart hook      | Hook    | Detecta updates pendientes al iniciar sesión y emite `[tat] N plugin update(s) available`. Best-effort, no bloqueante. (Solo Claude.) |
| `tat-rules.md`         | Rules   | Placeholder personal de convenciones (lenguaje, naming, OPSX, branches, versionado). Personalizalo a tu gusto. |

Es el plugin foundational: instalalo siempre. Sin él, no hay auto-update ni comando manual de update.

### `tat-explain-tools` — entender sistemas existentes

| Skill                       | Propósito                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `tat-describe-architecture` | Diagrama Mermaid + narrativa as-is de un repo/servicio/feature, basado en el código.   |
| `tat-specs-index`           | Index multi-repo de OpenSpec changes (activos, archivados, stale, overlap). Read-only. |

Read-direction: documenta lo que existe, no propone rediseños ni genera código nuevo.

### `tat-opsx-openspec` — flujo OPSX

| Skill              | Propósito                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| `tat-opsx-explore`     | Investigar código, specs y requisitos sin implementar.                                |
| `tat-opsx-propose`     | Crear un change OpenSpec y sus artifacts hasta quedar listo para aplicar.             |
| `tat-opsx-apply`       | Implementar tareas pendientes de un change activo.                                    |
| `tat-opsx-review-spec` | Verificar que el código implementado cumpla con el delta spec antes de archivar.      |
| `tat-opsx-archive`     | Archivar un change completado.                                                        |

### `tat-review-tools` — revisión, gobernanza y limpieza

| Componente              | Tipo  | Propósito                                                                           |
| ----------------------- | ----- | ----------------------------------------------------------------------------------- |
| `tat-review`            | Skill | Revisión de código con hallazgos priorizados por severidad.                         |
| `tat-openspec-guardian` | Skill | Decide si un cambio debe ir por OpenSpec; cita la regla aplicada.                   |
| `tat-unused-files`      | Skill | Auditor de archivos sin uso, ordenados por credibilidad de borrado.                 |
| `tat-security-reviewer` | Agent | Revisor de seguridad invocable con `@agent-tat-review-tools:tat-security-reviewer`. (Solo Claude.) |

Codex solo recibe las skills de cada plugin; agents, commands y hooks son features exclusivas de Claude Code. `tat-core` en Codex solo distribuye `tat-rules.md`.

## Distribución

Este repo funciona como marketplace de Claude Code. El catálogo vive en `.claude-plugin/marketplace.json` (generado por `npm run build`) y publica los plugins `tat-core`, `tat-explain-tools`, `tat-opsx-openspec` y `tat-review-tools`.

### Instalar para Claude Code (desde GitHub)

```bash
claude plugin marketplace add TobiasMoreno/marketplace
claude plugin install tat-core@tat-marketplace
claude plugin install tat-explain-tools@tat-marketplace
claude plugin install tat-opsx-openspec@tat-marketplace
claude plugin install tat-review-tools@tat-marketplace
```

Si ya tenés una sesión abierta:

```text
/reload-plugins
```

### Instalar / desinstalar desde el menú interactivo

Si preferís elegir qué plugins instalar (o desinstalar más tarde) sin tipear cada comando, usá el menú nativo:

```text
/plugin marketplace add TobiasMoreno/marketplace   # solo la primera vez
/plugin
```

Dentro del menú podés navegar `tat-marketplace`, marcar plugins para **Install**, o seleccionar plugins ya instalados para **Disable** (apagar sin borrar) o **Uninstall** (remover). `tat-core` es obligatorio si querés `/tat-update` y el hook de auto-update.

### Instalar desde una ruta local (desarrollo)

```bash
claude plugin marketplace add /ruta/a/tobias-agent-toolkit
claude plugin install tat-core@tat-marketplace
claude plugin install tat-explain-tools@tat-marketplace
claude plugin install tat-opsx-openspec@tat-marketplace
claude plugin install tat-review-tools@tat-marketplace
```

### Preregistrar el marketplace en un repo consumidor

Copiá `.claude/settings.example.json` a `.claude/settings.json` en el repo donde lo querés usar y commiteálo. Cuando alguien confíe en ese repo, Claude Code ya conoce el marketplace y habilita el plugin.

### Updates manuales

```bash
claude plugin marketplace update tat-marketplace
claude plugin update --all
```

O directamente desde la sesión: `/tat-update` (aplica updates pendientes y reporta el delta) seguido de `/reload-plugins`. El comando vive en `tat-core`.

### Auto-update (SessionStart hook)

El plugin `tat-core` incluye `hooks/hooks.json` que dispara `scripts/check-updates.mjs` al iniciar cada sesión. Compara la versión instalada contra el catálogo y, si hay diferencia, emite un `systemMessage` no bloqueante:

```text
[tat] N plugin update(s) available. Run /tat-update to apply.
```

Es best-effort: si falla cualquier paso (red, CLI, JSON), sale en silencio. Para desactivarlo, exportá `TAT_AUTO_UPDATE_DISABLE=1` en tu shell.

Sobre paths dentro del plugin instalado, ver [docs/claude-plugin-root.md](./docs/claude-plugin-root.md).

Importante: Claude Code solo distribuye updates cuando cambia `version` en `plugin.json`. Después de editar `core/`, hay que bumpear el `version` de la entrada correspondiente en el dict `PLUGINS` de `scripts/build.mjs` y regenerar con `npm run build`.

### Instalar para Codex

Codex usa un catalogo propio en `.agents/plugins/marketplace.json`. Como este repo es publico, no hace falta clonarlo en la maquina consumidora: registralo directo desde GitHub.

```bash
codex plugin marketplace add TobiasMoreno/marketplace
```

El marketplace publica los plugins Codex desde:

```text
adapters/codex/plugins/tat-core/
adapters/codex/plugins/tat-explain-tools/
adapters/codex/plugins/tat-opsx-openspec/
adapters/codex/plugins/tat-review-tools/
```

Para actualizar el catalogo despues de cambios:

```bash
codex plugin marketplace upgrade tat-marketplace
```

El contenido de las skills es identico al de Claude, generado desde el mismo `core/`. Codex solo recibe skills; agents, commands y hooks son features exclusivas de Claude Code.

Para desarrollo local del marketplace, tambien se puede registrar una ruta local con `codex plugin marketplace add /ruta/a/tobias-agent-toolkit`, pero ese no es el flujo recomendado para usuarios.

## Roadmap próximo

- Agregar `tat-opsx-review-spec`.
- Script de instalación automática para Codex (`scripts/install-codex.mjs`).
- CI con `npm run build:check` para evitar drift en PRs.
- MCP server propio (ej. `tat-personal-memory`).
- Agregar `tat-architect` y `tat-release-checklist` cuando aplique.

## Licencia

Uso personal. Hacé fork si te sirve.
