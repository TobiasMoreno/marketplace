---
# GENERATED FROM core/commands/tat-update.md - do not edit by hand
name: tat-update
description: "Use when: hay updates pendientes del marketplace tat (anunciados por el SessionStart hook con el mensaje '[tat] N plugin updates available'), o cuando quieres forzar una verificacion + actualizacion manual de los plugins instalados desde tat-marketplace. Aplica los updates pendientes, recarga los plugins en la sesion actual, y reporta que cambio."
disable-model-invocation: true
allowed-tools:
  - Bash(claude plugin update *)
  - Bash(claude plugin list)
  - Bash(claude plugin marketplace update *)
---

# tat-update

Aplica updates pendientes para los plugins instalados desde `tat-marketplace` y recarga la sesion. No es un wrapper ciego: confirma que hay updates antes de tocar nada y reporta el delta version-a-version.

## Pasos

1. **Refrescar el catalogo del marketplace.** Ejecuta:
   ```bash
   claude plugin marketplace update tat-marketplace
   ```
   Si falla (network, repo privado sin token, etc.), reporta el error textual y detente. No pases a paso 2.

2. **Capturar versiones instaladas antes del update.** Ejecuta `claude plugin list` y guarda la lista de plugins instalados de `tat-marketplace` con su version actual. Esto permite reportar el delta despues.

3. **Detectar si hay updates pendientes.** Si la salida del paso 2 (o un `claude plugin list` con flags relevantes) no indica plugins outdated/update-available, **reporta "no hay updates pendientes" y termina sin tocar nada**. No corras `/reload-plugins`.

4. **Aplicar updates.** Si hay updates:
   ```bash
   claude plugin update --all
   ```
   Captura la salida. Si el comando falla:
   - Reporta el plugin que fallo y el error textual.
   - **No** ejecutes `/reload-plugins`.
   - Termina dejando la instalacion en su estado previo.

5. **Recargar la sesion.** Si `claude plugin update --all` tuvo exito, sugiere al usuario que ejecute `/reload-plugins` para que los cambios surtan efecto en la sesion actual. (No puedes ejecutar slash commands directamente desde una skill; el usuario lo hace.)

6. **Reportar el delta.** Imprime una tabla concisa con:
   - Plugin (id publico, ej. `tat-review-tools`)
   - Version anterior
   - Version nueva

   Formato sugerido:
   ```
   Updates aplicados:
     tat-review-tools     0.2.0 -> 0.3.0
     tat-opsx-openspec    0.2.0 -> 0.2.1
   ```

   Recordale al usuario correr `/reload-plugins` para que la sesion actual recoja los cambios.

## Reglas

- **Si no hay updates pendientes**, termina rapido. No corras `update --all` "por si acaso".
- **Si algo falla en cualquier paso**, deten la cadena, reporta el error claro, no recargues plugins. Dejar la instalacion en estado mixto es peor que no actualizar.
- **Nunca** modifiques archivos del usuario, configuraciones globales ni variables de entorno. Esta skill solo orquesta los comandos `claude plugin *`.
- El nombre exacto del comando que se nombra en el SessionStart hook es `/tat-update`. Si renombras este command, actualiza tambien `core/scripts/check-updates.mjs`.
