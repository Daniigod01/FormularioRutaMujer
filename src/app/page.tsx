"use client";

import { useMemo, useState } from "react";
import {
  EJES,
  preguntasDeEje,
  bloquesDeEje,
  esVisible,
  preguntasFaltantes,
  type Respuestas,
} from "@/lib/preguntas";
import { calcularResultadoCompleto } from "@/lib/puntaje";
import PreguntaRenderer from "./PreguntaRenderer";

type Paso = "intro" | "A" | "B" | "C" | "1" | "2" | "enviado";

const ORDEN_PASOS: Paso[] = ["intro", "A", "B", "C", "1", "2", "enviado"];

export default function Home() {
  const [paso, setPaso] = useState<Paso>("intro");
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltantes, setFaltantes] = useState<string[]>([]);

  function setRespuesta(id: string, valor: string | string[] | Record<string, string>) {
    setRespuestas((prev) => ({ ...prev, [id]: valor }));
    setFaltantes([]);
  }

  function irSiguiente() {
    if (paso !== "intro" && paso !== "enviado") {
      const faltan = preguntasFaltantes(paso, respuestas);
      if (faltan.length > 0) {
        setFaltantes(faltan.map((p) => p.texto));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setFaltantes([]);
    const idx = ORDEN_PASOS.indexOf(paso);
    if (idx < ORDEN_PASOS.length - 1) {
      setPaso(ORDEN_PASOS[idx + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function irAnterior() {
    setFaltantes([]);
    const idx = ORDEN_PASOS.indexOf(paso);
    if (idx > 0) {
      setPaso(ORDEN_PASOS[idx - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function enviar() {
    const faltan = preguntasFaltantes("2", respuestas);
    if (faltan.length > 0) {
      setFaltantes(faltan.map((p) => p.texto));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const resultado = calcularResultadoCompleto(respuestas);
      const res = await fetch("/api/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas, resultado }),
      });
      if (!res.ok) throw new Error("No se pudo enviar el diagnóstico. Intenta de nuevo.");
      setPaso("enviado");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  }

  const esPasoEje = paso !== "intro" && paso !== "enviado";
  const preguntasPaso = useMemo(() => (esPasoEje ? preguntasDeEje(paso) : []), [paso, esPasoEje]);
  const bloques = useMemo(() => (esPasoEje ? bloquesDeEje(paso) : []), [paso, esPasoEje]);
  const ejeActual = EJES.find((e) => e.id === paso);
  const indiceEje = EJES.findIndex((e) => e.id === paso);
  const progresoPct = esPasoEje ? Math.round(((indiceEje + 1) / EJES.length) * 100) : 0;

  const btnPrimario =
    "w-48 rounded-full bg-[var(--color-amarillo)] px-6 py-3 text-base font-semibold text-[var(--color-azul)] transition-colors hover:bg-white disabled:opacity-60";
  const btnSecundario =
    "w-48 rounded-full border-2 border-white px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-white/15";

  return (
    <div className="min-h-screen bg-white">
      {/* Encabezado: Fundación Colombia Incluyente a la izquierda, Colsubsidio a la derecha
          (en piezas de Colsubsidio, la posición derecha indica el dominio de la marca) */}
      <header className="border-b-4 border-[var(--color-amarillo)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <span className="hidden font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-grafito)] md:block">
            {paso === "intro"
              ? "Bienvenida"
              : paso === "enviado"
                ? "Confirmación"
                : `Diagnóstico: Eje ${ejeActual?.id}`}
          </span>
          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fci-logo.png" alt="Fundación Colombia Incluyente" className="h-10 w-auto sm:h-14" />
            <div className="h-9 w-px bg-[var(--color-grafito-20)] sm:h-12" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-colsubsidio.png" alt="Colsubsidio" className="h-9 w-auto sm:h-12" />
          </div>
        </div>
      </header>

      {/* Banner de progreso */}
      {esPasoEje && (
        <div className="on-dark bg-[var(--color-azul)] px-6 py-6 text-white">
          <h2 className="mb-3 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-wide">
            PROGRESO
          </h2>
          <div className="mb-3 flex items-center justify-center gap-6 text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[var(--color-amarillo)]" /> Completado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-white" /> Pendiente
            </span>
          </div>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-full bg-white/20">
            <div className="flex h-11 w-full text-sm font-semibold">
              <div
                className="flex items-center justify-center bg-[var(--color-amarillo)] text-[var(--color-azul)] transition-all"
                style={{ width: `${progresoPct}%` }}
              >
                {progresoPct}%
              </div>
              <div className="flex flex-1 items-center justify-center text-white">
                {100 - progresoPct}%
              </div>
            </div>
          </div>
          <div className="mx-auto mt-1 flex max-w-3xl justify-between text-xs font-medium opacity-80">
            <span>0%</span>
            <span>20%</span>
            <span>40%</span>
            <span>60%</span>
            <span>80%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Intro */}
      {paso === "intro" && (
        <div>
          {/* Portada azul con el isotipo de Colsubsidio (amarillo sobre azul es una variación permitida) */}
          <section className="relative overflow-hidden bg-[var(--color-azul)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/isotipo-colsubsidio.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-16 hidden h-[420px] w-auto md:block lg:right-8"
            />
            <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
              <h1 className="max-w-[40rem] text-balance font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] text-white md:text-[3.25rem]">
                Diagnóstico de Igualdad de Género y gestión inclusiva del talento
              </h1>
            </div>
          </section>

          {/* Texto del programa sobre fondo blanco, tipografía en grafito */}
          <section className="bg-white px-6 py-14">
            <div className="mx-auto max-w-6xl">
              <div className="max-w-3xl">
              <h2 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-azul)]">
                Programa Ruta Mujer — Colsubsidio
              </h2>
              <div className="space-y-4 text-[17px] leading-relaxed text-[var(--color-grafito)]">
                <p>
                  Te damos la bienvenida al diagnóstico empresarial de la iniciativa{" "}
                  <strong className="font-semibold text-[var(--color-azul)]">Ruta Mujer</strong>, un programa liderado por{" "}
                  <strong className="font-semibold text-[var(--color-azul)]">Colsubsidio</strong>, en alianza con la{" "}
                  <strong className="font-semibold text-[var(--color-azul)]">Fundación Colombia Incluyente</strong>, que busca
                  fortalecer la inclusión laboral y el acceso al empleo de las mujeres a través del
                  trabajo conjunto con las empresas.
                </p>
                <p>
                  Este diagnóstico forma parte de un proceso integral orientado a acompañar a las
                  organizaciones en el fortalecimiento de sus prácticas de gestión del talento y su
                  cultura organizacional desde un enfoque de igualdad de género e inclusión. Desde
                  Colsubsidio y la Fundación Colombia Incluyente, llevaremos adelante el proceso de
                  fortalecimiento empresarial, brindando acompañamiento técnico y herramientas para
                  la implementación de mejoras.
                </p>
                <p>El instrumento permite conocer el estado actual de la empresa en dos dimensiones principales:</p>
                <ul className="list-disc space-y-1 pl-6 marker:text-[var(--color-azul)]">
                  <li>Gestión del talento inclusivo y con perspectiva de género</li>
                  <li>Gestión empresarial con perspectiva de género</li>
                </ul>
                <p>
                  Adicionalmente, incluye algunas secciones de carácter informativo que buscan
                  comprender el contexto organizacional, las oportunidades de empleo y los
                  principales desafíos para la inclusión laboral.
                </p>
                <p>
                  El objetivo de este diagnóstico es conocer la situación actual de su empresa e
                  identificar retos y áreas de oportunidad que servirán como base para definir
                  acciones concretas y estrategias a la medida. Más que una evaluación, este
                  instrumento busca comprender la realidad organizacional, reconocer las prácticas
                  existentes y generar información útil para orientar el trabajo conjunto hacia una
                  cultura organizacional más igualitaria e inclusiva.
                </p>
              </div>

              <p className="mt-10 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-azul)]">
                Súmese a Ruta Mujer y sea parte del cambio
              </p>
              <div className="mt-6">
                <button
                  onClick={irSiguiente}
                  className="rounded-full bg-[var(--color-amarillo)] px-9 py-3.5 text-base font-bold text-[var(--color-azul)] transition-colors hover:bg-[var(--color-azul)] hover:text-[var(--color-amarillo)]"
                >
                  Iniciar diagnóstico →
                </button>
              </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Pasos con eje: sidebar azul + contenido */}
      {esPasoEje && (
        <div className="flex min-h-[70vh] flex-col md:flex-row">
          <aside className="on-dark flex w-full shrink-0 flex-col items-center justify-center gap-8 border-t border-white/20 bg-[var(--color-azul)] p-8 text-white md:sticky md:top-0 md:h-screen md:w-[30%]">
            <h3 className="text-center font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-amarillo)]">
              EJE {ejeActual?.id}
              <br />
              {ejeActual?.corto.toUpperCase()}
            </h3>
            <div className="flex flex-col items-center gap-3">
              <button onClick={irAnterior} className={btnSecundario}>
                Volver
              </button>
              {paso === "2" ? (
                <button onClick={enviar} disabled={enviando} className={btnPrimario}>
                  {enviando ? "Enviando…" : "Finalizar"}
                </button>
              ) : (
                <button onClick={irSiguiente} className={btnPrimario}>
                  Siguiente eje
                </button>
              )}
              {error && <p className="max-w-[12rem] text-center text-sm text-[var(--color-amarillo)]">{error}</p>}
            </div>
          </aside>

          <main className="flex-1 bg-white px-6 py-8 md:px-10 md:py-10">
            {faltantes.length > 0 && (
              <div
                role="alert"
                className="mb-6 rounded-lg border-l-4 border-[var(--color-amarillo)] bg-[var(--color-amarillo-20)] p-4 text-[15px] text-[var(--color-azul)]"
              >
                <p className="font-semibold">
                  Faltan {faltantes.length} pregunta(s) obligatoria(s) por responder en este eje:
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {faltantes.map((texto, i) => (
                    <li key={i}>{texto}</li>
                  ))}
                </ul>
              </div>
            )}
            {bloques.length > 0 ? (
              bloques.map((bloque) => (
                <section key={bloque} className="mb-10">
                  <h3 className="relative mb-5 border-b border-[var(--color-grafito-20)] pb-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-azul)] after:absolute after:-bottom-px after:left-0 after:h-[3px] after:w-14 after:bg-[var(--color-amarillo)]">
                    {bloque}
                  </h3>
                  {preguntasPaso
                    .filter((p) => (p.bloque || "") === bloque)
                    .map((p) =>
                      esVisible(p, respuestas) ? (
                        <PreguntaRenderer
                          key={p.id}
                          pregunta={p}
                          valor={respuestas[p.id]}
                          onChange={(v) => setRespuesta(p.id, v)}
                        />
                      ) : null
                    )}
                </section>
              ))
            ) : (
              <div>
                {preguntasPaso.map((p) =>
                  esVisible(p, respuestas) ? (
                    <PreguntaRenderer
                      key={p.id}
                      pregunta={p}
                      valor={respuestas[p.id]}
                      onChange={(v) => setRespuesta(p.id, v)}
                    />
                  ) : null
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Enviado */}
      {paso === "enviado" && (
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-amarillo)] text-2xl font-bold text-[var(--color-azul)]">
            ✓
          </div>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-azul)]">
            ¡Diagnóstico enviado con éxito!
          </h2>
          <p className="mb-8 text-[17px] text-[var(--color-grafito)]">
            Gracias por completar el diagnóstico. El equipo de Ruta Mujer se pondrá en contacto
            con los siguientes pasos.
          </p>
          <button
            onClick={async () => {
              const res = await fetch("/api/exportar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ respuestas }),
              });
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "diagnostico.xlsx";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-full border-2 border-[var(--color-azul)] px-6 py-2.5 text-base font-semibold text-[var(--color-azul)] transition-colors hover:bg-[var(--color-azul)] hover:text-white"
          >
            ⬇ Descargar mi diagnóstico (Excel)
          </button>
        </main>
      )}
    </div>
  );
}
