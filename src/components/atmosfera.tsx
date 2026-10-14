// Niebla en capas para las páginas públicas. Dos capas que derivan en sentidos opuestos
// a distinta velocidad, más un tinte morado oscuro abajo, donde "vive" la niebla.

export const CONTENEDOR = "mx-auto w-full px-5 sm:px-8 lg:w-[70vw] lg:max-w-[1500px] lg:px-0";

export function Niebla({ intensidad = 1, className = "" }: { intensidad?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-morado-oscuro/50 [mask-image:linear-gradient(to_top,transparent,black_35%,transparent)]" />
      {/* La niebla se junta en la parte baja, se despeja hacia arriba y se desvanece en el borde. */}
      <div className="absolute inset-0 [mask-image:linear-gradient(to_top,transparent,black_22%,rgba(0,0,0,0.35)_58%,transparent_92%)]">
        <div className="niebla" style={{ opacity: 0.13 * intensidad }} />
        <div className="niebla niebla-lenta" style={{ opacity: 0.09 * intensidad, backgroundPosition: "600px 220px" }} />
      </div>
    </div>
  );
}
