---
# GENERATED FROM core/workflows/opsx/explore - do not edit by hand
name: tat-opsx-explore
description: "Enter explore mode to investigate code, clarify requirements, and think through options before or during an OpenSpec change."
license: MIT
compatibility: "Requires openspec CLI."
metadata:
  adapter: codex
  generatedBy: tobias-agent-toolkit
---

# Explore Mode

Enter explore mode as a thinking partner. Read files, search code, inspect specs, compare options, and clarify requirements, but do not implement application code.

## Operating Rules

- Start by checking OpenSpec state with `openspec list --json` when relevant.
- If an active change is relevant, read its artifacts before reasoning from memory.
- Use the existing codebase and specs as grounding.
- Ask only the questions needed to remove real ambiguity.
- Offer to capture decisions in OpenSpec artifacts when the discussion crystallizes.
- Do not auto-capture decisions unless the user asks.

## Useful Outputs

- Problem framing.
- Architecture or data-flow sketches.
- Trade-off tables.
- Risks and unknowns.
- Suggested next OpenSpec step.

## Guardrail

If the user asks to implement while in explore mode, recommend creating or applying an OpenSpec change first.

## Included Rules

# Spec-Driven Development Rules

- Use OpenSpec artifacts as the source of truth for non-trivial changes.
- Explore before proposing when requirements or implementation boundaries are unclear.
- Do not implement a feature before the active change has apply-ready tasks.
- During implementation, read the change context before editing code.
- Mark tasks complete only after the corresponding implementation work is done and verified.

# Product Engineer Rules

- Keep scope small enough to complete and validate in one change.
- Prefer reversible implementation steps and clear migration paths.
- Surface assumptions, risks, and trade-offs before they become hidden coupling.
- Optimize for maintainability and reuse over one-off prompt duplication.
