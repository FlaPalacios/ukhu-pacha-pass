// Datos visibles de la fiesta. Los marcados PROVISIONAL se cambian aquí cuando estén confirmados.

export const evento = {
  nombre: "Ukhu Pacha Pass",
  subtitulo: "Ukhu Pacha, el mundo de adentro",
  fecha: "Sábado 31 de octubre de 2026",
  hora: "Desde las 9:00 p. m.", // PROVISIONAL
  lugar: "Santa María, Cusco. La dirección exacta llega con tu entrada.", // PROVISIONAL
  formasDePago: "Yape, Plin o efectivo",
  // PROVISIONAL: nombres de los coordinadores que reciben pagos
  coordinadores: "Coordinadores por confirmar",
};

// Precio de la entrada en soles. Desde la fase 2 se toma de la tabla settings.
export function precioEntrada(): number {
  const n = Number(process.env.TICKET_PRICE ?? 20);
  return Number.isFinite(n) && n > 0 ? n : 20;
}
