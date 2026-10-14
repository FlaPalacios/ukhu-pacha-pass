---
name: cierre-de-fase
description: Cierra y verifica una fase del plan de Ukhu Pacha Pass. Comprueba el criterio de terminado, corre typecheck, lint, build y pruebas, lanza los subagentes revisores y entrega un veredicto APROBADA o NO APROBADA. Usar solo cuando el usuario escriba /cierre-de-fase o pida cerrar o verificar una fase.
disable-model-invocation: true
argument-hint: "[número de fase, opcional]"
---

# Cierre de fase

Tu trabajo ahora no es construir sino auditar lo construido. Sé exigente y honesto. Un cierre complaciente es peor que ninguno, porque el 31 de octubre no hay segunda oportunidad en la puerta.

Fase pedida: $ARGUMENTS

## Pasos

1. **Identifica la fase.** Si arriba hay un número, es esa. Si no, toma la primera fase no aprobada de `docs/progreso.md`. Si hay duda, pregunta al usuario.

2. **Lee el plan.** En `docs/plan.md` toma la fila de la fase en la sección 12 (qué se construye y criterio de terminado) y las pruebas que le correspondan de la sección 13. Arma la lista de criterios a verificar.

3. **Verificaciones técnicas.** Corre las que existan en el proyecto y reporta la salida real, no un resumen de memoria: chequeo de tipos (`npx tsc --noEmit`), lint (`npm run lint`), build (`npm run build`) y pruebas (`npm test`). Si algún script no existe, dilo. No inventes resultados.

4. **Verifica cada criterio con evidencia** (archivo, comando y resultado). No marques "cumplido" por suposición. Lo que solo puede probarse con el usuario (celulares reales, cámara, correo real, base en la nube) se marca "requiere prueba manual" y explicas exactamente qué debe hacer.

5. **Lanza los revisores según la fase.**

   | Fase | Revisión |
   |---|---|
   | 0 | Solo verificar el criterio (URL pública con HTTPS). Sin subagentes |
   | 1, 2, 3, 5 | Subagente `revisor-seguridad` |
   | 4 | `revisor-seguridad` y `probador-puerta` |
   | 6 | Revisar contra la skill `identidad-visual`, pantalla por pantalla, en ancho de celular |
   | 7 | `revisor-seguridad`, `probador-puerta` y toda la lista de la sección 13 |
   | 8 | Confirmar README, script de borrado o anonimización, seed, respaldos y que el CSV abre bien en Excel |

6. **No suavices los hallazgos.** Si un revisor reporta algo CRÍTICO o ALTO, la fase queda NO APROBADA. No lo reclasifiques a la baja para poder aprobar.

7. **Emite el veredicto** con el formato de abajo y agrega una entrada en `docs/progreso.md` (fecha, fase, veredicto, pendientes).

8. **Si es NO APROBADA,** corrige los hallazgos CRÍTICOS y ALTOS y vuelve a correr los pasos 3 a 7. Máximo 3 vueltas. Si sigue sin aprobar, detente y explícale al usuario qué lo bloquea.

9. **No empieces la siguiente fase.** Espera a que el usuario lo indique.

## Formato del resultado

```
## Cierre de fase N: <nombre>
Veredicto: APROBADA | NO APROBADA

### Qué se hizo
### Cómo probarlo (pasos para el usuario)
### Criterios de terminado
| Criterio | Estado | Evidencia |
### Verificaciones técnicas
### Hallazgos de los revisores
### Falta o riesgos
### Calendario
Fecha de hoy frente a las fechas del plan, y si vamos adelantados o atrasados. El congelamiento es el 28 de octubre.
```
