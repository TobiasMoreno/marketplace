# Tobias Agent Toolkit — Universal Rules

> **Personal rules placeholder.** Este archivo viaja bundled dentro de `tat-core` como referencia de convenciones personales para cualquier repo donde uses los plugins `tat-*`. Personalizalo a tu gusto — esta es la version generica.

`tat-core` no instala este archivo automaticamente en `CLAUDE.md` ni `AGENTS.md` del repo del usuario. Si quieres que aplique cross-repo, referencialo desde tu config global (`~/.claude/CLAUDE.md` o el `AGENTS.md` raiz del workspace).

---

## Lenguaje

- Interaccion con el agente: español neutro latinoamericano.
- Codigo, identificadores y comentarios: ingles.
- Mensajes de commit y PR descriptions: español neutro.
- No usar voseo argentino (`vos`, `tenés`, `dejala`). Usar conjugaciones neutras (`tienes`, `quieres`, `déjala`).

## Naming convention (`tat-` prefix)

Todo identificador publico publicado por `tat-marketplace` lleva el prefijo `tat-`:

- Marketplace: `tat-marketplace`
- Plugins: `tat-core`, `tat-explain-tools`, `tat-opsx-openspec`, `tat-review-tools`, ...
- Skills: `tat-describe-architecture`, `tat-review`, `tat-opsx-explore`, ...
- Commands: `tat-update`, ...
- Agents: `tat-security-reviewer`, namespace `tat-*` reservado.

Las carpetas de codigo pueden omitir el prefijo por ergonomia, pero el `name` en `plugin.json` y `meta.yaml` siempre lleva `tat-`.

## OpenSpec / OPSX

- Cambios funcionales o de comportamiento pasan por OpenSpec change (`tat-opsx-explore` → `tat-opsx-propose` → `tat-opsx-apply` → `tat-opsx-archive`).
- Cambios cosmeticos, renames o refactors sin cambio de comportamiento estan exentos pero deben pasar CI estandar (lint, types, tests, `openspec validate --strict`).
- Artefactos OPSX (`proposal.md`, `design.md`, `spec.md`, `tasks.md`) en ingles.
- Tests son tareas explicitas en `tasks.md`.
- `tat-opsx-archive` corre **antes** del merge. Push despues del archive.

## Branch convention

- OPSX-driven: `change/<type>-<kebab-description>` con `<type> ∈ {feat, imp, fix, chore}`.
  - Ejemplo: `change/feat-add-tat-update-command`
- No-OPSX: `<type>/<slug>`.
  - Ejemplo: `fix/typo`, `chore/bump-deps`

## Versionado de plugins

- Cada `plugin.json` declara `version` explicito.
- Bumpear `version` (en el dict `PLUGINS` de `scripts/build.mjs`) al publicar cambios — sin bump, `claude plugin update` no los recoge.
- Semver: patch para fixes, minor para features additivas, major para breaking changes.

---

> **TODO (personal):** completa esta seccion con tus convenciones especificas a medida que las descubras. Anti-patrones que quieres evitar, herramientas que prefieres, formato de commit messages, etc.
