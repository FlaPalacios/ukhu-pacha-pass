import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Franja } from "@/components/motivos";
import { exigirAdmin } from "@/lib/admin";
import { salir } from "../acciones";

export const metadata: Metadata = {
  title: "Admin | Ukhu Pacha Pass",
  robots: { index: false, follow: false },
};

// Cada página y acción vuelve a exigir la sesión; este control es solo el primero.
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await exigirAdmin();

  return (
    <>
      <Franja />
      <header className="border-b border-borde">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin/asistentes" className="flex items-center gap-2 text-amarillo">
            <Image src="/mascara.webp" alt="" width={28} height={32} className="h-8 w-auto" />
            <span className="text-xl">Panel</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 font-lora text-base">
            <Link href="/admin">Resumen</Link>
            <Link href="/admin/asistentes">Asistentes</Link>
            <Link href="/admin/asistentes/nuevo">Registro manual</Link>
            <Link href="/admin/correos">Enviar QR</Link>
            <Link href="/admin/gastos">Gastos</Link>
            <Link href="/puerta">Puerta</Link>
          </nav>
          <div className="ml-auto flex items-center gap-4 font-lora text-sm text-apagado">
            <span>{admin.nombre}</span>
            <form action={salir}>
              <button type="submit" className="underline underline-offset-4">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16">{children}</main>
    </>
  );
}
