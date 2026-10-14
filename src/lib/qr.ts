import "server-only";
import QRCode from "qrcode";

// El QR lleva solo el prefijo y el token: ni DNI ni URL, así la cámara normal no abre nada.
export function contenidoQr(token: string): string {
  return `UPP:${token}`;
}

const OPCIONES = { errorCorrectionLevel: "M" as const, margin: 2, width: 480 };

export function qrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(contenidoQr(token), { ...OPCIONES, type: "png" });
}

export function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(contenidoQr(token), OPCIONES);
}

// Formato de los tokens que genera codigos.ts (24 bytes en base64url).
export const TOKEN_REGEX = /^[A-Za-z0-9_-]{32}$/;
