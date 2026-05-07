# Objetivo

Quiero construir un toolkit personal multi-agente para reutilizar mis workflows de desarrollo con Claude Code y Codex.

No quiero crear dos sistemas separados. Quiero un repo único con un `core` agnóstico y adapters específicos para cada CLI.

## Nombre del repo

`tobias-agent-toolkit`

## Contexto

Trabajo con agentes de IA para desarrollo y quiero tener un flujo reutilizable, mantenible y portable entre herramientas.

Actualmente quiero soportar:

- Claude Code
- Codex

Mi primer caso de uso será OpenSpec / Spec-Driven Development.

Mi flujo personal se llama `opsx` y tiene estas etapas:

1. Explore
2. Propose
3. Apply
4. Archive

## Principio de diseño

La fuente de verdad debe vivir en `core/`.

Los adapters para Claude Code y Codex deben generarse o mantenerse como capas finas que empaquetan el core según las convenciones de cada herramienta.

No quiero duplicar instrucciones manualmente.

## Estructura esperada

Proponé una estructura similar a esta, corrigiéndola si hace falta:

```txt
tobias-agent-toolkit/
  core/
    workflows/
      opsx/
        explore.md
        propose.md
        apply.md
        archive.md
        review-spec.md

    rules/
      sdd-rules.md
      product-engineer-rules.md

    templates/
      openspec/
        proposal.md
        tasks.md
        design.md

    scripts/
      init-openspec.sh
      validate-openspec.sh
      check-pending-changes.sh

  adapters/
    codex/
      AGENTS.md
      plugins/
        opsx-openspec/
          .codex-plugin/
            plugin.json
          skills/
            opsx-explore/
              SKILL.md
            opsx-propose/
              SKILL.md
            opsx-apply/
              SKILL.md
            opsx-archive/
              SKILL.md

    claude/
      CLAUDE.md
      plugins/
        opsx-openspec/
          .claude-plugin/
            plugin.json
          skills/
            opsx-explore/
              SKILL.md
            opsx-propose/
              SKILL.md
            opsx-apply/
              SKILL.md
            opsx-archive/
              SKILL.md

  scripts/
    sync-adapters.sh
    build-codex-adapter.sh
    build-claude-adapter.sh

  docs/
    usage-codex.md
    usage-claude.md
    architecture.md
    roadmap.md

  README.md
```
Qué necesito que hagas

Diseñá el MVP completo.

Quiero que generes:

La arquitectura del repo.
El contenido de los archivos core.
El contenido de las skills para Codex.
El contenido de las skills para Claude Code.
Un AGENTS.md para Codex.
Un CLAUDE.md para Claude Code.
Scripts para sincronizar el core con ambos adapters.
Una guía de instalación/uso para cada herramienta.
Una explicación de qué queda para fase 2.
Una explicación de cuándo tendría sentido agregar MCP.
Restricciones
Uso personal.
No sobreingeniería.
No duplicar conocimiento innecesariamente.
Mantener todo versionable en GitHub.
Priorizar claridad y evolución incremental.
El MVP debe poder usarse rápido.
Si alguna diferencia entre Claude Code y Codex requiere adaptar el contenido, explicala.
Estilo esperado

Actuá como arquitecto de developer tooling y agentic workflows.

Primero diseñá, después generá archivos.

Marcá claramente qué es core compartido y qué es adapter específico.

Separá MVP de fase 2.


---

# Mi recomendación final

Para tu caso, haría esto:

```txt
MVP 1:
Core + adapters de skills para Claude y Codex

MVP 2:
Scripts de sync y validación

MVP 3:
Hooks

MVP 4:
MCP compartido para GitHub/OpenSpec/documentación externa

La decisión importante es esta:

No construyas “skills para Claude” y “skills para Codex” por separado. Construí tu forma de trabajar una sola vez en core/ y después generá los empaquetados para cada herramienta.
