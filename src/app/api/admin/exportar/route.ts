import { adminActual } from "@/lib/admin";
import { listarAsistentes } from "@/lib/asistentes";
import { aCsv } from "@/lib/csv";
import { fechaHora } from "@/lib/formato";

// Respaldo en CSV para el día del evento. Solo admins.
// ?tipo=pagados: pagados e ingresados, con datos mínimos y DNI enmascarado (para imprimir en la puerta).
// Sin tipo: todos, con datos completos (respaldo de admins).

const ESTADO = { pendiente: "Pendiente", pagado: "Pagado", ingresado: "Ingresado", cancelado: "Cancelado" };
const ORIGEN = { web: "Web", admin: "Coordinador", puerta: "Puerta" };

export async function GET(request: Request) {
  const admin = await adminActual();
  if (!admin) return new Response("No autorizado", { status: 401 });

  const soloPagados = new URL(request.url).searchParams.get("tipo") === "pagados";

  let lista;
  try {
    lista = await listarAsistentes();
  } catch (e) {
    console.error("exportar:", e instanceof Error ? e.message : "error desconocido");
    return new Response("No se pudo leer la base. Inténtalo de nuevo.", { status: 500 });
  }
  if (soloPagados) lista = lista.filter((a) => a.estado === "pagado" || a.estado === "ingresado");
  lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  // La lista de pagados se imprime y pasa por la puerta: solo lo necesario para dejar pasar,
  // con el DNI enmascarado (los 4 últimos dígitos alcanzan para compararlo con el documento).
  const csv = soloPagados
    ? aCsv(
        ["Nombre", "DNI (últimos 4)", "Código", "Estado", "Menor", "Ingresó"],
        lista.map((a) => [
          a.nombre,
          `****${a.dni.slice(-4)}`,
          a.codigo_corto ?? "",
          ESTADO[a.estado],
          a.es_menor ? "Sí" : "",
          fechaHora(a.ingresado_en),
        ]),
      )
    : aCsv(
        [
          "Nombre", "DNI", "Código", "Estado", "Menor", "Celular", "Correo", "Monto", "Pagado",
          "Ingresó", "Ingreso marcado por", "QR enviado", "Origen", "Notas",
        ],
        lista.map((a) => [
          a.nombre,
          a.dni,
          a.codigo_corto ?? "",
          ESTADO[a.estado],
          a.es_menor ? "Sí" : "",
          a.celular,
          a.correo ?? "",
          a.monto_pagado === null ? "" : Number(a.monto_pagado).toFixed(2),
          fechaHora(a.pagado_en),
          fechaHora(a.ingresado_en),
          a.ingresado_por ?? "",
          a.correo_enviado_en ? "Sí" : "",
          ORIGEN[a.origen],
          a.notas ?? "",
        ]),
      );

  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
  const nombre = `ukhu-pacha-pass-${soloPagados ? "pagados" : "todos"}-${hoy}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
