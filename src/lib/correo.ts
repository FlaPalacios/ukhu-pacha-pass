import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { evento } from "@/config/evento";
import { qrPng } from "./qr";

export type DatosEntrada = { nombre: string; correo: string; codigo: string; token: string };

// Un fallo de envío, sin datos de la persona. "detener" indica que el problema no es de
// esta dirección sino general (clave, límite diario, conexión): no tiene sentido seguir el lote.
export type FalloCorreo = { codigo: string; detener: boolean; motivo: string };

export function urlApp(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function urlEntrada(token: string): string {
  return `${urlApp()}/entrada/${token}`;
}

export function crearTransporte(): Transporter {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("FALTAN_CREDENCIALES");
  // En producción, sin APP_URL los enlaces del correo apuntarían a localhost.
  if (process.env.NODE_ENV === "production" && !process.env.APP_URL?.startsWith("https://")) {
    throw new Error("FALTA_APP_URL");
  }
  // Una sola conexión reutilizada para todo el lote, con esperas cortas.
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    pool: true,
    maxConnections: 1,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
}

export async function enviarEntrada(t: Transporter, d: DatosEntrada, precio: number): Promise<void> {
  const enlace = urlEntrada(d.token);
  await t.sendMail({
    from: { name: evento.nombre, address: process.env.GMAIL_USER ?? "" },
    to: d.correo,
    subject: `Tu entrada para ${evento.nombre}, ${evento.fecha}`,
    text: textoPlano(d, enlace),
    html: html(d, enlace, precio),
    attachments: [
      { filename: `entrada-${d.codigo}.png`, content: await qrPng(d.token), cid: "qr-entrada" },
    ],
  });
}

export function clasificarFallo(e: unknown): FalloCorreo {
  const err = (e ?? {}) as { code?: string; responseCode?: number; response?: string; message?: string };
  if (err.message === "FALTAN_CREDENCIALES") {
    return {
      codigo: "SIN_CREDENCIALES",
      detener: true,
      motivo: "Faltan GMAIL_USER o GMAIL_APP_PASSWORD en el servidor.",
    };
  }
  if (err.message === "FALTA_APP_URL") {
    return {
      codigo: "SIN_APP_URL",
      detener: true,
      motivo: "Falta APP_URL (https://...) en el servidor: los enlaces del correo saldrían rotos.",
    };
  }
  const codigo = [err.code, err.responseCode].filter(Boolean).join(" ").slice(0, 60) || "DESCONOCIDO";
  // 4xx: rechazo temporal de Gmail (por ejemplo, envío demasiado rápido). No es culpa de la dirección.
  if (err.responseCode && err.responseCode >= 400 && err.responseCode < 500) {
    return { codigo, detener: true, motivo: "Gmail pidió esperar un momento. Envía otro lote en unos minutos." };
  }
  if (err.code === "EAUTH") {
    return { codigo, detener: true, motivo: "Gmail rechazó el usuario o la contraseña de aplicación." };
  }
  if (/5\.4\.5|quota|limit exceeded/i.test(err.response ?? "")) {
    return { codigo, detener: true, motivo: "Gmail alcanzó su límite diario de envíos. Sigue mañana." };
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ETLS"].includes(err.code ?? "")) {
    return { codigo, detener: true, motivo: "No hubo conexión con Gmail. Inténtalo de nuevo." };
  }
  return { codigo, detener: false, motivo: "Gmail no aceptó esta dirección." };
}

function escapar(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function textoPlano(d: DatosEntrada, enlace: string): string {
  return [
    `Hola, ${d.nombre}.`,
    "",
    `Tu pago está registrado. Esta es tu entrada para ${evento.nombre}.`,
    "",
    `Código de respaldo: ${d.codigo}`,
    `Tu QR también está aquí: ${enlace}`,
    "",
    `${evento.fecha}. ${evento.hora}.`,
    evento.lugar,
    "",
    "Muestra el QR en la puerta. Si no carga, dicta tu código de 6 letras.",
    "No compartas esta entrada: el QR sirve una sola vez.",
  ].join("\n");
}

// Correo simple con estilos en línea (los clientes de correo ignoran las hojas de estilo).
function html(d: DatosEntrada, enlace: string, precio: number): string {
  const nombre = escapar(d.nombre);
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#0a0a0a;">
<div style="max-width:480px;margin:0 auto;padding:32px 20px;font-family:Georgia,serif;color:#edf3ef;background:#0a0a0a;">
  <p style="margin:0;font-size:28px;color:#f2e94a;">${escapar(evento.nombre)}</p>
  <p style="margin:4px 0 24px;font-style:italic;">${escapar(evento.subtitulo)}</p>
  <p style="font-size:18px;margin:0 0 16px;">Hola, ${nombre}. Tu pago está registrado. Esta es tu entrada.</p>
  <div style="background:#ffffff;padding:12px;text-align:center;border-radius:4px;">
    <img src="cid:qr-entrada" width="300" height="300" alt="QR de tu entrada" style="display:block;margin:0 auto;">
  </div>
  <p style="margin:20px 0 4px;font-size:14px;color:#9a9f9c;">Código de respaldo</p>
  <p style="margin:0;font-size:32px;letter-spacing:6px;font-family:'Courier New',monospace;">${escapar(d.codigo)}</p>
  <table role="presentation" style="margin:24px 0;border-collapse:collapse;font-size:16px;color:#edf3ef;">
    <tr><td style="padding:4px 16px 4px 0;color:#9a9f9c;">Fecha</td><td>${escapar(evento.fecha)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#9a9f9c;">Hora</td><td>${escapar(evento.hora)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#9a9f9c;">Lugar</td><td>${escapar(evento.lugar)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#9a9f9c;">Entrada</td><td>S/ ${precio}</td></tr>
  </table>
  <p style="font-size:16px;">Muestra el QR en la puerta. Si no carga, dicta tu código de 6 letras.
  También puedes abrir tu entrada aquí: <a href="${escapar(enlace)}" style="color:#f7931e;">ver mi entrada</a>.</p>
  <p style="font-size:14px;color:#9a9f9c;">No compartas esta entrada: el QR sirve una sola vez.</p>
</div></body></html>`;
}
