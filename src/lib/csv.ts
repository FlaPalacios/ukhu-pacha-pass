// CSV para abrir en Excel: UTF-8 con BOM (tildes y eñes), separado por comas, todo entre comillas.

// Una celda que empieza con = + - @ (o tab/retorno) Excel la toma como fórmula.
// Se antepone un apóstrofo para que se vea como texto.
function celda(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function aCsv(encabezados: string[], filas: unknown[][]): string {
  const lineas = [encabezados, ...filas].map((f) => f.map(celda).join(","));
  return "﻿" + lineas.join("\r\n") + "\r\n";
}
