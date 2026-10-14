"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase-servidor";
import { dentroDelLimite, huellaIp } from "@/lib/limite-intentos";
import {
  leerFormularioRegistro,
  primerErrorPorCampo,
  registroSchema,
  type ErroresRegistro,
} from "@/lib/validacion";

export type EstadoRegistro = {
  errores?: ErroresRegistro;
  mensaje?: string;
  // Lo que escribió la persona, para no vaciar el formulario si algo falla
  valores?: Record<string, string>;
};

// Generoso: las operadoras móviles comparten una IP pública entre muchos clientes.
const MAX_REGISTROS_POR_IP = 20;
const VENTANA_SEGUNDOS = 10 * 60;

export async function registrar(_previo: EstadoRegistro, fd: FormData): Promise<EstadoRegistro> {
  // Campo trampa: una persona no lo ve, un bot lo llena. Se finge éxito sin guardar.
  if (String(fd.get("sitio_web") ?? "") !== "") redirect("/registro/listo");

  const crudo = leerFormularioRegistro(fd);
  const valores = {
    dni: crudo.dni ?? "",
    nombre: crudo.nombre ?? "",
    correo: crudo.correo ?? "",
    celular: crudo.celular ?? "",
  };

  const r = registroSchema.safeParse(crudo);
  if (!r.success) return { errores: primerErrorPorCampo(r.error), valores };

  const errorGeneral: EstadoRegistro = {
    mensaje: "No pudimos registrarte en este momento. Inténtalo de nuevo en unos minutos.",
    valores,
  };

  try {
    const permitido = await dentroDelLimite(
      `registro:${await huellaIp()}`,
      MAX_REGISTROS_POR_IP,
      VENTANA_SEGUNDOS,
    );
    if (!permitido) {
      return {
        mensaje: "Hubo demasiados registros desde esta conexión. Espera unos minutos.",
        valores,
      };
    }

    const { dni, nombre, correo, celular } = r.data;
    const { error } = await supabaseServidor()
      .from("attendees")
      .insert({ dni, nombre, correo, celular, origen: "web" });

    if (error) {
      // 23505: DNI repetido. No se dice nada de quién lo registró.
      if (error.code === "23505") {
        return {
          errores: {
            dni: "Ya estás registrado con este DNI. Si no fuiste tú, habla con un coordinador.",
          },
          valores,
        };
      }
      console.error(`registro: insert falló (${error.code})`);
      return errorGeneral;
    }
  } catch (e) {
    // Solo el mensaje técnico, nunca los datos de la persona
    console.error("registro:", e instanceof Error ? e.message : "error desconocido");
    return errorGeneral;
  }

  redirect("/registro/listo");
}
