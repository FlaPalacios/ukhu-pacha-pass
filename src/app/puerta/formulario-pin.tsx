"use client";

import { useActionState } from "react";
import { PUESTOS } from "@/lib/puerta-tipos";
import { entrarConPin } from "./acciones";

export function FormularioPin() {
  const [estado, accion, enviando] = useActionState(entrarConPin, {});

  return (
    <form action={accion} className="mt-6 space-y-4">
      <fieldset>
        <legend className="text-2xl">Puesto</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {PUESTOS.map((p, i) => (
            <label key={p} className="flex items-center justify-center gap-3 rounded border border-borde bg-tarjeta py-4 text-2xl">
              <input type="radio" name="puesto" value={p} defaultChecked={i === 0} className="h-6 w-6 accent-naranja" />
              {p}
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor="pin" className="block text-2xl">
        PIN de la puerta
      </label>
      <input
        id="pin"
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        required
        maxLength={32}
        className="w-full rounded border border-borde bg-tarjeta px-4 py-4 font-lora text-3xl tracking-widest"
      />
      {estado.error && (
        <p role="alert" className="text-xl text-rosa">
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded bg-naranja py-5 text-3xl text-tinta disabled:opacity-60"
      >
        {enviando ? "Verificando..." : "Entrar"}
      </button>
    </form>
  );
}
