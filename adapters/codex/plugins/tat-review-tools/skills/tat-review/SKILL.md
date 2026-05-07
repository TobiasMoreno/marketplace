---
# GENERATED FROM core/skills/review - do not edit by hand
name: tat-review
description: "Use when: revisando codigo, pull requests, diffs o cambios recientes antes de merge; buscando bugs, regresiones, riesgos de seguridad, problemas de performance o mejoras de mantenibilidad. Devuelve hallazgos priorizados por severidad con fix sugerido, no comentarios cosmeticos."
license: MIT
disable-model-invocation: true
metadata:
  adapter: codex
  generatedBy: tobias-agent-toolkit
---

# Review

Revisa el scope indicado (diff actual, archivos seleccionados, commits recientes o un PR) y entrega hallazgos accionables priorizados por severidad.

## Scope por defecto

Si el usuario no especifica, usa este orden:

1. Diff sin mergear en la rama actual (`git diff` + `git diff --staged`).
2. Ultimos commits desde que diverge de `main` (`git log main..HEAD`).
3. Archivos abiertos o mencionados por el usuario.

Si el scope es ambiguo o demasiado grande (mas de ~800 lineas de diff), acota antes de revisar y reporta el recorte.

## Objetivos

- Detectar **bugs** potenciales, regresiones y race conditions.
- Revisar **seguridad**: inputs no validados, authz faltante, secretos, side channels.
- Encontrar **performance** y escalabilidad: N+1, locks, llamadas sincronas en hot paths.
- Proponer mejoras de **mantenibilidad** solo cuando cambien claridad o riesgo.

## Forma de trabajo

1. Empieza por lo que rompe en produccion: correctitud y seguridad.
2. Luego performance y DX.
3. Evita comentarios de estilo si no hay riesgo asociado.
4. Cada hallazgo debe citar archivo y linea, no descripciones vagas.

## Severidades

- **Critical** — bug que rompe produccion, leak de datos, authz bypass, perdida de dinero.
- **High** — fallo probable bajo carga o en edge cases previsibles.
- **Medium** — comportamiento incorrecto en caminos secundarios, deuda que amplifica riesgo.
- **Low** — mejoras de mantenibilidad o legibilidad con justificacion.

## Formato de salida

### Findings

Para cada hallazgo:

```
[Severity] Titulo corto
Archivo: path/al/archivo.ext:LINEA
Problema: descripcion concreta de que falla y en que caso.
Fix: cambio propuesto (1-3 lineas o un snippet minimo).
```

Ejemplo:

```
[High] Authorization missing on admin delete endpoint
Archivo: api/admin/users.py:84
Problema: DELETE /admin/users/:id usa solo authenticate_user, no verifica rol admin. Cualquier usuario autenticado puede borrar cuentas ajenas.
Fix: agregar @requires_role("admin") al handler o hacer el check explicito antes de model.delete().
```

### Open questions

Supuestos que, de ser falsos, cambiarian la conclusion. Una linea cada uno.

### Suggested next steps

Orden sugerido para aplicar los fixes y si falta cobertura de tests para alguno de los hallazgos Critical/High.

## Criterios

- **Severidad sobre cantidad.** Diez hallazgos Low no equivalen a uno High.
- **Evidencia sobre hipotesis.** Si no puedes confirmar desde el codigo, va a Open questions, no a Findings.
- **Tests ausentes cuentan** cuando el riesgo los justifica — reportalos como finding con severidad segun el riesgo cubierto.
- **No edites archivos.** Solo propon. El usuario decide que aplicar.
