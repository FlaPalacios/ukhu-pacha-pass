import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Cookie de sesión firmada con HMAC. Sirve para admins (y desde la fase 4, guardias).
// Formato: base64url(JSON) + "." + base64url(HMAC-SHA256).

const COOKIE = "upp_sesion";
const DURACION_SEGUNDOS = 12 * 60 * 60;

// iat: milisegundos en que se emitió; sirve para invalidar sesiones viejas.
export type Sesion = { rol: "admin"; id: string; iat: number; exp: number };

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET falta o tiene menos de 32 caracteres.");
  return s;
}

function firma(datos: string): string {
  return createHmac("sha256", secreto()).update(datos).digest("base64url");
}

export async function abrirSesion(rol: Sesion["rol"], id: string): Promise<void> {
  const ahora = Date.now();
  const sesion: Sesion = { rol, id, iat: ahora, exp: Math.floor(ahora / 1000) + DURACION_SEGUNDOS };
  const datos = Buffer.from(JSON.stringify(sesion)).toString("base64url");
  (await cookies()).set(COOKIE, `${datos}.${firma(datos)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

// Devuelve la sesión solo si la firma es válida y no venció.
export async function leerSesion(): Promise<Sesion | null> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return null;

  const [datos, recibida] = valor.split(".");
  if (!datos || !recibida) return null;

  const esperada = Buffer.from(firma(datos));
  const dada = Buffer.from(recibida);
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) return null;

  try {
    const s = JSON.parse(Buffer.from(datos, "base64url").toString()) as Sesion;
    if (s.rol !== "admin" || typeof s.id !== "string" || typeof s.iat !== "number") return null;
    if (typeof s.exp !== "number" || s.exp < Date.now() / 1000) return null;
    return s;
  } catch {
    return null;
  }
}
