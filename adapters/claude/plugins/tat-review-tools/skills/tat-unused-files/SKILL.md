---
# GENERATED FROM core/skills/unused-files - do not edit by hand
name: tat-unused-files
description: "Use when: limpiando el repositorio, buscando archivos muertos, huerfanos, duplicados o agregados por error; verificando scripts, assets, tests, snapshots, docs o prototipos que ya no se usan. Entrega candidatos ordenados de mayor a menor credibilidad de borrado e incluye cuando entraron al git."
license: MIT
disable-model-invocation: true
metadata:
  adapter: claude
  generatedBy: tobias-agent-toolkit
---

# Unused Files

Identifica archivos candidatos a borrar sin romper el repositorio. Tu trabajo es producir una lista priorizada y defendible, no hacer borrados automaticos.

## Objetivo

- Encontrar archivos que probablemente ya no cumplen ninguna funcion real.
- Separar los candidatos por **credibilidad de borrado** de mayor a menor.
- Mostrar para cada archivo **cuando fue incorporado al git** y con que commit entro.
- Explicar la evidencia y los riesgos antes de recomendar borrarlo.

## Alcance por defecto

Si el usuario no define un scope:

1. Revisa el repositorio completo usando solo archivos trackeados por git.
2. Excluye directorios generados o externos obvios como `node_modules`, `dist`, `build`, `.next`, `coverage`, `vendor`, `.git` y similares.
3. Si el repo es grande, acota primero por carpeta, extension o area legacy y explicita el recorte.

## Que cuenta como candidato

- Archivos sin referencias en codigo, tests, docs, config o tooling.
- Duplicados claros reemplazados por una version nueva.
- Scripts legacy que ya no aparecen en flujos, CI, package scripts o docs.
- Assets, fixtures, snapshots o ejemplos huerfanos.
- Prototipos, spikes o archivos temporales que quedaron versionados por error.
- Artefactos generados que fueron comiteados y no deberian vivir en el repo.

## Red flags que bajan la credibilidad

No marques como borrable con alta confianza si el archivo podria entrar por alguno de estos caminos:

- imports o requires dinamicos
- registries, loaders, reflection o discovery por convencion
- rutas, templates, migraciones o seeds
- archivos referenciados por glob en configs o scripts
- assets cargados por nombre desde backend, mobile o frontend
- ejemplos usados en onboarding, docs o tests externos

Si detectas cualquiera de esos casos, baja la credibilidad o deja el archivo en observacion.

## Proceso de investigacion

Para cada candidato, sigue este orden:

1. **Confirma que el archivo existe y esta trackeado**.
2. **Busca referencias textuales** del path, basename, modulo y simbolos exportados.
3. **Busca referencias estructurales** en imports, exports, registries, manifests, rutas, loaders, globs y tooling.
4. **Revisa config y runtime**: `package.json`, `tsconfig`, bundlers, CI, Docker, infra, codegen, docs, scripts de release, task runners.
5. **Busca reemplazos o sucesores** cercanos en la misma carpeta o feature.
6. **Consulta git** para saber cuando fue incorporado y si ha tenido actividad reciente.
7. **Asigna credibilidad de borrado** solo despues de juntar evidencia positiva y negativa.

## Git: cuando fue incorporado

Para cada archivo candidato, intenta obtener su commit de incorporacion con un comando equivalente a:

```bash
git log --diff-filter=A --follow --format='%H|%ad|%an|%s' --date=short -- <path>
```

Usa la entrada mas antigua disponible como "incorporado en git". Si el historial no es concluyente por renames, squash o ausencia de follow, dilo explicitamente.

## Escala de credibilidad

- **Muy alta (90-100)**: sin referencias en codigo/config/tests/docs, sin uso dinamico aparente, y con senales claras de archivo sobrante, duplicado o generado.
- **Alta (75-89)**: evidencia fuerte de desuso, pero con una o dos verificaciones no concluyentes.
- **Media (50-74)**: parece sobrante, pero hay dudas razonables por runtime, globs o ownership difuso.
- **Baja (0-49)**: sospechoso, pero no hay evidencia suficiente para recomendar borrado.

Nunca uses solo "no encontre matches con rg" como prueba suficiente para una recomendacion de alta credibilidad.

## Formato de salida

Entrega la respuesta ordenada de **mayor a menor credibilidad de borrado**.

### Summary

- cuantos candidatos encontraste
- cuantos son Muy alta / Alta / Media / Baja
- scope usado y exclusiones aplicadas

### Candidates

Para cada archivo:

```text
[92 | Muy alta] path/al/archivo.ext
Motivo: por que parece sobrante.
Evidencia: referencias buscadas y resultado; config/runtime revisado; reemplazo si existe.
Incorporado en git: 2024-03-11 | a1b2c3d | "add legacy export script"
Ultima cautela: que podria invalidar el borrado o que falta verificar.
```

### Watchlist

Archivos que parecen sobrantes pero no llegan a recomendacion fuerte. Mantenlos separados de los candidatos de borrado.

### Suggested next steps

- orden de revision manual para confirmar los candidatos Muy alta y Alta
- si conviene borrarlos en lotes pequenos
- si faltan tests o validaciones antes de eliminarlos

## Criterios

- **Preferir precision sobre volumen.** Es mejor devolver 5 candidatos buenos que 40 sospechas flojas.
- **Explicar la evidencia.** Cada recomendacion debe poder defenderse.
- **No borres por defecto.** Solo lista y prioriza, salvo que el usuario pida aplicar borrados.
- **Historial importa.** Si un archivo entro recientemente, dilo; puede ser basura nueva o trabajo en curso.
