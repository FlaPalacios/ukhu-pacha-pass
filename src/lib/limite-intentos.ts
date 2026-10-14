import "server-only";
import { createHash, createHmac } from "node:crypto";
import { headers } from "next/headers";
import { supabaseServidor } from "./supabase-servidor";

// IPv6: un mismo cliente controla todo un /64, así que se cuenta por esos 4 primeros bloques.
// Se expande "::" y se normaliza (minúsculas, sin ceros a la izquierda) para que una misma
// red no pueda generar claves distintas escribiendo la dirección de otra forma.
function prefijoIpv6(ip: string): string {
  const [izq, der = ""] = ip.toLowerCase().split("::");
  const a = izq ? izq.split(":") : [];
  const b = der ? der.split(":") : [];
  const bloques = ip.includes("::") ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill("0"), ...b] : a;
  return bloques
    .slice(0, 4)
    .map((x) => x.replace(/^0+(?=.)/, ""))
    .join(":");
}

// Huella de la IP del cliente: sirve para contar intentos sin guardar la IP.
// Con HMAC (clave SESSION_SECRET) no se puede recuperar la IP probando todas.
export async function huellaIp(): Promise<string> {
  const h = await headers();
  let ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
  // IPv4 escrita como IPv6 (::ffff:1.2.3.4): se usa la IPv4, si no todas compartirían clave.
  const v4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (v4) ip = v4[1];
  else if (ip.includes(":")) ip = prefijoIpv6(ip);
  const clave = process.env.SESSION_SECRET;
  return (clave ? createHmac("sha256", clave) : createHash("sha256"))
    .update(ip)
    .digest("hex")
    .slice(0, 32);
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

// Pone en cero el contador de una clave (por ejemplo, tras un PIN correcto).
export async function reiniciarIntentos(clave: string): Promise<void> {
  const { error } = await supabaseServidor().from("rate_limits").delete().eq("clave", clave);
  if (error) throw new Error(`reiniciar intentos falló (${error.code})`);
}
