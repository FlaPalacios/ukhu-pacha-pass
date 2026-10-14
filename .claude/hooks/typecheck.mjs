// Hook PostToolUse de Ukhu Pacha Pass.
// Después de editar un archivo .ts o .tsx corre el chequeo de tipos.
// Si hay errores, los devuelve a Claude (código de salida 2) para que los corrija.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

let entrada = {};
try {
  entrada = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const archivo = String(entrada.tool_input?.file_path ?? "");
if (!/\.(ts|tsx)$/.test(archivo)) process.exit(0);

const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
if (!existsSync(join(raiz, "tsconfig.json"))) process.exit(0);
if (!existsSync(join(raiz, "node_modules", "typescript"))) process.exit(0);

// Next 16 genera aparte los tipos de rutas (PageProps, LayoutProps). Sin esto,
// cada ruta nueva da un falso error hasta el próximo build.
spawnSync("npx", ["--no-install", "next", "typegen"], {
  cwd: raiz,
  encoding: "utf8",
  shell: true,
  timeout: 60000,
});

const r = spawnSync("npx", ["--no-install", "tsc", "--noEmit", "--pretty", "false"], {
  cwd: raiz,
  encoding: "utf8",
  shell: true,
  timeout: 120000,
});

if (r.status !== 0) {
  const salida = `${r.stdout ?? ""}${r.stderr ?? ""}`.split(/\r?\n/).slice(0, 40).join("\n");
  console.error("El chequeo de tipos (tsc) encontró errores. Corrígelos antes de seguir:");
  console.error(salida);
  process.exit(2);
}
process.exit(0);
