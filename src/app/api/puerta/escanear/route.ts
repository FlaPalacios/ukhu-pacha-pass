import { z } from "zod";
import { dentroDelLimite, huellaIp } from "@/lib/limite-intentos";
import { accesoPuerta, anotarConsultaDni, interpretar, pagadoPorDni, registrarIngreso } from "@/lib/puerta";
import type { RespuestaEscaneo } from "@/lib/puerta-tipos";

// Ruta HTTP y no Server Action: las Server Actions se ejecutan en fila en el navegador,
// y un escaneo colgado por mala señal dejaría esperando a todos los siguientes.
// Con fetch + AbortController cada escaneo es independiente.

const entradaSchema = z.object({
  tipo: z.enum(["qr", "manual"]),
  valor: z.string().max(200),
  // Solo para DNI: el guardia ya comparó el nombre con el DNI físico.
  confirmado: z.boolean().optional(),
  // Solo para DNI: el documento no coincide; se anota en scan_log y no se marca nada.
  noCoincide: z.boolean().optional(),
});

// Tope generoso: dos puertas en hora punta no llegan; un script recorriendo DNIs sí.
const MAX_CONSULTAS_POR_MINUTO = 120;

function responder(r: RespuestaEscaneo, status = 200) {
  return Response.json(r, { status, headers: { "Cache-Control": "no-store" } });
}

const NO_DEJES_PASAR = "No dejes pasar todavía: vuelve a intentar.";

export async function POST(request: Request) {
  // Solo desde el propio sitio (CSRF). Además se exige JSON, que un formulario ajeno no puede enviar.
  const origen = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let mismoSitio = false;
  try {
    mismoSitio = !!origen && !!host && new URL(origen).host === host;
  } catch {
    // Origin mal formado (por ejemplo "null"): se rechaza abajo.
  }
  if (!mismoSitio) return responder({ ok: false, error: "Origen no permitido." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return responder({ ok: false, error: "Lectura no válida." }, 415);
  }

  let acceso;
  try {
    acceso = await accesoPuerta();
  } catch (e) {
    console.error("escaneo: acceso:", e instanceof Error ? e.message : "error desconocido");
    return responder({ ok: false, error: `No se pudo verificar el acceso. ${NO_DEJES_PASAR}` });
  }
  if (!acceso) {
    return responder({ ok: false, sinSesion: true, error: "La sesión de la puerta venció. Vuelve a ingresar el PIN." });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ ok: false, error: "Lectura no válida." }, 400);
  }
  const e = entradaSchema.safeParse(cuerpo);
  if (!e.success) return responder({ ok: false, error: "Lectura no válida." }, 400);

  const consulta = interpretar(e.data.tipo, e.data.valor);
  if (!consulta) return responder({ ok: false, error: "Escribe un código de 6 letras o un DNI de 8 dígitos." });

  try {
    if (!(await dentroDelLimite(`escaneo:${await huellaIp()}`, MAX_CONSULTAS_POR_MINUTO, 60))) {
      return responder({ ok: false, error: "Demasiadas consultas seguidas. Espera un minuto." });
    }

    // El guardia vio que el DNI físico no coincide: solo se anota, no se marca nada.
    // Una señal de "no dejar pasar" nunca debe terminar en un ingreso marcado.
    if (e.data.noCoincide) {
      if (consulta.metodo !== "dni") return responder({ ok: false, error: "Lectura no válida." }, 400);
      await anotarConsultaDni(consulta.valor, "no_coincide", acceso.quien);
      return responder({ ok: true, anotado: true });
    }

    // El DNI no es secreto: antes de marcar, el guardia confirma el nombre con el DNI físico.
    if (consulta.metodo === "dni" && !e.data.confirmado) {
      const pagado = await pagadoPorDni(consulta.valor);
      if (pagado) {
        await anotarConsultaDni(consulta.valor, "por_confirmar", acceso.quien, pagado.id);
        return responder({ ok: true, confirmar: { nombre: pagado.nombre, dni: consulta.valor } });
      }
      // Si no está pagado, el ingreso atómico igual rechaza y deja el motivo en scan_log.
    }

    return responder({ ok: true, escaneo: await registrarIngreso(consulta.metodo, consulta.valor, acceso.quien) });
  } catch (err) {
    console.error("escaneo:", err instanceof Error ? err.message : "error desconocido");
    return responder({ ok: false, error: `No se pudo registrar. ${NO_DEJES_PASAR}` });
  }
}
