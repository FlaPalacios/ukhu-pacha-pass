import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { supabaseServidor } from "./supabase-servidor";

// Hash de la IP del cliente: sirve para contar intentos sin guardar la IP.
export async function huellaIp(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

// Suma un intento a la clave. Devuelve true si sigue dentro del límite.
// Si la base no responde, lanza error: quien llama decide qué mostrar.
export async function dentroDelLimite(
  clave: string,
  max: number,
  ventanaSegundos: number,
): Promise<boolean> {
  const { data, error } = await supabaseServidor().rpc("registrar_intento", {
    p_clave: clave,
    p_max: max,
    p_ventana_segundos: ventanaSegundos,
  });
  if (error) throw new Error(`registrar_intento falló (${error.code})`);
  return data === true;
}
