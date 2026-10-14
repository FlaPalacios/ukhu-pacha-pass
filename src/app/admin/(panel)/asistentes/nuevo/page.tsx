import { FormAccion } from "@/components/form-accion";
import { precioEntrada } from "@/config/evento";
import { exigirAdmin } from "@/lib/admin";
import { accionCrearAsistente } from "../../../acciones";

const campo = "mt-1 w-full rounded border border-borde bg-tarjeta px-3 py-2";

export default async function Nuevo({ searchParams }: PageProps<"/admin/asistentes/nuevo">) {
  await exigirAdmin();
  const enPuerta = (await searchParams).origen === "puerta";

  return (
    <div className="max-w-xl">
      <h1 className="text-4xl text-amarillo">{enPuerta ? "Registro en puerta" : "Registro manual"}</h1>
      <p className="mt-2 font-lora text-base text-apagado">
        Para quien paga a un coordinador sin haberse registrado, o en la puerta.
      </p>

      <FormAccion accion={accionCrearAsistente} boton="Registrar" className="mt-6">
        <label className="block">
          DNI
          <input name="dni" inputMode="numeric" maxLength={8} required className={campo} />
        </label>
        <label className="block">
          Nombre completo
          <input name="nombre" maxLength={120} required className={campo} />
        </label>
        <label className="block">
          Celular
          <input name="celular" type="tel" maxLength={15} required className={campo} />
        </label>
        <label className="block">
          Correo (opcional)
          <input name="correo" type="email" maxLength={254} className={campo} />
          <span className="text-sm text-apagado">Sin correo no se le puede enviar el QR.</span>
        </label>
        <fieldset>
          <legend>Origen</legend>
          <div className="mt-1 flex gap-6">
            <label className="flex items-center gap-2">
              <input type="radio" name="origen" value="admin" defaultChecked={!enPuerta} className="accent-naranja" />
              Coordinador
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="origen" value="puerta" defaultChecked={enPuerta} className="accent-naranja" />
              Puerta
            </label>
          </div>
        </fieldset>
        <label className="flex gap-3">
          <input type="checkbox" name="es_menor" className="mt-1 h-5 w-5 accent-naranja" />
          <span>Es menor de edad</span>
        </label>

        <div className="rounded border border-borde p-4">
          <label className="flex gap-3">
            <input type="checkbox" name="pagar" defaultChecked={enPuerta} className="mt-1 h-5 w-5 accent-naranja" />
            <span>Ya pagó: registrarlo como pagado</span>
          </label>
          <label className="mt-3 block">
            Monto recibido (S/)
            <input name="monto" inputMode="decimal" defaultValue={precioEntrada()} className={`${campo} max-w-40`} />
          </label>
          <label className="mt-3 flex gap-3">
            <input type="checkbox" name="ingresar" defaultChecked={enPuerta} className="mt-1 h-5 w-5 accent-naranja" />
            <span>Marcar su ingreso ahora (ya está en la puerta)</span>
          </label>
        </div>
      </FormAccion>
    </div>
  );
}
