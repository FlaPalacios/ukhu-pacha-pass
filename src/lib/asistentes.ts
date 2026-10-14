import "server-only";
import { supabaseServidor } from "./supabase-servidor";
import { nuevoCodigoCorto, nuevoToken } from "./codigos";

export type EstadoAsistente = "pendiente" | "pagado" | "ingresado" | "cancelado";

export type Asistente = {
  id: string;
  dni: string;
  nombre: string;
  correo: string | null;
  celular: string;
  estado: EstadoAsistente;
  es_menor: boolean;
  origen: "web" | "admin" | "puerta";
  codigo_corto: string | null;
  monto_pagado: number | null;
  pagado_en: string | null;
  pagado_por: string | null;
  correo_enviado_en: string | null;
  ingresado_en: string | null;
  ingresado_por: string | null;
  notas: string | null;
  creado_en: string;
};

export type MovimientoPago = {
  id: string;
  accion: "marcar_pagado" | "revertir" | "cancelar";
  monto: number | null;
  creado_en: string;
  admin: { nombre: string } | null;
};

// qr_token no se lee aquí: solo lo necesitan el correo y la puerta.
const COLUMNAS =
  "id, dni, nombre, correo, celular, estado, es_menor, origen, codigo_corto, monto_pagado, pagado_en, pagado_por, correo_enviado_en, ingresado_en, ingresado_por, notas, creado_en";

export async function listarAsistentes(): Promise<Asistente[]> {
  const { data, error } = await supabaseServidor()
    .from("attendees")
    .select(COLUMNAS)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(`listar asistentes falló (${error.code})`);
  return data as Asistente[];
}

export async function obtenerAsistente(id: string): Promise<Asistente | null> {
  const { data, error } = await supabaseServidor()
    .from("attendees")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`obtener asistente falló (${error.code})`);
  return data as Asistente | null;
}

export async function historialPagos(id: string): Promise<MovimientoPago[]> {
  const { data, error } = await supabaseServidor()
    .from("payment_log")
    .select("id, accion, monto, creado_en, admin:admin_profiles(nombre)")
    .eq("attendee_id", id)
    .order("creado_en", { ascending: false });
  if (error) throw new Error(`historial de pagos falló (${error.code})`);
  return data as unknown as MovimientoPago[];
}

// Marca pagado. Si el código corto choca con otro (muy raro), se reintenta con uno nuevo.
// Devuelve false si el asistente no estaba pendiente.
export async function marcarPagado(id: string, monto: number, adminId: string): Promise<boolean> {
  for (let intento = 0; intento < 5; intento++) {
    const { data, error } = await supabaseServidor().rpc("marcar_pagado", {
      p_id: id,
      p_monto: monto,
      p_admin: adminId,
      p_token: nuevoToken(),
      p_codigo: nuevoCodigoCorto(),
    });
    if (!error) return data === true;
    if (error.code !== "23505") throw new Error(`marcar_pagado falló (${error.code})`);
  }
  throw new Error("marcar_pagado: no se pudo generar un código corto único");
}

export async function revertirPago(id: string, adminId: string): Promise<boolean> {
  const { data, error } = await supabaseServidor().rpc("revertir_pago", {
    p_id: id,
    p_admin: adminId,
  });
  if (error) throw new Error(`revertir_pago falló (${error.code})`);
  return data === true;
}

export async function cancelarRegistro(id: string, adminId: string): Promise<boolean> {
  const { data, error } = await supabaseServidor().rpc("cancelar_registro", {
    p_id: id,
    p_admin: adminId,
  });
  if (error) throw new Error(`cancelar_registro falló (${error.code})`);
  return data === true;
}
