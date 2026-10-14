import type { Metadata } from "next";
import { Encabezado } from "@/components/encabezado";
import { obtenerConfig } from "@/lib/config";
import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Registro | Ukhu Pacha Pass" };

export const revalidate = 60;

export default async function Registro() {
  const { precio } = await obtenerConfig();
  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-16">
        <h1 className="text-4xl text-amarillo">Regístrate</h1>
        <p className="mt-3">
          Después pagas S/ <span className="font-lora">{precio}</span> a un
          coordinador y te enviamos tu QR por correo.
        </p>
        <FormularioRegistro />
      </main>
    </>
  );
}
