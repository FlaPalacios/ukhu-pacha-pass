"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { RespuestaEscaneo } from "@/lib/puerta-tipos";

type Vista = { tipo: "escaneando" } | { tipo: "consultando" } | { tipo: "respuesta"; r: RespuestaEscaneo };
type Camara = "iniciando" | "lista" | "error";

// Si el servidor no contesta en este tiempo, se corta la consulta y se muestra error.
// Nunca un falso "válido".
const ESPERA_MS = 8000;
// Tras "Siguiente", el mismo QR se ignora este tiempo (el celular puede seguir apuntándolo).
const IGNORAR_MISMO_QR_MS = 4000;
const SIN_RESPUESTA = "Sin respuesta del servidor. No dejes pasar todavía: vuelve a intentar.";

// Cada escaneo es un fetch independiente con su propio corte: uno colgado no frena a los demás.
async function consultarServidor(
  tipo: "qr" | "manual",
  valor: string,
  confirmado = false,
): Promise<RespuestaEscaneo> {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MS);
  try {
    const res = await fetch("/api/puerta/escanear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, valor, confirmado }),
      signal: corte.signal,
      cache: "no-store",
    });
    const r = (await res.json()) as RespuestaEscaneo;
    if (typeof r?.ok !== "boolean") throw new Error("respuesta inválida");
    return r;
  } catch {
    return { ok: false, error: SIN_RESPUESTA };
  } finally {
    clearTimeout(reloj);
  }
}

export function Escaner({ ingresadosIniciales }: { ingresadosIniciales: number }) {
  const video = useRef<HTMLVideoElement>(null);
  // Hay una consulta en vuelo: evita dos consultas a la vez (por ejemplo, doble toque en Confirmar).
  const enVuelo = useRef(false);
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const ocupado = useRef(false);
  const ultimoQr = useRef<{ valor: string; hasta: number } | null>(null);
  const [vista, setVista] = useState<Vista>({ tipo: "escaneando" });
  const [camara, setCamara] = useState<Camara>("iniciando");
  const [intentoCamara, setIntentoCamara] = useState(0);
  const [ingresados, setIngresados] = useState(ingresadosIniciales);

  // Lo que muestra la pantalla es exactamente lo que respondió el servidor. Un "Ya ingresó"
  // nunca se convierte en "Válido" en el celular: tras un error de red decide el guardia.
  const consultar = useCallback(async (tipo: "qr" | "manual", valor: string, confirmado = false) => {
    if (enVuelo.current || (ocupado.current && !confirmado)) return;
    enVuelo.current = true;
    ocupado.current = true;
    setVista({ tipo: "consultando" });
    const r = await consultarServidor(tipo, valor, confirmado);
    enVuelo.current = false;
    if (r.ok && "escaneo" in r) setIngresados(r.escaneo.ingresados);
    const valido = r.ok && "escaneo" in r && r.escaneo.resultado === "valido";
    navigator.vibrate?.(valido ? 120 : [90, 60, 90]);
    setVista({ tipo: "respuesta", r });
  }, []);

  function siguiente() {
    // Solo tras un resultado se ignora un rato el mismo QR. Tras un error, se puede reintentar ya.
    const huboResultado = vista.tipo === "respuesta" && vista.r.ok;
    if (ultimoQr.current) ultimoQr.current.hasta = huboResultado ? Date.now() + IGNORAR_MISMO_QR_MS : 0;
    ocupado.current = false;
    setVista({ tipo: "escaneando" });
  }

  function reabrirCamara() {
    setCamara("iniciando");
    setIntentoCamara((n) => n + 1);
  }

  // Cámara trasera. Se apaga al salir. Si se corta (llamada, otra app), pasa a error
  // y se ofrece reabrirla.
  useEffect(() => {
    let flujo: MediaStream | undefined;
    let cancelado = false;
    const cortada = () => {
      if (!cancelado) setCamara("error");
    };
    // Al volver de otra app: si la pista terminó, se pide reabrir; si el video quedó en pausa
    // (iPhone), se reanuda.
    const alVolver = () => {
      if (document.visibilityState !== "visible" || !flujo) return;
      if (flujo.getVideoTracks().some((t) => t.readyState === "ended")) cortada();
      else if (video.current?.paused) video.current.play().catch(cortada);
    };
    const pedir = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      : Promise.reject(new Error("sin cámara"));
    pedir
      .then(async (s) => {
        if (cancelado || !video.current) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        flujo = s;
        s.getVideoTracks().forEach((t) => t.addEventListener("ended", cortada));
        video.current.srcObject = s;
        await video.current.play();
        setCamara("lista");
      })
      .catch(cortada);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolver);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [intentoCamara]);

  // Pantalla siempre encendida mientras se escanea (si el navegador lo permite).
  useEffect(() => {
    let bloqueo: WakeLockSentinel | undefined;
    const pedir = () => {
      if (document.visibilityState === "visible") {
        navigator.wakeLock?.request("screen").then((b) => (bloqueo = b)).catch(() => {});
      }
    };
    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      document.removeEventListener("visibilitychange", pedir);
      void bloqueo?.release().catch(() => {});
    };
  }, []);

  // Lectura continua: unas 6 lecturas por segundo sobre una imagen reducida.
  useEffect(() => {
    if (camara !== "lista" || vista.tipo !== "escaneando") return;
    let cuadro = 0;
    let ultimo = 0;
    const leer = (t: number) => {
      cuadro = requestAnimationFrame(leer);
      if (t - ultimo < 150) return;
      ultimo = t;
      const v = video.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return;
      const ancho = Math.min(640, v.videoWidth);
      const alto = Math.round((v.videoHeight * ancho) / v.videoWidth);
      const c = (lienzo.current ??= document.createElement("canvas"));
      c.width = ancho;
      c.height = alto;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, ancho, alto);
      const qr = jsQR(ctx.getImageData(0, 0, ancho, alto).data, ancho, alto, {
        inversionAttempts: "dontInvert",
      });
      if (!qr?.data) return;
      const previo = ultimoQr.current;
      if (previo && previo.valor === qr.data && Date.now() < previo.hasta) return;
      ultimoQr.current = { valor: qr.data, hasta: Infinity };
      cancelAnimationFrame(cuadro);
      void consultar("qr", qr.data);
    };
    cuadro = requestAnimationFrame(leer);
    return () => cancelAnimationFrame(cuadro);
  }, [camara, vista.tipo, consultar]);

  function buscar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const campo = e.currentTarget.elements.namedItem("valor") as HTMLInputElement;
    const valor = campo.value.trim();
    if (!valor) return;
    campo.value = "";
    campo.blur();
    void consultar("manual", valor);
  }

  return (
    <>
      <p className="font-lora text-lg">
        Ingresados: <span className="text-2xl">{ingresados}</span>
      </p>

      <div className="relative mt-3 aspect-square w-full overflow-hidden rounded border border-borde bg-tarjeta">
        <video ref={video} playsInline muted className="h-full w-full object-cover" />
        {camara === "iniciando" && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center font-lora text-lg">
            Abriendo la cámara...
          </p>
        )}
        {camara === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-tarjeta p-6 text-center">
            <p className="font-lora text-lg">
              La cámara no está disponible. Revisa el permiso del navegador o usa la búsqueda manual.
            </p>
            <button onClick={reabrirCamara} className="rounded border border-texto px-6 py-3 text-2xl">
              Reabrir cámara
            </button>
          </div>
        )}
        {camara === "lista" && (
          <div className="pointer-events-none absolute inset-[18%] rounded border-2 border-texto/70" />
        )}
      </div>

      <form onSubmit={buscar} className="mt-4 flex gap-2">
        <label htmlFor="valor" className="sr-only">
          Código o DNI
        </label>
        <input
          id="valor"
          name="valor"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="Código o DNI"
          className="min-w-0 flex-1 rounded border border-borde bg-tarjeta px-4 py-4 font-lora text-2xl uppercase"
        />
        <button type="submit" className="rounded bg-naranja px-6 text-2xl text-tinta">
          Buscar
        </button>
      </form>

      {vista.tipo === "consultando" && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-fondo/95 text-3xl">
          Verificando...
        </div>
      )}
      {vista.tipo === "respuesta" && (
        <Pantalla
          r={vista.r}
          alSeguir={siguiente}
          alConfirmar={(dni) => void consultar("manual", dni, true)}
        />
      )}
    </>
  );
}

const HORA = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
});

const HORA_SEGUNDOS = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Resultado a pantalla completa: menta solo para válido, rosa para todo lo demás.
// La confirmación por DNI es neutra (fondo oscuro): todavía no es un ingreso.
function Pantalla({
  r,
  alSeguir,
  alConfirmar,
}: {
  r: RespuestaEscaneo;
  alSeguir: () => void;
  alConfirmar: (dni: string) => void;
}) {
  if (r.ok && "confirmar" in r) {
    return (
      <div role="alert" className="fixed inset-0 z-20 flex flex-col bg-fondo">
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-4xl text-amarillo">Pide el DNI físico</p>
          <p className="mt-4 text-2xl">Confirma que el documento es de:</p>
          <p className="mt-3 text-5xl">{r.confirmar.nombre}</p>
          <p className="mt-3 font-lora text-2xl">DNI {r.confirmar.dni}</p>
        </div>
        <div className="m-4 flex flex-col gap-3">
          <button onClick={() => alConfirmar(r.confirmar.dni)} className="rounded bg-naranja py-6 text-3xl text-tinta">
            Confirmar ingreso
          </button>
          <button onClick={alSeguir} className="rounded border border-rosa py-5 text-2xl">
            No coincide, cancelar
          </button>
        </div>
      </div>
    );
  }

  let fondo = "bg-rosa";
  let titulo: string;
  let detalle: React.ReactNode = null;

  if (!r.ok) {
    titulo = r.sinSesion ? "Sesión vencida" : "Error";
    detalle = <p className="text-2xl">{r.error}</p>;
  } else {
    const e = r.escaneo;
    const fecha = e.ingresadoEn ? new Date(e.ingresadoEn) : null;
    switch (e.resultado) {
      case "valido":
        fondo = "bg-menta";
        titulo = "Válido";
        detalle = (
          <>
            <p className="text-4xl">{e.nombre}</p>
            <p className="mt-2 font-lora text-2xl">
              {e.codigo ? `${e.codigo} · ` : ""}
              {fecha ? HORA.format(fecha) : ""}
            </p>
          </>
        );
        break;
      case "repetido":
        titulo = "Ya ingresó";
        detalle = (
          <>
            <p className="text-4xl">{e.nombre}</p>
            <p className="mt-2 font-lora text-2xl">
              Entró a las {fecha ? HORA_SEGUNDOS.format(fecha) : ""}, registrado por {e.ingresadoPor}.
            </p>
          </>
        );
        break;
      case "no_pagado":
        titulo = "No pagado";
        detalle = (
          <>
            <p className="text-4xl">{e.nombre}</p>
            <p className="mt-2 text-2xl">No puede pasar. Llama a un admin.</p>
          </>
        );
        break;
      case "cancelado":
        titulo = "Cancelado";
        detalle = (
          <>
            <p className="text-4xl">{e.nombre}</p>
            <p className="mt-2 text-2xl">Esta entrada fue cancelada. Llama a un admin.</p>
          </>
        );
        break;
      default:
        titulo = "No encontrado";
        detalle = <p className="text-2xl">Revisa el código o busca por DNI. Si sigue, llama a un admin.</p>;
    }
  }

  const menor = r.ok && r.escaneo.resultado === "valido" && r.escaneo.esMenor;
  const sinSesion = !r.ok && r.sinSesion;

  return (
    <div role="alert" className={`fixed inset-0 z-20 flex flex-col text-tinta ${fondo}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-6xl uppercase">{titulo}</p>
        <div className="mt-6">{detalle}</div>
      </div>
      {menor && (
        <div className="border-y-8 border-tinta bg-rosa p-6">
          <p className="text-5xl uppercase">Menor de edad</p>
          <p className="mt-2 text-2xl">Pulsera de menor. Sin alcohol.</p>
        </div>
      )}
      <button
        onClick={sinSesion ? () => window.location.reload() : alSeguir}
        className="m-4 rounded bg-tinta py-6 text-3xl text-texto"
      >
        {sinSesion ? "Volver a ingresar el PIN" : "Siguiente"}
      </button>
    </div>
  );
}
