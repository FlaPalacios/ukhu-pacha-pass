import "server-only";
import { supabaseServidor } from "./supabase-servidor";

export type Config = { precio: number; aforo: number };

function respaldo(): Config {
  const precio = Number(process.env.TICKET_PRICE ?? 20);
  const aforo = Number(process.env.EVENT_CAPACITY ?? 250);
  return {
    precio: Number.isFinite(precio) && precio > 0 ? precio : 20,
    aforo: Number.isFinite(aforo) && aforo > 0 ? aforo : 250,
  };
}

// Precio y aforo vigentes (tabla settings). Si la base no responde, usa TICKET_PRICE y
// EVENT_CAPACITY: una página pública nunca se cae por esto.
export async function obtenerConfig(): Promise<Config> {
  try {
    const { data, error } = await supabaseServidor()
      .from("settings")
      .select("precio_entrada, aforo")
      .maybeSingle();
    if (error) throw new Error(`settings: consulta falló (${error.code})`);
    if (!data) return respaldo();
    return { precio: Number(data.precio_entrada), aforo: data.aforo };
  } catch (e) {
    console.error(e instanceof Error ? e.message : "settings: error desconocido");
    return respaldo();
  }
}

export async function guardarConfig(c: Config): Promise<void> {
  const { error } = await supabaseServidor()
    .from("settings")
    .update({ precio_entrada: c.precio, aforo: c.aforo, actualizado_en: new Date().toISOString() })
    .eq("id", true);
  if (error) throw new Error(`guardar settings falló (${error.code})`);
}
