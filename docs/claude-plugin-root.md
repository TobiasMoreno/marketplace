# `CLAUDE_PLUGIN_ROOT`

`CLAUDE_PLUGIN_ROOT` es una **variable de entorno que Claude Code inyecta automáticamente** cuando ejecuta hooks, scripts y commands de un plugin. **No la generás vos** — la pone el runtime.

## Qué resuelve

Cuando alguien instala un plugin con `claude plugin install tat-opsx-openspec@tat-marketplace`, Claude Code lo descarga y lo guarda en una carpeta cache del usuario, no en una ruta predecible. Por ejemplo:

```text
~/.claude/plugins/cache/tat-marketplace/tat-opsx-openspec/
```

(en Windows: `C:\Users\<user>\.claude\plugins\cache\...`)

Pero el path exacto depende de la versión del plugin, del marketplace, del SO, etc. **No se puede hardcodear** en `hooks.json` ni en ningún script.

Por eso Claude Code expone `CLAUDE_PLUGIN_ROOT`: cuando dispara tu hook, setea esa env var apuntando a la raíz del plugin instalado en esa máquina concreta. Tu script la lee y resuelve archivos relativos a esa raíz.

## Dónde se usa en este repo

En `core/hooks/session-start.json`:

```json
"command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/check-updates.mjs\""
```

Eso significa: "ejecutá Node sobre el archivo `scripts/check-updates.mjs` que está dentro de la raíz de **este plugin**, donde sea que Claude Code lo haya instalado".

Si en vez de eso se usara una ruta relativa como `./scripts/check-updates.mjs`, fallaría porque el cwd cuando dispara el hook no es el plugin — es el directorio del proyecto donde el usuario abrió Claude Code.

## Variantes relacionadas

| Variable | Para qué |
| --- | --- |
| `CLAUDE_PLUGIN_ROOT` | Raíz de **este** plugin (read-only, archivos versionados). |
| `CLAUDE_PLUGIN_DATA` | Carpeta de runtime persistente del plugin (logs, estado). Usala si necesitás guardar algo entre sesiones. |
| `CLAUDE_PROJECT_DIR` | Directorio del proyecto donde el usuario abrió Claude Code. Para hooks que necesitan saber sobre qué repo están corriendo. |

## Regla práctica

> Cualquier path dentro de un plugin que se referencie desde `hooks.json`, `.mcp.json`, scripts, agents o commands → siempre con `${CLAUDE_PLUGIN_ROOT}/...`. Nunca con rutas relativas.
