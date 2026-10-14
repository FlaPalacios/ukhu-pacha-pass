import { FormAccion } from "@/components/form-accion";
import { exigirAdmin } from "@/lib/admin";
import { resumenCorreos } from "@/lib/asistentes";
import { MAX_LOTE } from "@/lib/envios";
import { accionEnviarLote } from "../../acciones";

// El envío de un lote corre dentro de esta página: se le da más tiempo en Vercel.
export const maxDuration = 60;

export default async function Correos() {
  await exigirAdmin();
  const r = await resumenCorreos();

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl text-amarillo">Enviar QR</h1>
      <p className="mt-2 font-lora text-base text-apagado">
        Solo a pagados con correo. Gmail permite unos cientos de correos por día: envía por lotes,
        en varios días.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 font-lora sm:grid-cols-4">
        <Cifra t="Por enviar" n={r.listos} />
        <Cifra t="Con error" n={r.fallidos} alerta={r.fallidos > 0} />
        <Cifra t="Enviados" n={r.enviados} />
        <Cifra t="Sin correo" n={r.sinCorreo} />
      </dl>

      <section className="mt-8 rounded border border-borde bg-tarjeta p-4">
        <h2 className="text-2xl">Lote nuevo</h2>
        <FormAccion accion={accionEnviarLote} boton="Enviar QR" className="mt-3">
          <input type="hidden" name="tipo" value="nuevos" />
          <label className="block">
            Cuántos en este lote (máximo {MAX_LOTE})
            <input
              name="cantidad"
              type="number"
              min={1}
              max={MAX_LOTE}
              defaultValue={Math.min(20, MAX_LOTE)}
              className="mt-1 block w-28 rounded border border-borde bg-fondo px-3 py-2"
            />
          </label>
        </FormAccion>
      </section>

      {r.fallidos > 0 && (
        <section className="mt-6 rounded border border-rosa bg-tarjeta p-4">
          <h2 className="text-2xl">Reintentar los que fallaron</h2>
          <p className="mt-1 font-lora text-base">
            Si vuelven a fallar, revisa el correo en su ficha y corrígelo.
          </p>
          <FormAccion accion={accionEnviarLote} boton="Reintentar" variante="secundario" className="mt-3">
            <input type="hidden" name="tipo" value="fallidos" />
            <input type="hidden" name="cantidad" value={MAX_LOTE} />
          </FormAccion>
        </section>
      )}

      {r.sinCorreo > 0 && (
        <p className="mt-6 font-lora text-base text-apagado">
          Los {r.sinCorreo} pagados sin correo no reciben QR por aquí. Desde su ficha se puede copiar el
          enlace de su entrada para mandarlo por WhatsApp.
        </p>
      )}
    </div>
  );
}

function Cifra({ t, n, alerta = false }: { t: string; n: number; alerta?: boolean }) {
  return (
    <div className={`rounded border bg-tarjeta px-4 py-3 ${alerta ? "border-rosa" : "border-borde"}`}>
      <dt className="text-sm text-apagado">{t}</dt>
      <dd className="text-3xl">{n}</dd>
    </div>
  );
}
