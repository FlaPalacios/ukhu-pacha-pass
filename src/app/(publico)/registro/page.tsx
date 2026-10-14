import type { Metadata } from "next";
import { CONTENEDOR, Niebla } from "@/components/atmosfera";
import { Encabezado } from "@/components/encabezado";
import { evento } from "@/config/evento";
import { obtenerConfig } from "@/lib/config";
import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Registro | Ukhu Pacha Pass" };

export const revalidate = 60;

export default async function Registro() {
  const { precio } = await obtenerConfig();
  return (
    <div className="relative isolate flex flex-1 flex-col">
      <Niebla intensidad={0.55} />
      <Encabezado />
      <main className={`${CONTENEDOR} relative grid flex-1 gap-10 pt-8 pb-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:pt-14`}>
        <div>
          <h1 className="text-5xl text-amarillo lg:text-7xl">Regístrate</h1>
          <p className="mt-6 max-w-[30ch] text-[1.35rem] leading-relaxed lg:text-[1.6rem]">
            Después pagas <span className="font-lora">S/ {precio}</span> a un coordinador y te
            enviamos tu QR por correo.
          </p>
          <dl className="mt-10 space-y-3 border-l-4 border-morado pl-5 font-lora text-lg lg:text-xl">
            <div>
              <dt className="inline text-apagado">Cuándo: </dt>
              <dd className="inline">
                {evento.fecha}, {evento.hora.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="inline text-apagado">Dónde: </dt>
              <dd className="inline">{evento.referencia}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded border border-borde bg-tarjeta/85 p-6 sm:p-8 lg:p-10">
          <FormularioRegistro />
        </div>
      </main>
    </div>
  );
}
