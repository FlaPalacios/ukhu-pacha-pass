import "server-only";
import { obtenerConfig } from "./config";
import { supabaseServidor } from "./supabase-servidor";

export type Gasto = {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  admin: { nombre: string } | null;
};

export type Resumen = {
  registrados: number; // todos menos cancelados
  pendientes: number;
  pagados: number; // pagaron y aún no ingresan
  ingresados: number;
  cancelados: number;
  menores: number; // vendidos marcados como menores
  vendidas: number; // pagados + ingresados
  recaudado: number; // suma de lo cobrado a pagados e ingresados
  gastos: number;
  balance: number;
  precio: number;
  aforo: number;
  porcentajeIngreso: number; // ingresados / vendidas
  porcentajeAforo: number; // vendidas / aforo
  equilibrio: number; // entradas necesarias para cubrir los gastos
  faltanEquilibrio: number;
};

function centavos(n: number): number {
  return Math.round(n * 100);
}

export async function calcularResumen(): Promise<Resumen> {
  const db = supabaseServidor();
  const [asistentes, gastos, config] = await Promise.all([
    db.from("attendees").select("estado, monto_pagado, es_menor"),
    db.from("expenses").select("monto"),
    obtenerConfig(),
  ]);
  if (asistentes.error) throw new Error(`resumen: asistentes falló (${asistentes.error.code})`);
  if (gastos.error) throw new Error(`resumen: gastos falló (${gastos.error.code})`);

  let pendientes = 0, pagados = 0, ingresados = 0, cancelados = 0, menores = 0, recaudadoC = 0;
  for (const a of asistentes.data) {
    if (a.estado === "pendiente") pendientes++;
    else if (a.estado === "cancelado") cancelados++;
    else {
      if (a.estado === "pagado") pagados++;
      else ingresados++;
      if (a.es_menor) menores++;
      recaudadoC += centavos(Number(a.monto_pagado ?? 0));
    }
  }
  // Sumas en céntimos para no arrastrar errores de decimales.
  const gastosC = gastos.data.reduce((s, g) => s + centavos(Number(g.monto)), 0);
  const vendidas = pagados + ingresados;
  const equilibrio = config.precio > 0 ? Math.ceil(gastosC / centavos(config.precio)) : 0;

  return {
    registrados: pendientes + vendidas,
    pendientes,
    pagados,
    ingresados,
    cancelados,
    menores,
    vendidas,
    recaudado: recaudadoC / 100,
    gastos: gastosC / 100,
    balance: (recaudadoC - gastosC) / 100,
    precio: config.precio,
    aforo: config.aforo,
    porcentajeIngreso: vendidas ? Math.round((ingresados / vendidas) * 100) : 0,
    porcentajeAforo: config.aforo ? Math.round((vendidas / config.aforo) * 100) : 0,
    equilibrio,
    faltanEquilibrio: Math.max(0, equilibrio - vendidas),
  };
}

export async function listarGastos(): Promise<Gasto[]> {
  const { data, error } = await supabaseServidor()
    .from("expenses")
    .select("id, concepto, monto, fecha, admin:admin_profiles(nombre)")
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw new Error(`listar gastos falló (${error.code})`);
  return data as unknown as Gasto[];
}
