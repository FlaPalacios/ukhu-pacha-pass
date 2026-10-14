// Hook PreToolUse de Ukhu Pacha Pass.
// Bloquea secretos en el código, archivos .env y comandos destructivos.
// Código de salida 2 = bloquear la acción y explicarle el motivo a Claude.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

let entrada = {};
try {
  entrada = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0); // sin datos legibles no se bloquea nada
}

const herramienta = entrada.tool_name ?? "";
const datos = entrada.tool_input ?? {};

function bloquear(motivo) {
  console.error(`BLOQUEADO por el guardia del proyecto: ${motivo}`);
  console.error("Corrige el problema de fondo en lugar de intentar saltarte el bloqueo.");
  process.exit(2);
}

const esEnvReal = (nombre) =>
  /^\.env(\..+)?$/.test(nombre) && nombre !== ".env.example";

if (herramienta === "Bash") {
  const cmd = String(datos.command ?? "");

  // rm -rf solo se permite para limpiar .next o node_modules
  if (/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b/.test(cmd)) {
    const permitido = /\brm\s+-rf\s+(\.\/)?(\.next|node_modules)\/?(\s|$)/.test(cmd);
    if (!permitido) bloquear("rm -rf solo se permite sobre .next o node_modules.");
  }

  const peligrosos = [
    [/\bdrop\s+(table|database|schema)\b/i, "DROP sobre la base de datos"],
    [/\btruncate\s+table\b/i, "TRUNCATE sobre la base de datos"],
    [/\bgit\s+push\b.*(--force|\s-f(\s|$))/, "git push forzado"],
    [/\bgit\s+reset\s+--hard\b/, "git reset --hard"],
    [/\bgit\s+add\b.*\.env(?!\.example)/, "agregar un archivo .env a git"],
    [/\b(cat|type|more|less|head|tail|grep|rg|sed|awk)\b[^|;&\n]*\.env(?!\.example)/, "leer un archivo .env"],
  ];
  for (const [patron, nombre] of peligrosos) {
    if (patron.test(cmd)) bloquear(nombre + ".");
  }

  // Antes de un commit, revisar que no haya .env en lo preparado
  if (/\bgit\s+commit\b/.test(cmd)) {
    try {
      const preparados = execSync("git diff --cached --name-only", {
        encoding: "utf8",
        cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      })
        .split(/\r?\n/)
        .filter(Boolean);
      const malos = preparados.filter((f) => esEnvReal(f.split("/").pop() ?? ""));
      if (malos.length) bloquear(`hay archivos .env preparados para commit: ${malos.join(", ")}`);
    } catch {
      // si git falla (por ejemplo, aún no hay repositorio) no se bloquea
    }
  }
}

if (["Write", "Edit", "MultiEdit"].includes(herramienta)) {
  const ruta = String(datos.file_path ?? "").replaceAll("\\", "/");
  const nombre = ruta.split("/").pop() ?? "";

  if (esEnvReal(nombre)) {
    bloquear(
      `no se editan archivos ${nombre}. Actualiza .env.example y pídele al usuario que complete los valores reales.`,
    );
  }

  const piezas = [datos.content, datos.new_string];
  if (Array.isArray(datos.edits)) piezas.push(...datos.edits.map((e) => e?.new_string));
  const contenido = piezas.filter((p) => typeof p === "string").join("\n");

  if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(contenido)) {
    bloquear("parece haber una clave (JWT) escrita directamente en el código.");
  }
  if (/NEXT_PUBLIC_(SUPABASE_SERVICE|SERVICE_ROLE|GMAIL|GUARD|SESSION)/.test(contenido)) {
    bloquear("una variable secreta con prefijo NEXT_PUBLIC_ quedaría expuesta al navegador.");
  }
  if (
    /(['"])use client\1/.test(contenido) &&
    /SERVICE_ROLE|GMAIL_APP_PASSWORD|GUARD_PIN|SESSION_SECRET/.test(contenido)
  ) {
    bloquear("un componente de cliente ('use client') no puede tocar claves del servidor.");
  }
}

process.exit(0);
