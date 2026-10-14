import type { EstadoAsistente } from "@/lib/asistentes";

const ESTILOS: Record<EstadoAsistente, { texto: string; clase: string }> = {
  pendiente: { texto: "Pendiente", clase: "bg-naranja text-tinta" },
  pagado: { texto: "Pagado", clase: "bg-menta text-tinta" },
  ingresado: { texto: "Ingresado", clase: "bg-morado text-texto" },
  cancelado: { texto: "Cancelado", clase: "border border-borde text-apagado" },
};

export function Estado({ estado }: { estado: EstadoAsistente }) {
  const e = ESTILOS[estado];
  return (
    <span className={`inline-block rounded px-2 py-0.5 font-lora text-sm whitespace-nowrap ${e.clase}`}>
      {e.texto}
    </span>
  );
}

export const NOMBRE_ESTADO: Record<EstadoAsistente, string> = {
  pendiente: "Pendientes",
  pagado: "Pagados",
  ingresado: "Ingresados",
  cancelado: "Cancelados",
};
