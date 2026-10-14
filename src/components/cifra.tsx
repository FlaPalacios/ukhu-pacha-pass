// Una cifra del panel: etiqueta pequeña y número grande en Lora.
// tono "bien" (menta) o "alerta" (rosa) solo cuando el número significa eso.
export function Cifra({
  t,
  n,
  detalle,
  tono,
}: {
  t: string;
  n: React.ReactNode;
  detalle?: string;
  tono?: "bien" | "alerta";
}) {
  const borde = tono === "alerta" ? "border-rosa" : tono === "bien" ? "border-menta" : "border-borde";
  return (
    <div className={`rounded border bg-tarjeta px-4 py-3 font-lora ${borde}`}>
      <dt className="text-sm text-apagado">{t}</dt>
      <dd className="text-3xl">{n}</dd>
      {detalle && <dd className="text-sm text-apagado">{detalle}</dd>}
    </div>
  );
}
