import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { accesoPuerta, contarIngresados, pinConfigurado, type Acceso } from "@/lib/puerta";
import { salirPuerta } from "./acciones";
import { Escaner } from "./escaner";
import { FormularioPin } from "./formulario-pin";

export const metadata: Metadata = {
  title: "Puerta | Ukhu Pacha Pass",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

// Pantalla funcional: sin adornos, botones grandes, resultado a pantalla completa.
export default async function Puerta() {
  let acceso: Acceso | null;
  try {
    acceso = await accesoPuerta();
  } catch (e) {
    unstable_rethrow(e); // deja pasar las señales internas de Next (página dinámica)
    console.error("puerta:", e instanceof Error ? e.message : "error desconocido");
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-10 pb-16">
        <div role="alert" className="rounded border border-rosa p-5 text-2xl">
          No se pudo verificar el acceso. Revisa la conexión y recarga la página.
        </div>
      </main>
    );
  }

  if (!acceso) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-10 pb-16">
        <h1 className="text-4xl text-amarillo">Puerta</h1>
        {pinConfigurado() ? (
          <FormularioPin />
        ) : (
          <p role="alert" className="mt-6 rounded border border-rosa p-5 text-xl">
            El PIN de la puerta no está configurado (mínimo 6 caracteres). Los admins pueden entrar
            con su sesión.
          </p>
        )}
      </main>
    );
  }

  let ingresados = 0;
  try {
    ingresados = await contarIngresados();
  } catch (e) {
    console.error("puerta:", e instanceof Error ? e.message : "error desconocido");
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-10">
      <header className="flex items-center justify-between gap-4 font-lora text-base">
        <span className="text-apagado">{acceso.quien}</span>
        <div className="flex items-center gap-4">
          {acceso.esAdmin && (
            <Link href="/admin/asistentes/nuevo?origen=puerta" className="underline underline-offset-4">
              Registro rápido
            </Link>
          )}
          {!acceso.esAdmin && (
            <form action={salirPuerta}>
              <button type="submit" className="underline underline-offset-4">
                Salir
              </button>
            </form>
          )}
        </div>
      </header>
      <div className="mt-3">
        <Escaner ingresadosIniciales={ingresados} />
      </div>
    </main>
  );
}
