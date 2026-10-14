import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Cookie de sesión firmada con HMAC, para admins y guardias.
// Formato: base64url(JSON) + "." + base64url(HMAC-SHA256).

const COOKIE = "upp_sesion";
const DURACION_SEGUNDOS = 12 * 60 * 60;

// iat: milisegundos en que se emitió; sirve para invalidar sesiones viejas.
// La sesión de guardia lleva pv, una huella del PIN vigente: si cambia GUARD_PIN, deja de valer.
// Su id es fijo y no es un UUID, así que nunca coincide con un admin. puesto: "Puerta 1" o "Puerta 2".
export type Sesion =
  | { rol: "admin"; id: string; iat: number; exp: number }
  | { rol: "guardia"; id: "guardia"; iat: number; exp: number; pv: string; puesto: string };

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET falta o tiene menos de 32 caracteres.");
  return s;
}

export function hmac(datos: string): string {
  return createHmac("sha256", secreto()).update(datos).digest("base64url");
}

// Huella del PIN vigente, o null si no hay PIN configurado.
export function huellaPin(): string | null {
  const pin = process.env.GUARD_PIN;
  return pin ? hmac(`pin:${pin}`).slice(0, 16) : null;
}

async function guardar(sesion: Sesion): Promise<void> {
  const datos = Buffer.from(JSON.stringify(sesion)).toString("base64url");
  (await cookies()).set(COOKIE, `${datos}.${hmac(datos)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

function tiempos() {
  const ahora = Date.now();
  return { iat: ahora, exp: Math.floor(ahora / 1000) + DURACION_SEGUNDOS };
}

export async function abrirSesionAdmin(id: string): Promise<void> {
  await guardar({ rol: "admin", id, ...tiempos() });
}

export async function abrirSesionGuardia(puesto: string): Promise<void> {
  const pv = huellaPin();
  if (!pv) throw new Error("GUARD_PIN no está configurado.");
  await guardar({ rol: "guardia", id: "guardia", pv, puesto, ...tiempos() });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

// Devuelve la sesión solo si la firma es válida, no venció y (para guardias) el PIN no cambió.
export async function leerSesion(): Promise<Sesion | null> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return null;

  const [datos, recibida] = valor.split(".");
  if (!datos || !recibida) return null;

  const esperada = Buffer.from(hmac(datos));
  const dada = Buffer.from(recibida);
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) return null;

  try {
    const s = JSON.parse(Buffer.from(datos, "base64url").toString()) as Sesion;
    if (typeof s.iat !== "number" || typeof s.exp !== "number") return null;
    if (s.exp < Date.now() / 1000) return null;
    if (s.rol === "admin" && typeof s.id === "string") return s;
    if (s.rol === "guardia" && s.id === "guardia" && s.pv === huellaPin() && typeof s.puesto === "string") {
      return s;
    }
    return null;
  } catch {
    return null;
  }
}
