// Datos visibles de la fiesta. Los marcados PROVISIONAL se cambian aquí cuando estén confirmados.

export const evento = {
  nombre: "Ukhu Pacha Pass",
  subtitulo: "Ukhu Pacha, el mundo de adentro",
  fecha: "Sábado 31 de octubre de 2026",
  hora: "Desde las 9:00 p. m.", // PROVISIONAL
  lugar: "A una cuadra del Colegio Santa María de los Andes, Santa María, Cusco.",
  referencia: "A una cuadra del Colegio Santa María de los Andes",
  zona: "Santa María, Cusco",
  mapa: {
    enlace: "https://maps.app.goo.gl/5Nj8tf1Q4gxm6eEe9",
    // Mapa embebido de Google, sin clave de API. Se usa la URL final de /maps/embed:
    // la forma corta (?output=embed) redirige con X-Frame-Options y el mapa sale en blanco.
    embebido: "https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s-13.530769,-71.905192!6i16",
  },
  formasDePago: "Yape, Plin o efectivo",
  // PROVISIONAL: nombres de los coordinadores que reciben pagos
  coordinadores: "Coordinadores por confirmar",
};

// El precio y el aforo están en la tabla settings (src/lib/config.ts).
