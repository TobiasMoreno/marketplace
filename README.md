# tobias-agent-toolkit

Toolkit personal multi-agente para reutilizar workflows de desarrollo entre Claude Code y Codex.

La idea central es mantener una sola fuente de verdad en `core/` y generar adapters finos para cada CLI. El primer flujo soportado es `opsx`, un wrapper práctico sobre OpenSpec / Spec-Driven Development.

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
  workflows/opsx/<stage>/
    meta.yaml
    body.md
  rules/
  templates/
        |
        | npm run build
        v
adapters/
  claude/
    CLAUDE.md
    plugins/opsx-openspec/
  codex/
    AGENTS.md
    plugins/opsx-openspec/
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
core/
  workflows/
    opsx/
      explore/
      propose/
      apply/
      archive/
  rules/
    sdd-rules.md
    product-engineer-rules.md
  templates/
    openspec/

scripts/
  build.mjs

adapters/
  claude/
  codex/

openspec/
  changes/
  specs/
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

## Cómo editar una skill

Editá solo `core/`.

Ejemplo:

```text
core/workflows/opsx/propose/body.md
core/workflows/opsx/propose/meta.yaml
```

Después regenerá:

```bash
npm run build
npm run build:check
```

No edites a mano archivos bajo `adapters/`. Los archivos generados incluyen un banner con el path fuente.

## Flujo opsx

| Skill | Propósito |
| --- | --- |
| `tat-opsx-explore` | Investigar código, specs y requisitos sin implementar. |
| `tat-opsx-propose` | Crear un change OpenSpec y sus artifacts hasta quedar listo para aplicar. |
| `tat-opsx-apply` | Implementar tareas pendientes de un change activo. |
| `tat-opsx-archive` | Archivar un change completado. |

## Distribución

Este repo funciona como marketplace de Claude Code. El catálogo vive en `.claude-plugin/marketplace.json` y publica el plugin `tat-opsx-openspec`.

### Instalar para Claude Code (desde GitHub)

```bash
claude plugin marketplace add TobiasMoreno/marketplace
claude plugin install tat-opsx-openspec@tat-marketplace
```

Si ya tenés una sesión abierta:

```text
/reload-plugins
```

### Instalar desde una ruta local (desarrollo)

```bash
claude plugin marketplace add /ruta/a/tobias-agent-toolkit
claude plugin install tat-opsx-openspec@tat-marketplace
```

### Preregistrar el marketplace en un repo consumidor

Copiá `.claude/settings.example.json` a `.claude/settings.json` en el repo donde lo querés usar y commiteálo. Cuando alguien confíe en ese repo, Claude Code ya conoce el marketplace y habilita el plugin.

### Updates manuales

```bash
claude plugin marketplace update tat-marketplace
claude plugin update tat-opsx-openspec@tat-marketplace
```

Después en la sesión: `/reload-plugins`.

### Auto-update (SessionStart hook)

El plugin incluye `hooks/hooks.json` que dispara `scripts/check-updates.mjs` al iniciar cada sesión. Compara la versión instalada contra el catálogo y, si hay diferencia, emite un `systemMessage` no bloqueante:

```text
[tat] N plugin update(s) available. Open /plugin to apply.
```

Es best-effort: si falla cualquier paso (red, CLI, JSON), sale en silencio. Para desactivarlo, exportá `TAT_AUTO_UPDATE_DISABLE=1` en tu shell.

Importante: Claude Code solo distribuye updates cuando cambia `version` en `plugin.json`. Después de editar `core/`, hay que bumpear `pluginVersion` en `scripts/build.mjs` y regenerar.

### Instalar para Codex (manual)

Codex no tiene marketplace nativo equivalente. El plugin generado vive en:

```text
adapters/codex/plugins/tat-opsx-openspec/
```

Para usarlo, registralo en tu config de Codex apuntando a esa ruta (o copialo a la ubicación que tu instalación de Codex espere). El contenido de las skills es idéntico al de Claude, generado desde el mismo `core/`.

## Roadmap próximo

- Agregar `opsx-review-spec`.
- Endurecer schemas de plugin si Claude/Codex requieren metadata adicional.
- Agregar CI para `npm run build:check`.
- Diseñar instalación local para Codex.
- Diseñar publicación marketplace para Claude.

## Licencia

Uso personal. Hacé fork si te sirve.
