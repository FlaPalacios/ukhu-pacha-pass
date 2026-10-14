import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { leerSesion, type Sesion } from "./sesion";
import { supabaseServidor } from "./supabase-servidor";

export type Admin = { id: string; nombre: string };

// Admin de una sesión, o null si no corresponde a un admin válido.
// Lanza error si la base no responde: quien llama decide qué mostrar.
// Un admin con activo = false, o una sesión emitida antes de sesion_desde, no entra.
export async function verificarAdmin(sesion: Sesion | null): Promise<Admin | null> {
  if (!sesion || sesion.rol !== "admin") return null;
  const { data, error } = await supabaseServidor()
    .from("admin_profiles")
    .select("id, nombre, activo, sesion_desde")
    .eq("id", sesion.id)
    .maybeSingle();
  if (error) throw new Error(`admin_profiles: consulta falló (${error.code})`);
  if (!data || !data.activo) return null;
  if (data.sesion_desde && sesion.iat < Date.parse(data.sesion_desde)) return null;
  return { id: data.id, nombre: data.nombre };
}

// Admin de la sesión actual, o null (también si algo falla: el panel manda al login).
export async function adminActual(): Promise<Admin | null> {
  try {
    return await verificarAdmin(await leerSesion());
  } catch (e) {
    unstable_rethrow(e); // deja pasar las señales internas de Next (página dinámica, redirect)
    console.error("sesión:", e instanceof Error ? e.message : "error desconocido");
    return null;
  }
}

// Para páginas y acciones de admin: sin sesión válida, va al login.
export async function exigirAdmin(): Promise<Admin> {
  const admin = await adminActual();
  if (!admin) redirect("/admin/login");
  return admin;
}

// Invalida en el servidor todas las sesiones abiertas de este admin.
export async function invalidarSesiones(adminId: string): Promise<void> {
  const { error } = await supabaseServidor()
    .from("admin_profiles")
    .update({ sesion_desde: new Date().toISOString() })
    .eq("id", adminId);
  if (error) console.error(`invalidar sesiones falló (${error.code})`);
}
