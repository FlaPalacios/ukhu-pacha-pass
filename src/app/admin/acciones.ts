"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { adminActual, exigirAdmin, invalidarSesiones } from "@/lib/admin";
import { z } from "zod";
import {
  cancelarRegistro,
  marcarPagado,
  paraEnviar,
  revertirPago,
  unoParaEnviar,
} from "@/lib/asistentes";
import { enviarLote, MAX_LOTE, reservarLote } from "@/lib/envios";
import { registrarIngreso } from "@/lib/puerta";
import { dentroDelLimite, huellaIp } from "@/lib/limite-intentos";
import type { ResultadoAccion } from "@/lib/resultado";
import { abrirSesionAdmin, cerrarSesion } from "@/lib/sesion";
import { supabaseServidor } from "@/lib/supabase-servidor";
import { guardarConfig } from "@/lib/config";
import {
  configSchema,
  edicionSchema,
  gastoSchema,
  idSchema,
  loginSchema,
  montoSchema,
  registroAdminSchema,
  textosDe,
} from "@/lib/validacion";

const ERROR_GENERAL = "No se pudo completar. Inténtalo de nuevo.";

// Solo el mensaje técnico, nunca datos de personas.
function registrarFallo(donde: string, e: unknown) {
  unstable_rethrow(e);
  console.error(`${donde}:`, e instanceof Error ? e.message : "error desconocido");
}

function refrescar(id?: string) {
  revalidatePath("/admin/asistentes");
  if (id) revalidatePath(`/admin/asistentes/${id}`);
}

// Sesión

export async function iniciarSesion(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const r = loginSchema.safeParse(textosDe(fd));
  if (!r.success) return { error: "Correo o contraseña incorrectos." };

  try {
    if (!(await dentroDelLimite(`login:${await huellaIp()}`, 10, 10 * 60))) {
      return { error: "Demasiados intentos. Espera unos minutos." };
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error("faltan variables públicas de Supabase");

    const auth = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).auth;
    const { data, error } = await auth.signInWithPassword({
      email: r.data.correo,
      password: r.data.clave,
    });
    if (error || !data.user) return { error: "Correo o contraseña incorrectos." };
    // La sesión de Supabase no se usa: se revoca y queda solo la cookie propia.
    await auth.signOut();

    const { data: perfil, error: errPerfil } = await supabaseServidor()
      .from("admin_profiles")
      .select("id, activo")
      .eq("id", data.user.id)
      .maybeSingle();
    if (errPerfil) throw new Error(`admin_profiles falló (${errPerfil.code})`);
    if (!perfil || !perfil.activo) return { error: "Correo o contraseña incorrectos." };

    await abrirSesionAdmin(perfil.id);
  } catch (e) {
    registrarFallo("login", e);
    return { error: ERROR_GENERAL };
  }

  redirect("/admin/asistentes");
}

export async function salir(): Promise<void> {
  const admin = await adminActual();
  if (admin) await invalidarSesiones(admin.id);
  await cerrarSesion();
  redirect("/admin/login");
}

// Pagos

export async function accionMarcarPagado(
  id: string,
  _p: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  const admin = await exigirAdmin();
  const vid = idSchema.safeParse(id);
  const monto = montoSchema.safeParse(String(fd.get("monto") ?? ""));
  if (!vid.success) return { error: "Registro no válido." };
  if (!monto.success) return { error: monto.error.issues[0].message };

  try {
    const cambio = await marcarPagado(vid.data, monto.data, admin.id);
    refrescar(vid.data);
    return cambio
      ? { ok: "Pago registrado." }
      : { error: "No se marcó: el registro ya no estaba pendiente." };
  } catch (e) {
    registrarFallo("marcar pagado", e);
    return { error: ERROR_GENERAL };
  }
}

export async function accionRevertir(id: string): Promise<ResultadoAccion> {
  const admin = await exigirAdmin();
  const vid = idSchema.safeParse(id);
  if (!vid.success) return { error: "Registro no válido." };

  try {
    const cambio = await revertirPago(vid.data, admin.id);
    refrescar(vid.data);
    return cambio
      ? { ok: "Volvió a pendiente de pago." }
      : { error: "No se revirtió: el estado ya cambió." };
  } catch (e) {
    registrarFallo("revertir", e);
    return { error: ERROR_GENERAL };
  }
}

export async function accionCancelar(
  id: string,
  _p: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  const admin = await exigirAdmin();
  const vid = idSchema.safeParse(id);
  if (!vid.success) return { error: "Registro no válido." };
  if (fd.get("confirmo") !== "on") return { error: "Marca la casilla para confirmar." };

  try {
    const cambio = await cancelarRegistro(vid.data, admin.id);
    refrescar(vid.data);
    return cambio
      ? { ok: "Registro cancelado." }
      : { error: "No se canceló: el estado ya cambió." };
  } catch (e) {
    registrarFallo("cancelar", e);
    return { error: ERROR_GENERAL };
  }
}

// Correo del QR

const loteSchema = z.object({
  tipo: z.enum(["nuevos", "fallidos"]),
  cantidad: z.coerce.number().int().min(1).max(MAX_LOTE),
});

export async function accionEnviarLote(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  await exigirAdmin();
  const r = loteSchema.safeParse(textosDe(fd));
  if (!r.success) return { error: `Elige una cantidad entre 1 y ${MAX_LOTE}.` };

  try {
    const filas = await paraEnviar(r.data.cantidad, r.data.tipo === "fallidos");
    if (filas.length === 0) return { ok: "No hay nadie para enviar en este grupo." };
    if (!(await reservarLote())) {
      return { error: "Hay un lote en curso o recién enviado. Espera un minuto y vuelve a intentar." };
    }
    const res = await enviarLote(filas);
    revalidatePath("/admin/correos");
    const resumen = `Enviados: ${res.enviados}. Con error: ${res.fallidos}.`;
    return res.detenido ? { error: `${res.detenido} ${resumen}` } : { ok: resumen };
  } catch (e) {
    registrarFallo("enviar lote", e);
    return { error: ERROR_GENERAL };
  }
}

export async function accionReenviar(id: string): Promise<ResultadoAccion> {
  await exigirAdmin();
  const vid = idSchema.safeParse(id);
  if (!vid.success) return { error: "Registro no válido." };

  try {
    const fila = await unoParaEnviar(vid.data);
    if (!fila) return { error: "Solo se envía a registros pagados con correo." };
    const res = await enviarLote([fila]);
    refrescar(vid.data);
    if (res.detenido) return { error: res.detenido };
    return res.enviados === 1
      ? { ok: "Correo enviado." }
      : { error: "Gmail no aceptó esta dirección. Revisa el correo y vuelve a intentar." };
  } catch (e) {
    registrarFallo("reenviar", e);
    return { error: ERROR_GENERAL };
  }
}

// Resumen, configuración y gastos

function refrescarResumen() {
  revalidatePath("/admin");
  revalidatePath("/admin/gastos");
}

export async function accionGuardarConfig(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  await exigirAdmin();
  const r = configSchema.safeParse(textosDe(fd));
  if (!r.success) return { error: r.error.issues[0].message };
  try {
    await guardarConfig(r.data);
  } catch (e) {
    registrarFallo("guardar configuración", e);
    return { error: ERROR_GENERAL };
  }
  refrescarResumen();
  // Las páginas públicas muestran el precio.
  revalidatePath("/");
  revalidatePath("/registro");
  revalidatePath("/registro/listo");
  return { ok: "Configuración guardada." };
}

export async function accionCrearGasto(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const admin = await exigirAdmin();
  const r = gastoSchema.safeParse(textosDe(fd));
  if (!r.success) return { error: r.error.issues[0].message };
  const { error } = await supabaseServidor()
    .from("expenses")
    .insert({ concepto: r.data.concepto, monto: r.data.monto, fecha: r.data.fecha, creado_por: admin.id });
  if (error) {
    registrarFallo("crear gasto", new Error(`insert falló (${error.code})`));
    return { error: ERROR_GENERAL };
  }
  refrescarResumen();
  return { ok: "Gasto agregado." };
}

export async function accionEliminarGasto(id: string): Promise<ResultadoAccion> {
  await exigirAdmin();
  const vid = idSchema.safeParse(id);
  if (!vid.success) return { error: "Gasto no válido." };
  const { error } = await supabaseServidor().from("expenses").delete().eq("id", vid.data);
  if (error) {
    registrarFallo("eliminar gasto", new Error(`delete falló (${error.code})`));
    return { error: ERROR_GENERAL };
  }
  refrescarResumen();
  return { ok: "Gasto eliminado." };
}

// Datos

export async function accionEditar(
  id: string,
  _p: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  await exigirAdmin();
  const vid = idSchema.safeParse(id);
  if (!vid.success) return { error: "Registro no válido." };
  const r = edicionSchema.safeParse(textosDe(fd));
  if (!r.success) return { error: r.error.issues[0].message };

  const { error } = await supabaseServidor().from("attendees").update(r.data).eq("id", vid.data);
  if (error) {
    if (error.code === "23505") return { error: "Ese DNI ya pertenece a otro registro." };
    registrarFallo("editar", new Error(`update falló (${error.code})`));
    return { error: ERROR_GENERAL };
  }
  refrescar(vid.data);
  return { ok: "Datos guardados." };
}

export async function accionCrearAsistente(
  _p: ResultadoAccion,
  fd: FormData,
): Promise<ResultadoAccion> {
  const admin = await exigirAdmin();
  const r = registroAdminSchema.safeParse(textosDe(fd));
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;

  const { data, error } = await supabaseServidor()
    .from("attendees")
    .insert({
      dni: d.dni,
      nombre: d.nombre,
      correo: d.correo,
      celular: d.celular,
      origen: d.origen,
      es_menor: d.es_menor,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Ese DNI ya está registrado. Búscalo en la lista." };
    registrarFallo("crear asistente", new Error(`insert falló (${error.code})`));
    return { error: ERROR_GENERAL };
  }

  if (d.monto !== null) {
    let pagado = false;
    try {
      pagado = await marcarPagado(data.id, d.monto, admin.id);
    } catch (e) {
      registrarFallo("crear asistente: pago", e);
    }
    if (!pagado) {
      refrescar(data.id);
      redirect(`/admin/asistentes/${data.id}?aviso=pago-pendiente`);
    }

    // Registro en puerta con ingreso inmediato: el mismo ingreso atómico del escáner.
    if (d.ingresar) {
      let ingreso = false;
      try {
        ingreso = (await registrarIngreso("dni", d.dni, admin.nombre)).resultado === "valido";
      } catch (e) {
        registrarFallo("crear asistente: ingreso", e);
      }
      if (!ingreso) {
        refrescar(data.id);
        redirect(`/admin/asistentes/${data.id}?aviso=ingreso-pendiente`);
      }
    }
  }

  refrescar(data.id);
  redirect(`/admin/asistentes/${data.id}`);
}
