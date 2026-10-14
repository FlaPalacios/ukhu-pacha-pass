# Kit de supervisión de Ukhu Pacha Pass para Claude Code

Deja listo el proyecto para que Claude Code construya por fases y para que otras piezas lo vigilen.

## Qué trae

| Pieza | Para qué sirve |
|---|---|
| `CLAUDE.md` | Reglas cortas que Claude lee en cada sesión (las que no se negocian) |
| `docs/plan.md` | Tu plan completo, que Claude lee al empezar |
| `docs/progreso.md` | Registro de fases cerradas y su veredicto |
| Skill `/cierre-de-fase` | Auditoría al terminar cada fase, con veredicto APROBADA o NO APROBADA. Solo se ejecuta cuando tú la llamas |
| Skill `identidad-visual` | Paleta, tipografías y reglas de diseño. Claude la usa solo al tocar pantallas |
| Subagente `revisor-seguridad` | Revisa seguridad y datos personales. Solo lee, no modifica |
| Subagente `probador-puerta` | Prueba el ingreso atómico y el escáner, con datos ficticios |
| Hook `guardia` | Bloquea claves en el código, archivos `.env` y comandos destructivos |
| Hook `typecheck` | Corre `tsc` tras editar un `.ts` o `.tsx` y devuelve los errores a Claude |
| `.claude/settings.json` | Permisos (lo que Claude puede hacer sin preguntar) y activación de los hooks |

## Instalar

Descomprime el kit, abre una terminal dentro de la carpeta y corre uno de estos comandos.

**Mac, Linux, WSL o Git Bash**
```
./instalar.sh /ruta/a/tu/proyecto
```

**Windows (PowerShell)**
```
.\instalar.ps1 -Destino C:\ruta\a\tu\proyecto
```
Si Windows bloquea el script: `powershell -ExecutionPolicy Bypass -File .\instalar.ps1 -Destino C:\ruta\a\tu\proyecto`

Si el proyecto no existe, se crea la carpeta. Si ya tienes `CLAUDE.md` o `settings.json`, no se pisan: la versión del kit queda al lado con la terminación `.kit` para que las combines.

**A mano:** también puedes copiar el contenido de esta carpeta a la raíz de tu proyecto.

## Dónde se instala cada cosa

| Pieza | Alcance |
|---|---|
| CLAUDE.md, hooks, permisos, subagentes | Solo ese proyecto |
| Skills | Por defecto solo ese proyecto (`.claude/skills/`). Con `--skills-globales` (o `-SkillsGlobales`) van a `~/.claude/skills/` y quedan en todos tus proyectos |

Para este kit recomiendo dejar las skills solo en el proyecto, porque son específicas de la fiesta y la global haría que Claude las considere en tus otros trabajos. Las skills globales sirven para cosas que quieres en todas partes, como tu estilo de commits o de revisión de código.

Las skills de Claude Code son carpetas con un `SKILL.md` y son independientes de las skills de la app web de Claude.

## Primer arranque

1. `cd` al proyecto y abre Claude Code (`claude`, o la terminal de VS Code).
2. Revisa que todo cargó con `/agents`, `/hooks` y `/skills`.
3. Pega este mensaje inicial (reemplaza al de la sección 15.3 del plan):

> Vas a construir "Ukhu Pacha Pass". Lee `CLAUDE.md` y `docs/plan.md` completos antes de escribir código. Trabaja por fases en el orden de la sección 12 y empieza por la fase 0 y la fase 1. Antes de programar, confirma el stack, el modelo de datos y las decisiones pendientes de la sección 3 (usa los valores por defecto indicados si no hay respuesta). Al terminar cada fase corre `/cierre-de-fase` y no avances hasta que el veredicto sea APROBADA. No crees ni edites archivos `.env`: actualiza `.env.example` y dime qué valores debo completar.

## Ciclo de trabajo

Claude construye la fase N, tú corres `/cierre-de-fase`, los subagentes revisan, los hooks cuidan lo mecánico y tú apruebas el paso a la fase siguiente. Si más adelante lo dejas trabajando en modo `/goal` o en bucle, la condición de término debe ser el veredicto APROBADA del cierre, con un tope de iteraciones.

## Cosas que conviene saber

- Los hooks necesitan Node.js (ya lo tienes por Next.js). En Windows, Claude Code ejecuta los hooks con un shell tipo bash; si no corren, avísale a Claude Code con el error exacto.
- El hook `typecheck` puede quejarse a mitad de un cambio grande, cuando varios archivos aún no coinciden. Es normal y se resuelve al terminar la edición.
- `settings.json` deja a Claude editar archivos sin preguntar. Si prefieres aprobar cada edición, borra las líneas `"Edit"` y `"Write"` de `allow`. Ni `git push` ni instalar paquetes fuera de la lista se ejecutan sin tu permiso.
- Los hooks detectan patrones conocidos, no garantizan que no haya fallas. Los subagentes tampoco son infalibles. Las pruebas con celulares reales, cámara, QR impreso y corte de internet las tienes que hacer tú. El `probador-puerta` te deja la lista.
- Calendario: hoy es 13 y el congelamiento es el 28 de octubre. Si una fase se atrasa, recorta el pulido visual antes que la seguridad o la puerta.
