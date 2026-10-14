"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { dentroDelLimite, huellaIp, reiniciarIntentos } from "@/lib/limite-intentos";
import { pinCorrecto } from "@/lib/puerta";
import { PUESTOS } from "@/lib/puerta-tipos";
import type { ResultadoAccion } from "@/lib/resultado";
import { abrirSesionGuardia, cerrarSesion } from "@/lib/sesion";

// 8 intentos por IP en 15 minutos sin acertar bloquean esa IP hasta que pase la ventana.
// Cada acierto reinicia el contador, así varios guardias en el mismo WiFi no se bloquean entre sí.
const MAX_FALLOS_PIN = 8;
const VENTANA_PIN_SEGUNDOS = 15 * 60;

const pinSchema = z.object({
  pin: z.string().trim().min(1, "Escribe el PIN.").max(32),
  puesto: z.enum(PUESTOS, { error: "Elige el puesto." }),
});

export async function entrarConPin(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const r = pinSchema.safeParse({ pin: fd.get("pin") ?? "", puesto: fd.get("puesto") ?? "" });
  if (!r.success) return { error: r.error.issues[0].message };

  try {
    // Se cuenta el intento de forma atómica ANTES de comparar: ni pedidos simultáneos se cuelan.
    // Un PIN correcto reinicia el contador de esa IP, así los aciertos no bloquean a nadie.
    const clave = `pin:${await huellaIp()}`;
    if (!(await dentroDelLimite(clave, MAX_FALLOS_PIN, VENTANA_PIN_SEGUNDOS))) {
      return { error: "Demasiados intentos errados. Espera 15 minutos o pide ayuda a un admin." };
    }
    if (!pinCorrecto(r.data.pin)) return { error: "PIN incorrecto." };
    await reiniciarIntentos(clave);
    await abrirSesionGuardia(r.data.puesto);
  } catch (e) {
    unstable_rethrow(e);
    console.error("pin:", e instanceof Error ? e.message : "error desconocido");
    return { error: "No se pudo verificar el PIN. Inténtalo de nuevo." };
  }
  redirect("/puerta");
}

export async function salirPuerta(): Promise<void> {
  await cerrarSesion();
  redirect("/puerta");
}
