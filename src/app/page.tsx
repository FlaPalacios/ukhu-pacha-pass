import Link from "next/link";
import { evento } from "@/config/evento";
import { obtenerConfig } from "@/lib/config";
import { Apus, Chakana, Franja } from "@/components/motivos";

// El precio sale de la configuración; la página se regenera cada minuto.
export const revalidate = 60;

export default async function Inicio() {
  const { precio } = await obtenerConfig();

  return (
    <>
      <Franja />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-12 pb-8">
        <Chakana className="h-12 w-12 text-amarillo" titulo="Chakana" />
        <h1 className="mt-6 text-5xl leading-tight text-amarillo">{evento.nombre}</h1>
        <p className="mt-2 text-xl italic">{evento.subtitulo}</p>

        <p className="mt-8 text-xl">
          Halloween en la víspera de Todos los Santos, la noche en que las ánimas salen a
          pasear. Ven disfrazado.
        </p>

        <dl className="mt-10 divide-y divide-borde rounded border border-borde bg-tarjeta">
          <Dato titulo="Fecha">{evento.fecha}</Dato>
          <Dato titulo="Hora">{evento.hora}</Dato>
          <Dato titulo="Lugar">{evento.lugar}</Dato>
          <Dato titulo="Entrada">S/ {precio}</Dato>
        </dl>

        <h2 className="mt-12 text-3xl">Cómo conseguir tu entrada</h2>
        <ol className="mt-4 space-y-4">
          <Paso n={1}>Regístrate con tu DNI. Quedas en la lista como pendiente de pago.</Paso>
          <Paso n={2}>
            Paga <span className="font-lora">S/ {precio}</span> a un coordinador por{" "}
            {evento.formasDePago}.
          </Paso>
          <Paso n={3}>
            Cuando se registre tu pago, te llega al correo un QR y un código de respaldo. Ese
            QR es tu entrada.
          </Paso>
        </ol>

        <p className="mt-10 rounded border border-borde bg-morado-oscuro p-4">
          Habrá alcohol solo para mayores de <span className="font-lora">18</span> años. Si eres menor de edad, ven con
          autorización de tus padres o apoderados.
        </p>

        <Link
          href="/registro"
          className="mt-10 block rounded bg-naranja px-6 py-4 text-center text-2xl text-tinta"
        >
          Registrarme
        </Link>
      </main>
      <Apus />
    </>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
      <dt className="w-24 shrink-0 font-lora text-sm uppercase tracking-wide text-apagado">
        {titulo}
      </dt>
      <dd className="font-lora">{children}</dd>
    </div>
  );
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-morado font-lora text-base">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
