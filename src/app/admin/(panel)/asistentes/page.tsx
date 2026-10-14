import Link from "next/link";
import { Estado, NOMBRE_ESTADO } from "@/components/estado";
import { exigirAdmin } from "@/lib/admin";
import { listarAsistentes, type EstadoAsistente } from "@/lib/asistentes";
import { normalizar } from "@/lib/formato";

const ESTADOS: EstadoAsistente[] = ["pendiente", "pagado", "ingresado", "cancelado"];

export default async function Asistentes({ searchParams }: PageProps<"/admin/asistentes">) {
  await exigirAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const filtro = ESTADOS.find((e) => e === sp.estado);

  // Son pocos cientos de filas: se filtra aquí, sin armar consultas con el texto buscado.
  const todos = await listarAsistentes();
  const conteo = Object.fromEntries(ESTADOS.map((e) => [e, todos.filter((a) => a.estado === e).length]));
  const buscado = normalizar(q);
  const lista = todos.filter(
    (a) =>
      (!filtro || a.estado === filtro) &&
      (!buscado ||
        [a.nombre, a.dni, a.correo ?? "", a.celular, a.codigo_corto ?? ""].some((campo) =>
          normalizar(campo).includes(buscado),
        )),
  );

  const enlace = (estado?: EstadoAsistente) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (estado) p.set("estado", estado);
    const s = p.toString();
    return s ? `/admin/asistentes?${s}` : "/admin/asistentes";
  };

  return (
    <>
      <h1 className="text-4xl text-amarillo">Asistentes</h1>

      <form className="mt-6 flex gap-2 font-lora" action="/admin/asistentes">
        {filtro && <input type="hidden" name="estado" value={filtro} />}
        <label htmlFor="q" className="sr-only">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Nombre, DNI, correo, celular o código"
          className="min-w-0 flex-1 rounded border border-borde bg-tarjeta px-4 py-3 text-base"
        />
        <button type="submit" className="rounded border border-borde px-4 font-fell text-lg">
          Buscar
        </button>
      </form>

      <nav className="mt-4 flex flex-wrap gap-2 font-lora text-sm" aria-label="Filtrar por estado">
        <Filtro href={enlace()} activo={!filtro}>
          Todos ({todos.length})
        </Filtro>
        {ESTADOS.map((e) => (
          <Filtro key={e} href={enlace(e)} activo={filtro === e}>
            {NOMBRE_ESTADO[e]} ({conteo[e]})
          </Filtro>
        ))}
      </nav>

      <p className="mt-6 font-lora text-sm text-apagado">
        {lista.length} {lista.length === 1 ? "resultado" : "resultados"}
      </p>

      <ul className="mt-2 divide-y divide-borde rounded border border-borde bg-tarjeta font-lora">
        {lista.map((a) => (
          <li key={a.id}>
            <Link
              href={`/admin/asistentes/${a.id}`}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[1fr_8rem_6rem_7rem]"
            >
              <span className="text-base">
                {a.nombre}
                {a.es_menor && <span className="ml-2 text-sm text-rosa">Menor</span>}
              </span>
              <span className="text-sm text-apagado sm:order-none sm:text-base sm:text-texto">{a.dni}</span>
              <span className="text-sm text-apagado sm:text-base sm:text-texto">{a.codigo_corto ?? "------"}</span>
              <span className="justify-self-end sm:justify-self-start">
                <Estado estado={a.estado} />
              </span>
            </Link>
          </li>
        ))}
        {lista.length === 0 && <li className="px-4 py-6 text-apagado">No hay coincidencias.</li>}
      </ul>
    </>
  );
}

function Filtro({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`rounded border px-3 py-1 ${activo ? "border-texto" : "border-borde text-apagado"}`}
    >
      {children}
    </Link>
  );
}
