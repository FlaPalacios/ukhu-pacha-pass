// Tipos compartidos entre el escáner (cliente) y la ruta /api/puerta/escanear (servidor).

// Los dos puntos de ingreso (sección 2 del plan). Queda en scan_log como "guardia Puerta 1".
export const PUESTOS = ["Puerta 1", "Puerta 2"] as const;

export type Resultado = "valido" | "repetido" | "no_pagado" | "cancelado" | "no_encontrado";

export type Escaneo = {
  resultado: Resultado;
  nombre: string | null;
  codigo: string | null;
  esMenor: boolean;
  ingresadoEn: string | null;
  ingresadoPor: string | null;
  ingresados: number;
};

// sinSesion: la sesión venció o no existe; hay que volver a ingresar el PIN.
// confirmar: búsqueda por DNI de alguien pagado; falta que el guardia confirme con el DNI físico.
export type RespuestaEscaneo =
  | { ok: true; escaneo: Escaneo }
  | { ok: true; confirmar: { nombre: string; dni: string } }
  | { ok: true; anotado: true }
  | { ok: false; error: string; sinSesion?: boolean };
