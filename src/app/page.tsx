"use client";

import { useMemo, useState } from "react";
import {
  EJES,
  preguntasDeEje,
  bloquesDeEje,
  esVisible,
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

  function setRespuesta(id: string, valor: string | string[] | Record<string, string>) {
    setRespuestas((prev) => ({ ...prev, [id]: valor }));
  }

  function irSiguiente() {
    const idx = ORDEN_PASOS.indexOf(paso);
    if (idx < ORDEN_PASOS.length - 1) {
      setPaso(ORDEN_PASOS[idx + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function irAnterior() {
    const idx = ORDEN_PASOS.indexOf(paso);
    if (idx > 0) {
      setPaso(ORDEN_PASOS[idx - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function enviar() {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Barra superior */}
      <div className="flex items-center justify-between bg-[var(--color-oscuro)] px-6 py-3 text-white">
        <span className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          Sección: {paso === "intro" ? "Bienvenida" : paso === "enviado" ? "Confirmación" : "Form"}
        </span>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-gkl.png" alt="GKL" className="h-6 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-promujer.png" alt="Pro Mujer" className="h-7 w-auto" />
          <div className="h-6 w-px bg-white/25" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-colsubsidio-blanco.png" alt="Colsubsidio" className="h-6 w-auto" />
        </div>
      </div>

      {/* Banner de progreso */}
      {esPasoEje && (
        <div className="bg-[var(--color-acento)] px-6 py-6" style={{ color: "var(--color-acento-texto)" }}>
          <h2 className="mb-3 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-wide">
            PROGRESO
          </h2>
          <div className="mb-3 flex items-center justify-center gap-6 text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[var(--color-oscuro)]" /> Completado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-[var(--color-oscuro)]" /> Pendiente
            </span>
          </div>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-md bg-white/90">
            <div className="flex h-11 w-full text-sm font-semibold">
              <div
                className="flex items-center justify-center bg-[var(--color-oscuro)] text-white transition-all"
                style={{ width: `${progresoPct}%` }}
              >
                {progresoPct}%
              </div>
              <div className="flex flex-1 items-center justify-center text-[var(--color-oscuro)]">
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
          {/* Banda amarilla con la cuadrícula y el título */}
          <div className="bg-[var(--color-acento)] px-6 py-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/grid-bienvenida.png"
              alt=""
              className="mx-auto mb-6 h-44 w-44 rounded-md border border-black/10"
            />
            <h1 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-2xl font-bold italic text-[var(--color-oscuro)] md:text-3xl">
              Diagnóstico de Igualdad de Género
              <br />y gestión inclusiva del talento
            </h1>
          </div>

          {/* Sección oscura con el texto del programa */}
          <div className="bg-[var(--color-oscuro)] px-6 py-14 text-white">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-acento)]">
                Programa Ruta Mujer — Colsubsidio
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-white/85">
                <p>
                  Te damos la bienvenida al diagnóstico empresarial de la iniciativa{" "}
                  <strong className="text-white">Ruta Mujer</strong>, un programa liderado por{" "}
                  <strong className="text-white">Colsubsidio</strong>, en alianza con{" "}
                  <strong className="text-white">Pro Mujer</strong> y la{" "}
                  <strong className="text-white">Fundación Colombia Incluyente</strong>, que busca
                  fortalecer la inclusión laboral y el acceso al empleo de las mujeres a través del
                  trabajo conjunto con las empresas.
                </p>
                <p>
                  Este diagnóstico forma parte de un proceso integral orientado a acompañar a las
                  organizaciones en el fortalecimiento de sus prácticas de gestión del talento y su
                  cultura organizacional desde un enfoque de igualdad de género e inclusión. Desde
                  Pro Mujer, llevaremos adelante el proceso de fortalecimiento empresarial,
                  brindando acompañamiento técnico y herramientas para la implementación de
                  mejoras.
                </p>
                <p>El instrumento permite conocer el estado actual de la empresa en dos dimensiones principales:</p>
                <ul className="list-disc space-y-1 pl-6">
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

              <p className="mt-8 text-center font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-acento)]">
                Súmese a Ruta Mujer y sea parte del cambio
              </p>
              <div className="mt-6 text-center">
                <button
                  onClick={irSiguiente}
                  className="rounded-full bg-[var(--color-acento)] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[var(--color-acento-texto)] hover:opacity-90"
                >
                  Iniciar diagnóstico →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pasos con eje: sidebar oscuro + contenido */}
      {esPasoEje && (
        <div className="flex min-h-[70vh] flex-col md:flex-row">
          <aside className="flex w-full shrink-0 flex-col items-center justify-center gap-8 bg-[var(--color-oscuro)] p-8 text-white md:sticky md:top-0 md:h-screen md:w-[30%]">
            <h3 className="text-center font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-[var(--color-acento)]">
              EJE {ejeActual?.id}
              <br />
              {ejeActual?.corto.toUpperCase()}
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={irAnterior}
                className="rounded-full border-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/10"
                style={{ borderColor: "var(--color-boton)", color: "var(--color-boton)" }}
              >
                Volver
              </button>
              {paso === "2" ? (
                <button
                  onClick={enviar}
                  disabled={enviando}
                  className="rounded-full border-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/10 disabled:opacity-50"
                  style={{ borderColor: "var(--color-boton)", color: "var(--color-boton)" }}
                >
                  {enviando ? "Enviando…" : "Finalizar"}
                </button>
              ) : (
                <button
                  onClick={irSiguiente}
                  className="rounded-full border-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/10"
                  style={{ borderColor: "var(--color-boton)", color: "var(--color-boton)" }}
                >
                  Siguiente eje
                </button>
              )}
              {error && <p className="text-xs text-red-300">{error}</p>}
            </div>
          </aside>

          <main className="flex-1 bg-white px-6 py-8 md:px-10 md:py-10">
            {bloques.length > 0 ? (
              bloques.map((bloque) => (
                <section key={bloque} className="mb-10">
                  <h3 className="mb-4 border-b border-[var(--color-line)] pb-2 font-[family-name:var(--font-display)] text-lg text-[var(--color-oscuro)]">
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
          <div
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ background: "var(--color-acento)", color: "var(--color-acento-texto)" }}
          >
            ✓
          </div>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-oscuro)]">
            ¡Diagnóstico enviado con éxito!
          </h2>
          <p className="mb-6 text-sm text-[var(--color-grafito)]/70">
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
            className="rounded-full border-2 px-5 py-2.5 text-sm font-medium hover:bg-black/5"
            style={{ borderColor: "var(--color-oscuro)", color: "var(--color-oscuro)" }}
          >
            ⬇ Descargar mi diagnóstico (Excel)
          </button>
        </main>
      )}
    </div>
  );
}
