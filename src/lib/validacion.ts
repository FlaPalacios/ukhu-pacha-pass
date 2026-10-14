import { z } from "zod";

// Reglas compartidas por el formulario (cliente) y la acción (servidor).

export const dniSchema = z.string().trim().regex(/^\d{8}$/, "El DNI tiene 8 dígitos.");

export const registroSchema = z.object({
  dni: dniSchema,
  nombre: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(3, "Escribe tu nombre completo.")
        .max(120, "El nombre es demasiado largo.")
        .regex(/^[\p{L}' .-]+$/u, "Usa solo letras en el nombre."),
    ),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Revisa tu correo.").max(254, "El correo es demasiado largo.")),
  celular: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?51(?=9\d{8}$)/, ""))
    .pipe(z.string().regex(/^9\d{8}$/, "El celular tiene 9 dígitos y empieza con 9.")),
  acepto_datos: z.literal("on", { error: "Necesitamos tu permiso para guardar tus datos." }),
  confirmo_edad: z.literal("on", { error: "Marca esta casilla para continuar." }),
});

export type CampoRegistro = keyof z.input<typeof registroSchema>;
export type ErroresRegistro = Partial<Record<CampoRegistro, string>>;

export const camposRegistro: CampoRegistro[] = [
  "dni",
  "nombre",
  "correo",
  "celular",
  "acepto_datos",
  "confirmo_edad",
];

// Toma los campos del formulario tal como llegan. Una casilla sin marcar no viene.
export function leerFormularioRegistro(fd: FormData): Record<CampoRegistro, string | undefined> {
  const datos = {} as Record<CampoRegistro, string | undefined>;
  for (const campo of camposRegistro) {
    const v = fd.get(campo);
    datos[campo] = typeof v === "string" ? v : undefined;
  }
  return datos;
}

export function primerErrorPorCampo(error: z.ZodError): ErroresRegistro {
  const errores: ErroresRegistro = {};
  for (const issue of error.issues) {
    const campo = issue.path[0] as CampoRegistro;
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}
