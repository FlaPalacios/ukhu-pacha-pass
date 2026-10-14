#!/usr/bin/env bash
# Instalador del kit de Ukhu Pacha Pass para Claude Code (Mac, Linux, WSL, Git Bash).
# Uso:  ./instalar.sh /ruta/al/proyecto [--skills-globales]
set -e

AQUI="$(cd "$(dirname "$0")" && pwd)"
DESTINO=""
GLOBALES=0
for a in "$@"; do
  case "$a" in
    --skills-globales) GLOBALES=1 ;;
    *) DESTINO="$a" ;;
  esac
done

if [ -z "$DESTINO" ]; then
  echo "Uso: ./instalar.sh /ruta/al/proyecto [--skills-globales]"
  exit 1
fi

mkdir -p "$DESTINO"
DESTINO="$(cd "$DESTINO" && pwd)"
echo "Instalando en: $DESTINO"

command -v node >/dev/null 2>&1 || echo "AVISO: no encuentro Node.js. Los hooks lo necesitan."

# Copia un archivo solo si no existe. Si existe, deja la versión del kit al lado.
copiar_seguro() {
  origen="$1"; destino="$2"; alterno="$3"
  mkdir -p "$(dirname "$destino")"
  if [ -e "$destino" ]; then
    cp "$origen" "$alterno"
    echo "  Ya existe $(basename "$destino"). Dejé la versión del kit como $(basename "$alterno") para que las combines."
  else
    cp "$origen" "$destino"
    echo "  Creado $destino"
  fi
}

copiar_seguro "$AQUI/CLAUDE.md" "$DESTINO/CLAUDE.md" "$DESTINO/CLAUDE.kit.md"
copiar_seguro "$AQUI/docs/plan.md" "$DESTINO/docs/plan.md" "$DESTINO/docs/plan.kit.md"
copiar_seguro "$AQUI/docs/progreso.md" "$DESTINO/docs/progreso.md" "$DESTINO/docs/progreso.kit.md"
copiar_seguro "$AQUI/.claude/settings.json" "$DESTINO/.claude/settings.json" "$DESTINO/.claude/settings.kit.json"

# Hooks y subagentes (siempre en el proyecto; se actualizan si ya estaban)
mkdir -p "$DESTINO/.claude/hooks" "$DESTINO/.claude/agents"
cp "$AQUI"/.claude/hooks/*.mjs "$DESTINO/.claude/hooks/"
cp "$AQUI"/.claude/agents/*.md "$DESTINO/.claude/agents/"
echo "  Hooks y subagentes instalados en el proyecto"

# Skills: en el proyecto o en tu Claude general
if [ "$GLOBALES" -eq 1 ]; then
  echo "  AVISO: estas skills son específicas de Ukhu Pacha Pass. En modo global estarán disponibles en TODOS tus proyectos."
  SKILLS_DEST="$HOME/.claude/skills"
else
  SKILLS_DEST="$DESTINO/.claude/skills"
fi
mkdir -p "$SKILLS_DEST"
cp -r "$AQUI"/.claude/skills/* "$SKILLS_DEST/"
echo "  Skills instaladas en: $SKILLS_DEST"

# Que los secretos no suban a git
GI="$DESTINO/.gitignore"
touch "$GI"
for linea in ".env" ".env.local" ".env.*.local" "node_modules" ".next"; do
  grep -qxF "$linea" "$GI" || echo "$linea" >> "$GI"
done
echo "  .gitignore revisado"

echo ""
echo "Listo. Siguiente paso:"
echo "  cd \"$DESTINO\""
echo "  claude"
echo "Dentro de Claude Code puedes revisar lo instalado con /agents, /hooks y /skills."
