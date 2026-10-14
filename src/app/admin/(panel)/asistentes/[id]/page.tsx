import Link from "next/link";
import { notFound } from "next/navigation";
import { Estado } from "@/components/estado";
import { FormAccion } from "@/components/form-accion";
import { precioEntrada } from "@/config/evento";
import { exigirAdmin } from "@/lib/admin";
import { historialPagos, obtenerAsistente, tokenDe, type MovimientoPago } from "@/lib/asistentes";
import { urlEntrada } from "@/lib/correo";
import { fechaHora, soles } from "@/lib/formato";
import { idSchema } from "@/lib/validacion";
import {
  accionCancelar,
  accionEditar,
  accionMarcarPagado,
  accionReenviar,
  accionRevertir,
} from "../../../acciones";

const NOMBRE_ACCION: Record<MovimientoPago["accion"], string> = {
  marcar_pagado: "Marcó pagado",
  revertir: "Revirtió a pendiente",
  cancelar: "Canceló",
};

const ORIGEN = { web: "Formulario web", admin: "Registro manual", puerta: "Registro en puerta" };

const campo = "mt-1 w-full rounded border border-borde bg-fondo px-3 py-2";

// El reenvío del QR corre en esta página: margen para la conexión con Gmail.
export const maxDuration = 30;

export default async function Ficha({ params, searchParams }: PageProps<"/admin/asistentes/[id]">) {
  await exigirAdmin();
  const { id } = await params;
  const { aviso } = await searchParams;
  if (!idSchema.safeParse(id).success) notFound();

  const a = await obtenerAsistente(id);
  if (!a) notFound();
  const historial = await historialPagos(id);
  const token = a.estado === "pagado" ? await tokenDe(id) : null;
  const enlace = token ? urlEntrada(token) : null;
  const ultimoPago = historial.find((h) => h.accion === "marcar_pagado");

  return (
    <>
      <Link href="/admin/asistentes" className="font-lora text-sm text-apagado underline underline-offset-4">
        Volver a la lista
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl text-amarillo">{a.nombre}</h1>
        <Estado estado={a.estado} />
        {a.es_menor && <span className="rounded border border-rosa px-2 py-0.5 font-lora text-sm">Menor</span>}
      </div>

      {aviso === "pago-pendiente" && (
        <p role="alert" className="mt-4 rounded border border-rosa p-4 font-lora">
          El registro se creó, pero el pago no se pudo marcar. Márcalo abajo.
        </p>
      )}
      {aviso === "ingreso-pendiente" && (
        <p role="alert" className="mt-4 rounded border border-rosa p-4 font-lora">
          Quedó pagado, pero el ingreso no se pudo marcar. Escanéalo o búscalo por DNI en la puerta.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl">Datos</h2>
          <dl className="mt-3 divide-y divide-borde rounded border border-borde bg-tarjeta font-lora text-base">
            <Dato t="DNI">{a.dni}</Dato>
            <Dato t="Correo">{a.correo ?? "Sin correo"}</Dato>
            <Dato t="Celular">{a.celular}</Dato>
            <Dato t="Código">{a.codigo_corto ?? "Se genera al pagar"}</Dato>
            <Dato t="Origen">{ORIGEN[a.origen]}</Dato>
            <Dato t="Registrado">{fechaHora(a.creado_en)}</Dato>
            {a.pagado_en && (
              <Dato t="Pago">
                {soles(a.monto_pagado)}, {fechaHora(a.pagado_en)}
                {ultimoPago?.admin && `, por ${ultimoPago.admin.nombre}`}
              </Dato>
            )}
            <Dato t="Correo QR">
              {a.correo_enviado_en
                ? `Enviado ${fechaHora(a.correo_enviado_en)}`
                : a.correo_error
                  ? <span className="text-rosa">Falló ({a.correo_error})</span>
                  : "No enviado"}
            </Dato>
            {a.ingresado_en && (
              <Dato t="Ingreso">
                {fechaHora(a.ingresado_en)}, {a.ingresado_por}
              </Dato>
            )}
            {a.notas && <Dato t="Notas">{a.notas}</Dato>}
          </dl>
        </section>

        <section>
          <h2 className="text-2xl">Pago</h2>
          <div className="mt-3 space-y-6 rounded border border-borde bg-tarjeta p-4">
            {a.estado === "pendiente" && (
              <FormAccion accion={accionMarcarPagado.bind(null, a.id)} boton="Marcar pagado">
                <p>
                  Antes de marcar, confirma con quien paga que el nombre y el correo son suyos:{" "}
                  <strong>{a.nombre}</strong>, <strong>{a.correo ?? "sin correo"}</strong>.
                </p>
                <label className="block">
                  Monto recibido (S/)
                  <input
                    name="monto"
                    inputMode="decimal"
                    defaultValue={precioEntrada()}
                    required
                    className={`${campo} max-w-40`}
                  />
                </label>
              </FormAccion>
            )}

            {(a.estado === "pagado" || a.estado === "cancelado") && (
              <FormAccion
                accion={accionRevertir.bind(null, a.id)}
                boton={a.estado === "pagado" ? "Revertir pago" : "Volver a pendiente"}
                variante="secundario"
              >
                <p>
                  {a.estado === "pagado"
                    ? "Vuelve a pendiente de pago. El código y el QR se conservan."
                    : "Reactiva el registro como pendiente de pago."}
                </p>
              </FormAccion>
            )}

            {(a.estado === "pendiente" || a.estado === "pagado") && (
              <FormAccion accion={accionCancelar.bind(null, a.id)} boton="Cancelar registro" variante="secundario">
                <label className="flex gap-3">
                  <input type="checkbox" name="confirmo" className="mt-1 h-5 w-5 accent-rosa" />
                  <span>Sí, cancelar este registro. Su QR dejará de servir.</span>
                </label>
              </FormAccion>
            )}

            {a.estado === "ingresado" && <p className="font-lora">Ya ingresó. Su pago no se puede cambiar.</p>}
          </div>

          {a.estado === "pagado" && (
            <>
              <h2 className="mt-8 text-2xl">Entrada</h2>
              <div className="mt-3 space-y-4 rounded border border-borde bg-tarjeta p-4 font-lora text-base">
                {enlace && (
                  <p className="break-all">
                    Enlace para WhatsApp:{" "}
                    <a href={enlace} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      {enlace}
                    </a>
                  </p>
                )}
                {a.correo ? (
                  <FormAccion
                    accion={accionReenviar.bind(null, a.id)}
                    boton={a.correo_enviado_en ? "Reenviar QR por correo" : "Enviar QR por correo"}
                    variante="secundario"
                  />
                ) : (
                  <p className="text-apagado">Sin correo: comparte el enlace.</p>
                )}
              </div>
            </>
          )}

          <h2 className="mt-8 text-2xl">Historial</h2>
          <ul className="mt-3 divide-y divide-borde rounded border border-borde bg-tarjeta font-lora text-base">
            {historial.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-x-4 px-4 py-2">
                <span>
                  {NOMBRE_ACCION[h.accion]} {h.monto !== null && soles(h.monto)}
                </span>
                <span className="text-apagado">
                  {h.admin?.nombre}, {fechaHora(h.creado_en)}
                </span>
              </li>
            ))}
            {historial.length === 0 && <li className="px-4 py-2 text-apagado">Sin movimientos.</li>}
          </ul>
        </section>
      </div>

      <section className="mt-10 max-w-xl">
        <h2 className="text-2xl">Editar datos</h2>
        <FormAccion accion={accionEditar.bind(null, a.id)} boton="Guardar cambios" className="mt-3">
          <label className="block">
            DNI
            <input name="dni" defaultValue={a.dni} inputMode="numeric" maxLength={8} required className={campo} />
          </label>
          <label className="block">
            Nombre completo
            <input name="nombre" defaultValue={a.nombre} maxLength={120} required className={campo} />
          </label>
          <label className="block">
            Correo
            <input name="correo" type="email" defaultValue={a.correo ?? ""} maxLength={254} className={campo} />
          </label>
          <label className="block">
            Celular
            <input name="celular" type="tel" defaultValue={a.celular} maxLength={15} required className={campo} />
          </label>
          <label className="flex gap-3">
            <input type="checkbox" name="es_menor" defaultChecked={a.es_menor} className="mt-1 h-5 w-5 accent-naranja" />
            <span>Es menor de edad (la puerta muestra un aviso)</span>
          </label>
          <label className="block">
            Notas
            <textarea name="notas" defaultValue={a.notas ?? ""} maxLength={500} rows={3} className={campo} />
          </label>
        </FormAccion>
      </section>
    </>
  );
}

function Dato({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 px-4 py-2">
      <dt className="text-apagado">{t}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
