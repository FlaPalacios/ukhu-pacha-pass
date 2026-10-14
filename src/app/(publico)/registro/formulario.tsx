"use client";

import { useActionState, useState, type FormEvent } from "react";
import {
  leerFormularioRegistro,
  primerErrorPorCampo,
  registroSchema,
  type CampoRegistro,
  type ErroresRegistro,
} from "@/lib/validacion";
import { registrar, type EstadoRegistro } from "./acciones";

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState<EstadoRegistro, FormData>(registrar, {});
  const [erroresCliente, setErroresCliente] = useState<ErroresRegistro | null>(null);

  // Mismas reglas que el servidor, para avisar antes de enviar.
  function alEnviar(e: FormEvent<HTMLFormElement>) {
    const r = registroSchema.safeParse(leerFormularioRegistro(new FormData(e.currentTarget)));
    if (r.success) {
      setErroresCliente(null);
    } else {
      e.preventDefault();
      setErroresCliente(primerErrorPorCampo(r.error));
    }
  }

  const errores = erroresCliente ?? estado.errores ?? {};
  const v = estado.valores ?? {};

  return (
    <form action={accion} onSubmit={alEnviar} noValidate className="space-y-7">
      <Campo
        nombre="dni"
        etiqueta="DNI"
        error={errores.dni}
        valor={v.dni}
        inputMode="numeric"
        maxLength={8}
        autoComplete="off"
      />
      <Campo
        nombre="nombre"
        etiqueta="Nombre completo"
        error={errores.nombre}
        valor={v.nombre}
        autoComplete="name"
        maxLength={120}
      />
      <Campo
        nombre="correo"
        etiqueta="Correo"
        ayuda="Aquí te llega tu QR."
        error={errores.correo}
        valor={v.correo}
        type="email"
        autoComplete="email"
        maxLength={254}
      />
      <Campo
        nombre="celular"
        etiqueta="Celular"
        error={errores.celular}
        valor={v.celular}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={15}
      />

      {/* Campo trampa para bots. Oculto para personas y lectores de pantalla. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="sitio_web">No llenes este campo</label>
        <input id="sitio_web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Casilla nombre="acepto_datos" error={errores.acepto_datos}>
        Acepto que mi DNI, nombre, correo y celular se usen solo para mi entrada a esta fiesta.
        Se borran después del evento.
      </Casilla>
      <Casilla nombre="confirmo_edad" error={errores.confirmo_edad}>
        Confirmo que soy mayor de 18 años o que asisto con autorización de mis padres o
        apoderados.
      </Casilla>

      {estado.mensaje && (
        <p role="alert" className="rounded border border-rosa p-4">
          {estado.mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-naranja px-6 py-5 text-2xl text-tinta transition-colors hover:bg-amarillo disabled:opacity-60"
      >
        {enviando ? "Registrando..." : "Registrarme"}
      </button>
    </form>
  );
}

type PropsCampo = {
  nombre: CampoRegistro;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  valor?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "id" | "defaultValue">;

function Campo({ nombre, etiqueta, ayuda, error, valor, ...resto }: PropsCampo) {
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;
  return (
    <div>
      <label htmlFor={nombre} className="block text-2xl">
        {etiqueta}
      </label>
      {ayuda && (
        <p id={idAyuda} className="font-lora text-base text-apagado">
          {ayuda}
        </p>
      )}
      <input
        id={nombre}
        name={nombre}
        // key: al volver con error, el campo muestra lo último que se escribió
        key={valor}
        defaultValue={valor}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={[ayuda && idAyuda, error && idError].filter(Boolean).join(" ") || undefined}
        className={`mt-2 w-full rounded border bg-fondo/80 px-4 py-3.5 font-lora text-xl ${
          error ? "border-rosa" : "border-borde"
        }`}
        {...resto}
      />
      {error && (
        <p id={idError} className="mt-2 font-lora text-base text-rosa">
          {error}
        </p>
      )}
    </div>
  );
}

function Casilla({
  nombre,
  error,
  children,
}: {
  nombre: CampoRegistro;
  error?: string;
  children: React.ReactNode;
}) {
  const idError = `${nombre}-error`;
  return (
    <div>
      <label className="flex gap-3">
        <input
          type="checkbox"
          name={nombre}
          className="mt-1.5 h-6 w-6 shrink-0 accent-naranja"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={idError} className="mt-2 font-lora text-base text-rosa">
          {error}
        </p>
      )}
    </div>
  );
}
