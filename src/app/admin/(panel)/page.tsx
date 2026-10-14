import { Cifra } from "@/components/cifra";
import { FormAccion } from "@/components/form-accion";
import { exigirAdmin } from "@/lib/admin";
import { soles } from "@/lib/formato";
import { calcularResumen } from "@/lib/resumen";
import { accionGuardarConfig } from "../acciones";

const campo = "mt-1 block w-32 rounded border border-borde bg-fondo px-3 py-2";

export default async function Resumen() {
  await exigirAdmin();
  const r = await calcularResumen();

  return (
    <>
      <h1 className="text-4xl text-amarillo">Resumen</h1>

      <h2 className="mt-8 text-2xl">Asistentes</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Cifra t="Registrados" n={r.registrados} detalle="sin cancelados" />
        <Cifra t="Pendientes de pago" n={r.pendientes} />
        <Cifra t="Pagados sin ingresar" n={r.pagados} />
        <Cifra t="Ingresados" n={r.ingresados} detalle={`${r.porcentajeIngreso} % de los que pagaron`} />
        <Cifra t="Cancelados" n={r.cancelados} />
        <Cifra t="Menores" n={r.menores} detalle="entre los que pagaron" />
      </dl>

      <h2 className="mt-8 text-2xl">Aforo</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Cifra
          t="Entradas vendidas"
          n={`${r.vendidas} / ${r.aforo}`}
          detalle={`${r.porcentajeAforo} % del aforo`}
          tono={r.vendidas > r.aforo ? "alerta" : undefined}
        />
      </dl>

      <h2 className="mt-8 text-2xl">Dinero</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra t="Recaudado" n={soles(r.recaudado)} />
        <Cifra t="Gastos" n={soles(r.gastos)} />
        <Cifra t="Balance" n={soles(r.balance)} tono={r.balance < 0 ? "alerta" : "bien"} />
        <Cifra
          t="Punto de equilibrio"
          n={`${r.equilibrio} entradas`}
          detalle={r.faltanEquilibrio ? `faltan ${r.faltanEquilibrio}` : "cubierto"}
        />
      </dl>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded border border-borde bg-tarjeta p-4">
          <h2 className="text-2xl">Respaldo en CSV</h2>
          <p className="mt-2 font-lora text-base text-apagado">
            Descárgalo el viernes 30 y el sábado en la mañana. Se abre en Excel.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 font-lora">
            <a href="/api/admin/exportar?tipo=pagados" className="rounded bg-naranja px-5 py-3 text-tinta">
              Descargar pagados
            </a>
            <a href="/api/admin/exportar" className="rounded border border-borde px-5 py-3">
              Descargar todos
            </a>
          </div>
        </section>

        <section className="rounded border border-borde bg-tarjeta p-4">
          <h2 className="text-2xl">Configuración</h2>
          <FormAccion accion={accionGuardarConfig} boton="Guardar" variante="secundario" className="mt-3">
            <div className="flex flex-wrap gap-6">
              <label>
                Precio de la entrada (S/)
                <input name="precio" inputMode="decimal" defaultValue={r.precio} required className={campo} />
              </label>
              <label>
                Aforo
                <input name="aforo" inputMode="numeric" defaultValue={r.aforo} required className={campo} />
              </label>
            </div>
            <p className="text-sm text-apagado">
              El precio nuevo se usa en la página pública, en los correos y como monto sugerido al marcar
              un pago. Los pagos ya marcados no cambian.
            </p>
          </FormAccion>
        </section>
      </div>
    </>
  );
}
