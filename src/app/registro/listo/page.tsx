import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { evento } from "@/config/evento";
import { obtenerConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Registro listo | Ukhu Pacha Pass" };

export const revalidate = 60;

export default async function RegistroListo() {
  const { precio } = await obtenerConfig();

  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-16">
        <h1 className="text-4xl text-amarillo">Ya estás en la lista</h1>
        <p className="mt-4">
          Tu estado es{" "}
          <span className="rounded bg-naranja px-2 py-0.5 font-lora text-base text-tinta">
            Pendiente de pago
          </span>
        </p>

        <h2 className="mt-10 text-3xl">Para tener tu entrada</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6">
          <li>
            Paga <span className="font-lora">S/ {precio}</span> por {evento.formasDePago}.
          </li>
          <li>
            Págale a uno de estos coordinadores: {evento.coordinadores}. Dile tu DNI y tu
            correo para que te encuentre en la lista.
          </li>
          <li>
            Cuando registre tu pago, te llega al correo tu QR y un código de 6 letras. Muéstralo
            en la puerta.
          </li>
        </ol>

        <p className="mt-10 rounded border border-borde bg-tarjeta p-4 font-lora text-base">
          Si no ves el correo, revisa la carpeta de spam. Los QR se envían por grupos en los días
          previos a la fiesta.
        </p>

        <Link href="/" className="mt-10 inline-block underline underline-offset-4">
          Volver al inicio
        </Link>
      </main>
    </>
  );
}
