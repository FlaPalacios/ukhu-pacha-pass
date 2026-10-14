"use client";

import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import type { ResultadoAccion } from "@/lib/resultado";

type Props = {
  accion: (previo: ResultadoAccion, fd: FormData) => Promise<ResultadoAccion>;
  boton: string;
  variante?: "principal" | "secundario";
  className?: string;
  children?: ReactNode;
};

// Formulario del panel: envía a una acción del servidor y muestra el resultado.
// No vacía los campos si la acción devuelve un error.
export function FormAccion({ accion, boton, variante = "principal", className = "", children }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, {});

  function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => enviar(fd));
  }

  const estilo =
    variante === "principal"
      ? "bg-naranja text-tinta"
      : "border border-rosa text-texto";

  return (
    <form onSubmit={alEnviar} className={`space-y-4 font-lora text-base ${className}`}>
      {children}
      <button
        type="submit"
        disabled={enviando}
        className={`rounded px-5 py-3 font-fell text-xl disabled:opacity-60 ${estilo}`}
      >
        {enviando ? "Un momento..." : boton}
      </button>
      {estado.ok && (
        <p role="status" className="text-menta">
          {estado.ok}
        </p>
      )}
      {estado.error && (
        <p role="alert" className="text-rosa">
          {estado.error}
        </p>
      )}
    </form>
  );
}
