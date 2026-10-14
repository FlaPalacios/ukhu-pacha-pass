import { z } from "zod";

// Reglas compartidas por el formulario (cliente) y la acción (servidor).

export const dniSchema = z.string().trim().regex(/^\d{8}$/, "El DNI tiene 8 dígitos.");

export const nombreSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(3, "Escribe el nombre completo.")
      .max(120, "El nombre es demasiado largo.")
      .regex(/^[\p{L}' .-]+$/u, "Usa solo letras en el nombre."),
  );

export const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Revisa el correo.").max(254, "El correo es demasiado largo."));

// Correo opcional (registro hecho por un admin): vacío queda como null.
export const correoOpcionalSchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(correoSchema.nullable());

export const celularSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?51(?=9\d{8}$)/, ""))
  .pipe(z.string().regex(/^9\d{8}$/, "El celular tiene 9 dígitos y empieza con 9."));

export const montoSchema = z
  .string()
  .trim()
  .transform((v) => Number(v.replace(",", ".")))
  .pipe(
    z
      .number({ error: "Escribe un monto válido." })
      .positive("El monto debe ser mayor que cero.")
      .max(1000, "El monto parece demasiado alto.")
      .multipleOf(0.01, "Usa como máximo dos decimales."),
  );

export const idSchema = z.uuid("Registro no válido.");

export const registroSchema = z.object({
  dni: dniSchema,
  nombre: nombreSchema,
  correo: correoSchema,
  celular: celularSchema,
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

// Panel de admin

export const loginSchema = z.object({
  correo: correoSchema,
  clave: z.string().min(1, "Escribe tu contraseña.").max(200),
});

const casilla = z
  .string()
  .optional()
  .transform((v) => v === "on");

export const registroAdminSchema = z
  .object({
    dni: dniSchema,
    nombre: nombreSchema,
    correo: correoOpcionalSchema,
    celular: celularSchema,
    origen: z.enum(["admin", "puerta"], { error: "Elige el origen." }),
    es_menor: casilla,
    pagar: casilla,
    ingresar: casilla,
    monto: z.string().optional(),
  })
  .transform((d, ctx) => {
    if (d.ingresar && !d.pagar) {
      ctx.addIssue({ code: "custom", message: "Para marcar el ingreso, primero debe estar pagado.", path: ["ingresar"] });
      return z.NEVER;
    }
    if (!d.pagar) return { ...d, monto: null };
    const m = montoSchema.safeParse(d.monto ?? "");
    if (!m.success) {
      ctx.addIssue({ code: "custom", message: m.error.issues[0].message, path: ["monto"] });
      return z.NEVER;
    }
    return { ...d, monto: m.data };
  });

export const edicionSchema = z.object({
  dni: dniSchema,
  nombre: nombreSchema,
  correo: correoOpcionalSchema,
  celular: celularSchema,
  es_menor: casilla,
  notas: z
    .string()
    .trim()
    .max(500, "Las notas son demasiado largas.")
    .transform((v) => (v === "" ? null : v)),
});

// Lee un FormData como objeto de textos. Las casillas sin marcar no vienen.
export function textosDe(fd: FormData): Record<string, string> {
  const datos: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") datos[k] = v;
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
