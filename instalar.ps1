# Instalador del kit de Ukhu Pacha Pass para Claude Code (Windows PowerShell).
# Uso:  .\instalar.ps1 -Destino C:\ruta\al\proyecto [-SkillsGlobales]
param(
  [Parameter(Mandatory = $true)][string]$Destino,
  [switch]$SkillsGlobales
)
$ErrorActionPreference = "Stop"
$Aqui = Split-Path -Parent $MyInvocation.MyCommand.Path

New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$Destino = (Resolve-Path $Destino).Path
Write-Host "Instalando en: $Destino"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "AVISO: no encuentro Node.js. Los hooks lo necesitan."
}

function Copiar-Seguro($Origen, $Dest, $Alterno) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Dest) | Out-Null
  if (Test-Path $Dest) {
    Copy-Item $Origen $Alterno -Force
    Write-Host "  Ya existe $(Split-Path -Leaf $Dest). Dejé la versión del kit como $(Split-Path -Leaf $Alterno) para que las combines."
  } else {
    Copy-Item $Origen $Dest
    Write-Host "  Creado $Dest"
  }
}

Copiar-Seguro "$Aqui\CLAUDE.md" "$Destino\CLAUDE.md" "$Destino\CLAUDE.kit.md"
Copiar-Seguro "$Aqui\docs\plan.md" "$Destino\docs\plan.md" "$Destino\docs\plan.kit.md"
Copiar-Seguro "$Aqui\docs\progreso.md" "$Destino\docs\progreso.md" "$Destino\docs\progreso.kit.md"
Copiar-Seguro "$Aqui\.claude\settings.json" "$Destino\.claude\settings.json" "$Destino\.claude\settings.kit.json"

New-Item -ItemType Directory -Force -Path "$Destino\.claude\hooks" | Out-Null
New-Item -ItemType Directory -Force -Path "$Destino\.claude\agents" | Out-Null
Copy-Item "$Aqui\.claude\hooks\*.mjs" "$Destino\.claude\hooks\" -Force
Copy-Item "$Aqui\.claude\agents\*.md" "$Destino\.claude\agents\" -Force
Write-Host "  Hooks y subagentes instalados en el proyecto"

if ($SkillsGlobales) {
  Write-Host "  AVISO: estas skills son específicas de Ukhu Pacha Pass. En modo global estarán disponibles en TODOS tus proyectos."
  $SkillsDest = Join-Path $HOME ".claude\skills"
} else {
  $SkillsDest = Join-Path $Destino ".claude\skills"
}
New-Item -ItemType Directory -Force -Path $SkillsDest | Out-Null
Copy-Item "$Aqui\.claude\skills\*" $SkillsDest -Recurse -Force
Write-Host "  Skills instaladas en: $SkillsDest"

$gi = Join-Path $Destino ".gitignore"
if (-not (Test-Path $gi)) { New-Item -ItemType File -Path $gi | Out-Null }
$actual = Get-Content $gi -ErrorAction SilentlyContinue
foreach ($linea in @(".env", ".env.local", ".env.*.local", "node_modules", ".next")) {
  if ($actual -notcontains $linea) { Add-Content $gi $linea }
}
Write-Host "  .gitignore revisado"

Write-Host ""
Write-Host "Listo. Siguiente paso:"
Write-Host "  cd `"$Destino`""
Write-Host "  claude"
Write-Host "Dentro de Claude Code puedes revisar lo instalado con /agents, /hooks y /skills."
