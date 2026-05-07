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
