import Image from "next/image";
import Link from "next/link";
import { evento } from "@/config/evento";
import { CONTENEDOR } from "./atmosfera";
import { Franja } from "./motivos";

export function Encabezado() {
  return (
    <header className="relative z-10">
      <Franja />
      <div className={`${CONTENEDOR} flex items-center py-4`}>
        <Link href="/" className="flex items-center gap-3 text-amarillo">
          <Image src="/mascara.webp" alt="" width={40} height={46} className="h-11 w-auto" />
          <span className="text-2xl leading-none lg:text-3xl">{evento.nombre}</span>
        </Link>
      </div>
    </header>
  );
}
