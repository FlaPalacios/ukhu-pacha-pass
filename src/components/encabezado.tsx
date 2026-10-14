import Link from "next/link";
import { evento } from "@/config/evento";
import { Chakana, Franja } from "./motivos";

export function Encabezado() {
  return (
    <header>
      <Franja />
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-amarillo">
          <Chakana className="h-8 w-8" />
          <span className="text-2xl leading-none">{evento.nombre}</span>
        </Link>
      </div>
    </header>
  );
}
