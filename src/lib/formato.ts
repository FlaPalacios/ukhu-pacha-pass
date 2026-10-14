const FECHA_HORA = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function fechaHora(iso: string | null): string {
  return iso ? FECHA_HORA.format(new Date(iso)) : "";
}

export function soles(monto: number | null): string {
  return monto === null ? "" : `S/ ${Number(monto).toFixed(2)}`;
}

// Para buscar sin importar mayúsculas ni tildes.
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
