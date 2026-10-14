import Image from "next/image";
import Link from "next/link";
import { CONTENEDOR, Niebla } from "@/components/atmosfera";
import { Apus, Franja } from "@/components/motivos";
import { evento } from "@/config/evento";
import { obtenerConfig } from "@/lib/config";

// El precio sale de la configuración; la página se regenera cada minuto.
export const revalidate = 60;

const BOTON = "inline-block rounded bg-naranja px-10 py-5 text-center text-2xl text-tinta transition-colors hover:bg-amarillo";

export default async function Inicio() {
  const { precio } = await obtenerConfig();

  return (
    <>
      <Franja />

      {/* La máscara sale de la niebla: el único momento animado de la página. */}
      <section className="relative isolate overflow-hidden">
        <Niebla />
        <div className={`${CONTENEDOR} relative grid items-center gap-8 py-12 lg:min-h-[min(88svh,880px)] lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-16`}>
          <div className="order-2 lg:order-1">
            <h1 className="text-[clamp(3.2rem,6.4vw,7.5rem)] leading-[0.92] text-amarillo">
              <span className="whitespace-nowrap">Ukhu Pacha</span>
              <br />
              Pass
            </h1>
            <p className="mt-5 text-2xl italic lg:text-3xl">{evento.subtitulo}</p>
            <p className="mt-8 max-w-[32ch] text-[1.35rem] leading-relaxed lg:text-[1.6rem]">
              Halloween en la víspera de Todos los Santos, la noche en que las ánimas salen a pasear.
              Ven disfrazado.
            </p>

            <dl className="mt-10 grid grid-cols-1 divide-y divide-borde border-y border-borde font-lora sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Dato titulo="Fecha">Sábado 31 de octubre</Dato>
              <Dato titulo="Hora">{evento.hora}</Dato>
              <Dato titulo="Entrada">S/ {precio}</Dato>
            </dl>

            <Link href="/registro" className={`${BOTON} mt-10`}>
              Registrarme
            </Link>
          </div>

          <div className="relative order-1 mx-auto w-[min(62vw,280px)] lg:order-2 lg:w-full lg:max-w-[540px]">
            <Image
              src="/mascara.webp"
              alt="Máscara de diablada, el emblema de Ukhu Pacha Pass"
              width={640}
              height={728}
              priority
              className="aparece relative h-auto w-full"
            />
            {/* Niebla delante de la barbilla: la máscara parece emerger de ella. */}
            <div className="absolute -inset-x-1/3 -bottom-[8%] h-[45%] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]">
              <div className="niebla disipa" style={{ ["--opacidad-final" as string]: 0.4 }} />
            </div>
          </div>
        </div>
      </section>

      <section className={`${CONTENEDOR} py-16 lg:py-24`}>
        <h2 className="text-4xl lg:text-5xl">Cómo conseguir tu entrada</h2>
        <ol className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-14">
          <Paso n={1}>Regístrate con tu DNI. Quedas en la lista como pendiente de pago.</Paso>
          <Paso n={2}>
            Paga <span className="font-lora">S/ {precio}</span> a un coordinador por {evento.formasDePago}.
          </Paso>
          <Paso n={3}>
            Cuando se registre tu pago, te llega al correo un QR y un código de respaldo. Ese QR es tu
            entrada.
          </Paso>
        </ol>
        <p className="mt-14 max-w-3xl border-l-4 border-morado bg-morado-oscuro/60 px-6 py-5">
          Habrá alcohol solo para mayores de <span className="font-lora">18</span> años. Si eres menor de
          edad, ven con autorización de tus padres o apoderados.
        </p>
      </section>

      <section className="relative isolate overflow-hidden border-t border-borde">
        <Niebla intensidad={0.6} />
        <div className={`${CONTENEDOR} relative grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:py-24`}>
          <div>
            <h2 className="text-4xl lg:text-5xl">Dónde</h2>
            <p className="mt-6 text-2xl lg:text-3xl">{evento.referencia}.</p>
            <p className="mt-2 text-xl text-apagado">{evento.zona}</p>
            <a
              href={evento.mapa.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded border border-texto/70 px-8 py-4 text-xl transition-colors hover:border-amarillo hover:text-amarillo"
            >
              Ver en Google Maps
            </a>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded border border-borde bg-tarjeta lg:aspect-[16/10]">
            {/* Respaldo: se ve mientras carga el mapa o si el navegador lo bloquea. */}
            <p className="absolute inset-0 flex items-center justify-center p-6 text-center font-lora text-lg text-apagado">
              Cargando el mapa...
            </p>
            <iframe
              src={evento.mapa.embebido}
              title="Mapa: a una cuadra del Colegio Santa María de los Andes"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="relative h-full w-full [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.55)_brightness(0.95)]"
            />
          </div>
        </div>
      </section>

      <section className="relative">
        <div className={`${CONTENEDOR} relative z-10 flex flex-col items-start gap-6 pt-12 pb-16 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="text-3xl lg:text-4xl">Te esperamos del otro lado.</p>
          <Link href="/registro" className={BOTON}>
            Registrarme
          </Link>
        </div>
        <Apus />
      </section>
    </>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="py-4 sm:px-5 sm:first:pl-0 lg:px-6">
      <dt className="text-base text-apagado">{titulo}</dt>
      <dd className="mt-1 text-xl lg:text-2xl">{children}</dd>
    </div>
  );
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-5 lg:flex-col">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-morado font-lora text-2xl">
        {n}
      </span>
      <span className="text-[1.3rem] leading-relaxed lg:text-[1.45rem]">{children}</span>
    </li>
  );
}
