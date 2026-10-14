import "server-only";
import { registrarEnvio, type ParaCorreo } from "./asistentes";
import { obtenerConfig } from "./config";
import { clasificarFallo, crearTransporte, enviarEntrada } from "./correo";
import { dentroDelLimite } from "./limite-intentos";

export type ResultadoLote = { enviados: number; fallidos: number; detenido?: string };

// Tope por lote: Gmail y el tiempo de la función mandan más que el plan (que sugería 80).
export const MAX_LOTE = 40;

// La función tiene 60 s (maxDuration). Un envío puede tardar hasta ~10 s (timeouts del
// transporte), así que no se empieza uno nuevo pasados los 45 s.
const ULTIMO_INICIO_MS = 45_000;

// Solo un lote a la vez en todo el sistema: evita que dos admins manden el mismo correo dos veces.
export async function reservarLote(): Promise<boolean> {
  return dentroDelLimite("lote-correo", 1, 60);
}

// Envía uno por uno con una sola conexión. Si el problema es general (clave, límite,
// conexión) se detiene sin marcar error a la persona: no fue culpa de su dirección.
export async function enviarLote(filas: ParaCorreo[]): Promise<ResultadoLote> {
  const r: ResultadoLote = { enviados: 0, fallidos: 0 };
  const inicio = Date.now();
  const { precio } = await obtenerConfig();

  let transporte;
  try {
    transporte = crearTransporte();
  } catch (e) {
    return { ...r, detenido: clasificarFallo(e).motivo };
  }

  try {
    for (const f of filas) {
      if (Date.now() - inicio > ULTIMO_INICIO_MS) {
        r.detenido = "Se cortó el lote para no pasar el tiempo límite. Envía otro lote.";
        break;
      }

      try {
        await enviarEntrada(transporte, {
          nombre: f.nombre,
          correo: f.correo,
          codigo: f.codigo_corto,
          token: f.qr_token,
        }, precio);
      } catch (e) {
        const fallo = clasificarFallo(e);
        console.error(`correo: envío falló (${fallo.codigo})`);
        if (fallo.detener) {
          r.detenido = fallo.motivo;
          break;
        }
        await registrarEnvio(f.id, fallo.codigo);
        r.fallidos++;
        continue;
      }

      // El correo ya salió. Si falla solo el guardado, no se marca error a la persona.
      try {
        await registrarEnvio(f.id, null);
        r.enviados++;
      } catch (e) {
        console.error("correo: no se pudo guardar el envío:", e instanceof Error ? e.message : "");
        r.enviados++;
        r.detenido =
          "Un correo salió pero no se pudo guardar en la base. Revisa la conexión antes de seguir.";
        break;
      }
    }
  } finally {
    transporte.close();
  }
  return r;
}
