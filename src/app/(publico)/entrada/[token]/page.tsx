import type { Metadata } from "next";
import { Niebla } from "@/components/atmosfera";
import { Encabezado } from "@/components/encabezado";
import { evento } from "@/config/evento";
import { entradaPorToken } from "@/lib/asistentes";
import { qrDataUrl, TOKEN_REGEX } from "@/lib/qr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu entrada | Ukhu Pacha Pass",
  robots: { index: false, follow: false },
};

// Página de solo lectura. Muestra el QR, el código y el nombre. Nunca el DNI.
export default async function Entrada({ params }: PageProps<"/entrada/[token]">) {
  const { token } = await params;
  const datos = TOKEN_REGEX.test(token) ? await entradaPorToken(token) : null;

  return (
    <div className="relative isolate flex flex-1 flex-col">
      <Niebla intensidad={0.45} />
      <Encabezado />
      <main className="relative mx-auto w-full max-w-lg flex-1 px-5 pt-6 pb-16">
        {!datos ? (
          <Aviso titulo="Entrada no encontrada">
            Revisa que el enlace esté completo. Si el problema sigue, habla con un coordinador.
          </Aviso>
        ) : datos.estado === "pagado" && datos.codigo_corto ? (
          <Valida nombre={datos.nombre} codigo={datos.codigo_corto} qr={await qrDataUrl(token)} />
        ) : datos.estado === "ingresado" ? (
          <Aviso titulo="Esta entrada ya se usó">
            {datos.nombre}, tu ingreso ya quedó registrado. El QR sirve una sola vez.
          </Aviso>
        ) : datos.estado === "cancelado" ? (
          <Aviso titulo="Entrada cancelada">Esta entrada fue cancelada. Habla con un coordinador.</Aviso>
        ) : (
          <Aviso titulo="Entrada no activa">
            Tu pago todavía no figura como registrado. Habla con un coordinador.
          </Aviso>
        )}
      </main>
    </div>
  );
}

function Valida({ nombre, codigo, qr }: { nombre: string; codigo: string; qr: string }) {
  return (
    <>
      <h1 className="text-5xl text-amarillo">Tu entrada</h1>
      <p className="mt-3 text-2xl">{nombre}</p>

      <div className="mt-6 rounded bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada en el servidor */}
        <img src={qr} alt="QR de tu entrada" width={480} height={480} className="mx-auto h-auto w-full max-w-80" />
      </div>

      <p className="mt-6 font-lora text-sm text-apagado">Código de respaldo</p>
      <p className="font-lora text-4xl tracking-[0.3em]">{codigo}</p>

      <dl className="mt-8 space-y-2 font-lora text-lg">
        <div>
          <dt className="inline text-apagado">Fecha: </dt>
          <dd className="inline">{evento.fecha}</dd>
        </div>
        <div>
          <dt className="inline text-apagado">Hora: </dt>
          <dd className="inline">{evento.hora}</dd>
        </div>
        <div>
          <dt className="inline text-apagado">Lugar: </dt>
          <dd className="inline">{evento.lugar}</dd>
        </div>
      </dl>

      <p className="mt-8">
        Muestra este QR en la puerta con el brillo de la pantalla alto. Si no carga, dicta tu código.
        No compartas esta entrada: sirve una sola vez.
      </p>
    </>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-rosa bg-fondo/80 p-6">
      <h1 className="text-4xl">{titulo}</h1>
      <p className="mt-3">{children}</p>
    </div>
  );
}
