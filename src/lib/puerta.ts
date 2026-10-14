import "server-only";
import { timingSafeEqual } from "node:crypto";
import { verificarAdmin } from "./admin";
import type { Escaneo, Resultado } from "./puerta-tipos";
import { hmac, leerSesion } from "./sesion";
import { supabaseServidor } from "./supabase-servidor";

export type Acceso = { quien: string; esAdmin: boolean };

// Quién está en la puerta: un admin con sesión (entra sin PIN) o un guardia con PIN.
// null si no hay sesión válida. Lanza error si no se pudo verificar (base caída):
// así no se confunde una falla con "sesión vencida".
export async function accesoPuerta(): Promise<Acceso | null> {
  const s = await leerSesion();
  if (!s) return null;
  if (s.rol === "guardia") return { quien: `guardia ${s.puesto}`, esAdmin: false };
  const admin = await verificarAdmin(s);
  return admin ? { quien: admin.nombre, esAdmin: true } : null;
}

// Mínimo 6 caracteres. Decisión del usuario (14 oct): para una fiesta privada basta un PIN
// de 6 dígitos junto con el límite de intentos por IP. Los revisores sugerían 8.
const LARGO_MINIMO_PIN = 6;

export function pinConfigurado(): boolean {
  return (process.env.GUARD_PIN ?? "").length >= LARGO_MINIMO_PIN;
}

// Compara el PIN en tiempo constante. Sin un GUARD_PIN válido, nadie entra con PIN.
export function pinCorrecto(pin: string): boolean {
  const real = process.env.GUARD_PIN;
  if (!real || !pinConfigurado()) return false;
  const a = Buffer.from(hmac(`cmp:${pin}`));
  const b = Buffer.from(hmac(`cmp:${real}`));
  return timingSafeEqual(a, b);
}

export type Metodo = "qr" | "codigo" | "dni";

const QR_ENTRADA = /^UPP:([A-Za-z0-9_-]{32})$/;
const CODIGO = /^[A-HJKMNP-Z2-9]{6}$/;
const DNI = /^\d{8}$/;

// Convierte lo leído o escrito en la puerta en método y valor, o null si no tiene formato válido.
// Un QR que no es de la fiesta igual se consulta (y queda en scan_log como no encontrado).
export function interpretar(tipo: "qr" | "manual", valor: string): { metodo: Metodo; valor: string } | null {
  if (tipo === "qr") {
    return { metodo: "qr", valor: QR_ENTRADA.exec(valor.trim())?.[1] ?? "no-es-entrada" };
  }
  const v = valor.replace(/[\s-]/g, "").toUpperCase();
  if (DNI.test(v)) return { metodo: "dni", valor: v };
  if (CODIGO.test(v)) return { metodo: "codigo", valor: v };
  return null;
}

// Marca el ingreso (atómico, en la base) y deja el escaneo en scan_log.
export async function registrarIngreso(metodo: Metodo, valor: string, por: string): Promise<Escaneo> {
  const { data, error } = await supabaseServidor()
    .rpc("registrar_ingreso", { p_metodo: metodo, p_valor: valor, p_por: por.slice(0, 60) })
    .single<{
      resultado: Resultado;
      nombre: string | null;
      codigo_corto: string | null;
      es_menor: boolean;
      ingresado_en: string | null;
      ingresado_por: string | null;
      ingresados: number;
    }>();
  if (error) throw new Error(`registrar_ingreso falló (${error.code})`);
  // Al guardia se le muestra lo justo: el código solo si es válido, y si no puede pasar
  // (no pagado o cancelado), solo el primer nombre para avisar al admin.
  const rechazado = data.resultado === "no_pagado" || data.resultado === "cancelado";
  return {
    resultado: data.resultado,
    nombre: rechazado ? (data.nombre?.split(" ")[0] ?? null) : data.nombre,
    codigo: data.resultado === "valido" ? data.codigo_corto : null,
    esMenor: data.es_menor,
    ingresadoEn: data.ingresado_en,
    ingresadoPor: data.ingresado_por,
    ingresados: Number(data.ingresados),
  };
}

// Para la búsqueda por DNI: el guardia confirma el nombre con el DNI físico antes de marcar
// el ingreso. No cambia el estado. Devuelve id y nombre solo si está pagado.
export async function pagadoPorDni(dni: string): Promise<{ id: string; nombre: string } | null> {
  const { data, error } = await supabaseServidor()
    .from("attendees")
    .select("id, nombre")
    .eq("dni", dni)
    .eq("estado", "pagado")
    .maybeSingle();
  if (error) throw new Error(`buscar por DNI falló (${error.code})`);
  return data;
}

// Deja en scan_log una consulta por DNI que no marca ingreso: la consulta previa
// ("por_confirmar") o el guardia que vio que el documento no coincide ("no_coincide").
export async function anotarConsultaDni(
  dni: string,
  resultado: "por_confirmar" | "no_coincide",
  por: string,
  attendeeId?: string,
): Promise<void> {
  let id = attendeeId ?? null;
  if (!id) {
    const { data, error } = await supabaseServidor().from("attendees").select("id").eq("dni", dni).maybeSingle();
    if (error) throw new Error(`buscar por DNI falló (${error.code})`);
    id = data?.id ?? null;
  }
  const { error } = await supabaseServidor()
    .from("scan_log")
    .insert({ attendee_id: id, resultado, metodo: "dni", dispositivo: por.slice(0, 60) });
  if (error) throw new Error(`anotar consulta falló (${error.code})`);
}

export async function contarIngresados(): Promise<number> {
  const { count, error } = await supabaseServidor()
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("estado", "ingresado");
  if (error) throw new Error(`contar ingresados falló (${error.code})`);
  return count ?? 0;
}
