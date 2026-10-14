import type { Metadata } from "next";
import Link from "next/link";
import { CONTENEDOR, Niebla } from "@/components/atmosfera";
import { Encabezado } from "@/components/encabezado";
import { evento } from "@/config/evento";
import { obtenerConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Registro listo | Ukhu Pacha Pass" };

export const revalidate = 60;

export default async function RegistroListo() {
  const { precio } = await obtenerConfig();

  return (
    <div className="relative isolate flex flex-1 flex-col">
      <Niebla intensidad={0.55} />
      <Encabezado />
      <main className={`${CONTENEDOR} relative grid flex-1 gap-10 pt-8 pb-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:pt-14`}>
        <div>
          <h1 className="text-5xl text-amarillo lg:text-7xl">Ya estás en la lista</h1>
          <p className="mt-8 text-2xl">
            Tu estado es{" "}
            <span className="whitespace-nowrap rounded bg-naranja px-3 py-1 font-lora text-xl text-tinta">
              Pendiente de pago
            </span>
          </p>
          <Link href="/" className="mt-10 inline-block text-xl underline underline-offset-4">
            Volver al inicio
          </Link>
        </div>

        <div>
          <h2 className="text-3xl lg:text-4xl">Para tener tu entrada</h2>
          <ol className="mt-8 space-y-6">
            <Paso n={1}>
              Paga <span className="font-lora">S/ {precio}</span> por {evento.formasDePago}.
            </Paso>
            <Paso n={2}>
              Págale a uno de estos coordinadores: {evento.coordinadores}. Dile tu DNI y tu correo
              para que te encuentre en la lista.
            </Paso>
            <Paso n={3}>
              Cuando registre tu pago, te llega al correo tu QR y un código de 6 letras. Muéstralo en
              la puerta.
            </Paso>
          </ol>
          <p className="mt-10 border-l-4 border-morado bg-morado-oscuro/60 px-6 py-5 font-lora text-lg">
            Si no ves el correo, revisa la carpeta de spam. Los QR se envían por grupos en los días
            previos a la fiesta.
          </p>
        </div>
      </main>
    </div>
  );
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-morado font-lora text-xl">
        {n}
      </span>
      <span className="text-[1.3rem] leading-relaxed lg:text-[1.45rem]">{children}</span>
    </li>
  );
}
