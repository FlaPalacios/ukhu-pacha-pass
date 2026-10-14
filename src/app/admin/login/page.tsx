import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Encabezado } from "@/components/encabezado";
import { adminActual } from "@/lib/admin";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = {
  title: "Admin | Ukhu Pacha Pass",
  robots: { index: false, follow: false },
};

export default async function Login() {
  if (await adminActual()) redirect("/admin/asistentes");

  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 pt-6 pb-16">
        <h1 className="text-4xl text-amarillo">Panel de admin</h1>
        <FormularioLogin />
      </main>
    </>
  );
}
