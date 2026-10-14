import { redirect } from "next/navigation";

// El panel de resumen llega en la fase 5. Por ahora el inicio del panel es la lista.
export default function Admin() {
  redirect("/admin/asistentes");
}
