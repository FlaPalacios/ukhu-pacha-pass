import "server-only";
import { randomBytes, randomInt } from "node:crypto";

// Sin 0, O, 1, I, L para que no se confundan al dictarlos en la puerta.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function nuevoCodigoCorto(): string {
  let codigo = "";
  for (let i = 0; i < 6; i++) codigo += ALFABETO[randomInt(ALFABETO.length)];
  return codigo;
}

// 192 bits aleatorios. Va dentro del QR como UPP:<token>.
export function nuevoToken(): string {
  return randomBytes(24).toString("base64url");
}
