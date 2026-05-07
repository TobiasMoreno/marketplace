# tobias-agent-toolkit

Toolkit personal multi-agente para reutilizar workflows de desarrollo entre Claude Code y Codex.

La idea central es mantener una sola fuente de verdad en `core/` y generar adapters finos para cada CLI. El primer flujo soportado es `opsx`, un wrapper práctico sobre OpenSpec / Spec-Driven Development.

## Quickstart

Instalar los plugins en Claude Code (requiere `gh auth login` o git autenticado):

```bash
claude plugin marketplace add TobiasMoreno/marketplace
claude plugin install tat-opsx-openspec@tat-marketplace
claude plugin install tat-review-tools@tat-marketplace
```

Si ya tenías una sesión abierta:

```text
/reload-plugins
```

Probar:

```text
/tat-review-tools:tat-review
/tat-opsx-openspec:tat-opsx-explore
```

Más detalle (instalación local, preregistro por proyecto, updates, Codex) en [Distribución](#distribución).

## Estado actual

Este repo está en MVP local.

Ya incluye:

- `core/` como fuente editable de workflows, rules y templates.
- Workflows `tat-opsx-explore`, `tat-opsx-propose`, `tat-opsx-apply` y `tat-opsx-archive`.
- Generación de adapters para Claude y Codex.
- Validación de drift entre `core/` y `adapters/`.
- Scripts Node.js portables para Windows, macOS y Linux.
- Distribución como marketplace de Claude Code (`tat-marketplace`).
- SessionStart hook de auto-update (`check-updates.mjs`) en el plugin de Claude.

Fuera de este MVP:

- Instalador `npx`.
- Link automático de plugins de Codex.
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
    plugins/tat-opsx-openspec/   skills + hooks + scripts
    plugins/tat-review-tools/    skills + agents + commands
  codex/
    AGENTS.md
    plugins/tat-opsx-openspec/   solo skills
    plugins/tat-review-tools/    solo skills
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
    meta.yaml
    body.md
  skills/{review,openspec-guardian,unused-files}/
    meta.yaml
    body.md
  agents/security-reviewer.md
  commands/tat-update.md
  hooks/session-start.json
  scripts/check-updates.mjs
  rules/{sdd-rules.md, product-engineer-rules.md}
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

- `core/workflows/opsx/<stage>/{meta.yaml, body.md}` — workflows OPSX (4 stages, llegan a Claude y Codex).
- `core/skills/<name>/{meta.yaml, body.md}` — skills standalone (llegan a Claude y Codex).
- `core/agents/<name>.md` — subagents con frontmatter completo (solo Claude).
- `core/commands/<name>.md` — slash commands con frontmatter completo (solo Claude).

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

El marketplace publica dos plugins:

### `tat-opsx-openspec` — flujo OPSX

| Skill | Propósito |
| --- | --- |
| `tat-opsx-explore` | Investigar código, specs y requisitos sin implementar. |
| `tat-opsx-propose` | Crear un change OpenSpec y sus artifacts hasta quedar listo para aplicar. |
| `tat-opsx-apply` | Implementar tareas pendientes de un change activo. |
| `tat-opsx-archive` | Archivar un change completado. |

Incluye además el SessionStart hook de auto-update.

### `tat-review-tools` — revisión, gobernanza y limpieza

| Componente | Tipo | Propósito |
| --- | --- | --- |
| `tat-review` | Skill | Revisión de código con hallazgos priorizados por severidad. |
| `tat-openspec-guardian` | Skill | Decide si un cambio debe ir por OpenSpec; cita la regla aplicada. |
| `tat-unused-files` | Skill | Auditor de archivos sin uso, ordenados por credibilidad de borrado. |
| `tat-security-reviewer` | Agent | Revisor de seguridad invocable con `@agent-tat-review-tools:tat-security-reviewer`. |
| `tat-update` | Command | `/tat-update` — aplica updates pendientes del marketplace y reporta el delta. |

Codex solo recibe las skills del plugin; agents y commands son features exclusivas de Claude Code.

## Distribución

Este repo funciona como marketplace de Claude Code. El catálogo vive en `.claude-plugin/marketplace.json` y publica los plugins `tat-opsx-openspec` y `tat-review-tools`.

### Instalar para Claude Code (desde GitHub)

```bash
claude plugin marketplace add TobiasMoreno/marketplace
claude plugin install tat-opsx-openspec@tat-marketplace
claude plugin install tat-review-tools@tat-marketplace
```

Si ya tenés una sesión abierta:

```text
/reload-plugins
```

### Instalar desde una ruta local (desarrollo)

```bash
claude plugin marketplace add /ruta/a/tobias-agent-toolkit
claude plugin install tat-opsx-openspec@tat-marketplace
claude plugin install tat-review-tools@tat-marketplace
```

### Preregistrar el marketplace en un repo consumidor

Copiá `.claude/settings.example.json` a `.claude/settings.json` en el repo donde lo querés usar y commiteálo. Cuando alguien confíe en ese repo, Claude Code ya conoce el marketplace y habilita el plugin.

### Updates manuales

```bash
claude plugin marketplace update tat-marketplace
claude plugin update tat-opsx-openspec@tat-marketplace
claude plugin update tat-review-tools@tat-marketplace
```

O directamente desde la sesión: `/tat-update` (aplica updates pendientes y reporta el delta) seguido de `/reload-plugins`.

### Auto-update (SessionStart hook)

El plugin `tat-opsx-openspec` incluye `hooks/hooks.json` que dispara `scripts/check-updates.mjs` al iniciar cada sesión. Compara la versión instalada contra el catálogo y, si hay diferencia, emite un `systemMessage` no bloqueante:

```text
[tat] N plugin update(s) available. Run /tat-update to apply.
```

Es best-effort: si falla cualquier paso (red, CLI, JSON), sale en silencio. Para desactivarlo, exportá `TAT_AUTO_UPDATE_DISABLE=1` en tu shell.

Sobre paths dentro del plugin instalado, ver [docs/claude-plugin-root.md](./docs/claude-plugin-root.md).

Importante: Claude Code solo distribuye updates cuando cambia `version` en `plugin.json`. Después de editar `core/`, hay que bumpear el `version` de la entrada correspondiente en el dict `PLUGINS` de `scripts/build.mjs` y regenerar con `npm run build`.

### Instalar para Codex (manual)

Codex no tiene marketplace nativo equivalente. Los plugins generados viven en:

```text
adapters/codex/plugins/tat-opsx-openspec/
adapters/codex/plugins/tat-review-tools/
```

Para usarlos, registralos en tu config de Codex apuntando a esas rutas (o copialos a la ubicación que tu instalación de Codex espere). El contenido de las skills es idéntico al de Claude, generado desde el mismo `core/`. Codex solo recibe skills — agents, commands y hooks son features exclusivas de Claude Code.

## Roadmap próximo

- Agregar `tat-opsx-review-spec`.
- Script de instalación automática para Codex (`scripts/install-codex.mjs`).
- CI con `npm run build:check` para evitar drift en PRs.
- MCP server propio (ej. `tat-personal-memory`).
- Agregar `tat-architect` y `tat-release-checklist` cuando aplique.

## Licencia

Uso personal. Hacé fork si te sirve.
