import { PREGUNTAS, EJES, type Respuestas } from "./preguntas";
import { calcularResultadoCompleto, nivelDePromedio } from "./puntaje";
import { hojaDesdeFilas, nuevoLibro, agregarHoja, libroABuffer } from "./xlsx";

function textoRespuesta(p: (typeof PREGUNTAS)[number], respuestas: Respuestas): string {
  const valor = respuestas[p.id];
  if (valor === undefined || valor === null || valor === "") return "";
  if (p.tipo === "select") {
    return p.opciones?.find((o) => o.valor === valor)?.etiqueta ?? String(valor);
  }
  if (p.tipo === "multiselect") {
    const seleccionadas = (valor as string[]) || [];
    return seleccionadas.map((v) => p.opciones?.find((o) => o.valor === v)?.etiqueta ?? v).join("; ");
  }
  if (p.tipo === "archivo") {
    return valor ? `Archivo adjunto: ${valor}` : "";
  }
  return String(valor);
}

function puntajeRespuesta(p: (typeof PREGUNTAS)[number], respuestas: Respuestas): number | "" {
  if (!p.puntuable) return "";
  const valor = respuestas[p.id];
  const opcion = p.opciones?.find((o) => o.valor === valor);
  return typeof opcion?.puntos === "number" ? opcion.puntos : "";
}

// ---- Hojas sin puntaje (A, B) ----
function hojaSimple(eje: "A" | "B", respuestas: Respuestas) {
  const preguntas = PREGUNTAS.filter((p) => p.eje === eje);
  const filas = preguntas.map((p) => ({
    "N°": p.numero,
    Pregunta: p.texto,
    "Opciones del instrumento": p.opciones?.map((o) => o.etiqueta).join(" | ") ?? "",
    "Respuesta de la empresa": textoRespuesta(p, respuestas),
  }));
  return hojaDesdeFilas(filas, [6, 55, 45, 45]);
}

// ---- Hoja Eje C (incluye la matriz de grupos poblacionales) ----
function hojaEjeC(respuestas: Respuestas) {
  const filas: Record<string, unknown>[] = [];
  for (const p of PREGUNTAS.filter((pp) => pp.eje === "C")) {
    if (p.tipo === "matriz") {
      for (const fila of p.filasMatriz || []) {
        const respuestasMatriz = (respuestas[p.id] as Record<string, string>) || {};
        const v = respuestasMatriz[fila.id];
        const etiqueta = p.opcionesMatriz?.find((o) => o.valor === v)?.etiqueta ?? "";
        filas.push({
          "N°": `${p.numero} — ${fila.etiqueta}`,
          Pregunta: p.texto,
          "Opciones del instrumento": "Sí | No | No sabe – No registra",
          "Respuesta de la empresa": etiqueta,
        });
      }
    } else {
      filas.push({
        "N°": p.numero,
        Pregunta: p.texto,
        "Opciones del instrumento": p.opciones?.map((o) => o.etiqueta).join(" | ") ?? "",
        "Respuesta de la empresa": textoRespuesta(p, respuestas),
      });
    }
  }
  return hojaDesdeFilas(filas, [10, 55, 45, 45]);
}

// ---- Hojas con puntaje (Eje 1, Eje 2) ----
function hojaConPuntaje(eje: "1" | "2", respuestas: Respuestas) {
  const preguntas = PREGUNTAS.filter((p) => p.eje === eje);
  const filas = preguntas.map((p) => {
    const opA = p.opciones?.find((o) => o.valor === "A");
    const opB = p.opciones?.find((o) => o.valor === "B");
    const opC = p.opciones?.find((o) => o.valor === "C");
    return {
      Bloque: p.bloque || "",
      "N°": p.numero,
      Pregunta: p.texto,
      "A — Mínimo compromiso": opA?.etiqueta ?? "",
      "B — Compromiso parcial": opB?.etiqueta ?? "",
      "C — Avanzado": opC?.etiqueta ?? "",
      "Respuesta de la empresa": textoRespuesta(p, respuestas),
      "Puntaje obtenido": puntajeRespuesta(p, respuestas),
    };
  });

  const resultado = calcularResultadoCompleto(respuestas)[eje === "1" ? "eje1" : "eje2"];
  filas.push({
    Bloque: "",
    "N°": "",
    Pregunta: "PUNTAJE TOTAL DEL EJE",
    "A — Mínimo compromiso": "",
    "B — Compromiso parcial": "",
    "C — Avanzado": "",
    "Respuesta de la empresa": `Promedio: ${resultado.promedio} / 2 — Nivel: ${resultado.nivel}`,
    "Puntaje obtenido": resultado.puntajeTotal,
  });

  return hojaDesdeFilas(filas, [22, 6, 50, 32, 32, 32, 32, 14]);
}

// ---- Hoja de escala de valoración (referencia estática) ----
function hojaEscala() {
  const filas = [
    { Nivel: "Mínimo compromiso", "Rango de promedio": "0 – 0.66" },
    { Nivel: "Compromiso parcial", "Rango de promedio": "0.67 – 1.33" },
    { Nivel: "Avanzado", "Rango de promedio": "1.34 – 2" },
  ];
  return hojaDesdeFilas(filas, [24, 20]);
}

// ---- Hoja resumen ----
function hojaResumen(respuestas: Respuestas) {
  const { eje1, eje2 } = calcularResultadoCompleto(respuestas);
  const nombreEmpresa = String(respuestas["EjeA_nombre_de_la_organizacion"] ?? "");
  const nit = String(respuestas["EjeA_nit"] ?? "");
  const filas = [
    { Campo: "Empresa", Valor: nombreEmpresa },
    { Campo: "NIT", Valor: nit },
    { Campo: "Fecha del diagnóstico", Valor: new Date().toLocaleDateString("es-CO") },
    { Campo: "", Valor: "" },
    { Campo: "Puntaje Eje 1 — Gestión del talento inclusivo", Valor: eje1.promedio },
    { Campo: "Nivel Eje 1", Valor: eje1.nivel },
    { Campo: "Puntaje Eje 2 — Gestión empresarial con perspectiva de género", Valor: eje2.promedio },
    { Campo: "Nivel Eje 2", Valor: eje2.nivel },
  ];
  return hojaDesdeFilas(filas, [50, 30]);
}

export function generarExcelDiagnostico(respuestas: Respuestas): Buffer {
  const libro = nuevoLibro();
  agregarHoja(libro, hojaResumen(respuestas), "Resumen");
  agregarHoja(libro, hojaSimple("A", respuestas), "Eje A Datos generales");
  agregarHoja(libro, hojaSimple("B", respuestas), "Eje B Oportunidades de Empleo");
  agregarHoja(libro, hojaEjeC(respuestas), "Eje C Inclusión Laboral");
  agregarHoja(libro, hojaConPuntaje("1", respuestas), "Eje 1 Talento inclusivo");
  agregarHoja(libro, hojaConPuntaje("2", respuestas), "Eje 2 Gestión empresarial");
  agregarHoja(libro, hojaEscala(), "Escala de valoración");
  return libroABuffer(libro);
}
