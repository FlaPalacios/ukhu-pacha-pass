import { Cifra } from "@/components/cifra";
import { FormAccion } from "@/components/form-accion";
import { exigirAdmin } from "@/lib/admin";
import { soles } from "@/lib/formato";
import { calcularResumen, listarGastos } from "@/lib/resumen";
import { accionCrearGasto, accionEliminarGasto } from "../../acciones";

const campo = "mt-1 w-full rounded border border-borde bg-fondo px-3 py-2";

const FECHA = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

export default async function Gastos() {
  await exigirAdmin();
  const [r, gastos] = await Promise.all([calcularResumen(), listarGastos()]);

  return (
    <>
      <h1 className="text-4xl text-amarillo">Gastos</h1>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra t="Recaudado" n={soles(r.recaudado)} />
        <Cifra t="Gastos" n={soles(r.gastos)} />
        <Cifra t="Balance" n={soles(r.balance)} tono={r.balance < 0 ? "alerta" : "bien"} />
        <Cifra
          t="Punto de equilibrio"
          n={`${r.equilibrio} entradas`}
          detalle={`a S/ ${r.precio}; ${r.faltanEquilibrio ? `faltan ${r.faltanEquilibrio}` : "cubierto"}`}
        />
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <section className="rounded border border-borde bg-tarjeta p-4">
          <h2 className="text-2xl">Nuevo gasto</h2>
          <FormAccion accion={accionCrearGasto} boton="Agregar gasto" className="mt-3">
            <label className="block">
              Concepto
              <input name="concepto" maxLength={120} required placeholder="Sonido, decoración, hielo..." className={campo} />
            </label>
            <label className="block">
              Monto (S/)
              <input name="monto" inputMode="decimal" required className={`${campo} max-w-40`} />
            </label>
            <label className="block">
              Fecha (opcional, por defecto hoy)
              <input name="fecha" type="date" className={`${campo} max-w-48`} />
            </label>
          </FormAccion>
        </section>

        <section>
          <h2 className="text-2xl">Lista</h2>
          <ul className="mt-3 divide-y divide-borde rounded border border-borde bg-tarjeta font-lora text-base">
            {gastos.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="w-14 text-apagado">{FECHA.format(new Date(g.fecha))}</span>
                <span className="min-w-0 flex-1 break-words">{g.concepto}</span>
                <span className="text-apagado">{g.admin?.nombre}</span>
                <span className="w-24 text-right">{soles(Number(g.monto))}</span>
                <FormAccion accion={accionEliminarGasto.bind(null, g.id)} boton="Quitar" variante="secundario" className="[&_button]:px-3 [&_button]:py-1 [&_button]:text-base" />
              </li>
            ))}
            {gastos.length === 0 && <li className="px-4 py-6 text-apagado">Todavía no hay gastos.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
