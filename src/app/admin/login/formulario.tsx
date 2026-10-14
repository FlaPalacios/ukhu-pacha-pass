"use client";

import { useActionState } from "react";
import { iniciarSesion } from "../acciones";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, {});

  return (
    <form action={accion} className="mt-8 space-y-5 font-lora">
      <div>
        <label htmlFor="correo" className="block font-fell text-xl">
          Correo
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="username"
          required
          className="mt-2 w-full rounded border border-borde bg-tarjeta px-4 py-3 text-lg"
        />
      </div>
      <div>
        <label htmlFor="clave" className="block font-fell text-xl">
          Contraseña
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded border border-borde bg-tarjeta px-4 py-3 text-lg"
        />
      </div>
      {estado.error && (
        <p role="alert" className="text-rosa">
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-naranja px-6 py-4 font-fell text-2xl text-tinta disabled:opacity-60"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
