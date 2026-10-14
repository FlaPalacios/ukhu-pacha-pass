// Motivos cusqueños en SVG simple: chakana, franja escalonada y apus con luna.

// Chakana de tres escalones por cuadrante, con el centro abierto.
const CHAKANA =
  "M3 0H6V1H7V2H8V3H9V6H8V7H7V8H6V9H3V8H2V7H1V6H0V3H1V2H2V1H3Z";

export function Chakana({ className = "", titulo }: { className?: string; titulo?: string }) {
  return (
    <svg
      viewBox="0 0 9 9"
      className={className}
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
    >
      <path d={`${CHAKANA}M4.5 3.4a1.1 1.1 0 1 0 0 2.2a1.1 1.1 0 1 0 0-2.2Z`} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

// Franja fina de escalones, como borde de textil.
export function Franja({ className = "" }: { className?: string }) {
  return (
    <svg className={`block h-2 w-full text-morado ${className}`} aria-hidden="true">
      <defs>
        <pattern id="franja-escalonada" width="16" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8V5H3V2H6V0H10V2H13V5H16V8Z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="8" fill="url(#franja-escalonada)" />
    </svg>
  );
}

// Silueta de cerros con una luna delgada, para el pie de la portada.
// Los cerros se estiran al ancho; la luna va aparte para no deformarse.
export function Apus({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-32 w-full ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="absolute top-0 right-[18%] h-9 w-9 text-texto">
        <path d="M12 3a8.5 8.5 0 0 0 9 9a9 9 0 1 1-9-9Z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="absolute bottom-0 h-24 w-full">
        <path
          d="M0 90V58L34 32L58 46L104 4L142 38L170 24L214 62L256 16L300 50L330 34L372 54L400 40V90Z"
          className="fill-morado-oscuro"
        />
      </svg>
    </div>
  );
}
