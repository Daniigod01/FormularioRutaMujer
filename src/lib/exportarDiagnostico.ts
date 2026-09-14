import { PREGUNTAS, TEMA_EXPORT, type Respuestas } from "./preguntas";
import { hojaDesdeFilas, nuevoLibro, agregarHoja, libroABuffer } from "./xlsx";

type FilaExport = {
  Tema: string;
  Bloque: string;
  "Preguntas Cerradas": string;
  Respuesta: string | number | "";
  Puntaje: number;
  orden: number;
};

// El orden real del instrumento aplicado es: Eje 1 → Eje 2 → Eje A → Eje B → Eje C.
const ORDEN_EJES = ["1", "2", "A", "B", "C"] as const;

function textoRespuesta(p: (typeof PREGUNTAS)[number], respuestas: Respuestas): string {
  const valor = respuestas[p.id];
  if (valor === undefined || valor === null || valor === "") return "";
  if (p.tipo === "select") {
    return p.opciones?.find((o) => o.valor === valor)?.etiqueta ?? String(valor);
  }
  if (p.tipo === "multiselect") {
    const seleccionadas = (valor as string[]) || [];
    return seleccionadas.map((v) => p.opciones?.find((o) => o.valor === v)?.etiqueta ?? v).join(" | ");
  }
  if (p.tipo === "archivo") {
    return valor ? `Archivo adjunto: ${valor}` : "";
  }
  return String(valor);
}

function puntajeRespuesta(p: (typeof PREGUNTAS)[number], respuestas: Respuestas): number {
  if (!p.puntuable) return 0;
  const valor = respuestas[p.id];
  const opcion = p.opciones?.find((o) => o.valor === valor);
  return typeof opcion?.puntos === "number" ? opcion.puntos : 0;
}

export function generarExcelDiagnostico(respuestas: Respuestas): Buffer {
  const filas: FilaExport[] = [];
  let orden = 1;

  for (const ejeId of ORDEN_EJES) {
    const preguntas = PREGUNTAS.filter((p) => p.eje === ejeId);
    const tema = TEMA_EXPORT[ejeId];

    for (const p of preguntas) {
      if (p.tipo === "matriz") {
        for (const fila of p.filasMatriz || []) {
          const respuestasMatriz = (respuestas[p.id] as Record<string, string>) || {};
          const val = respuestasMatriz[fila.id] ?? "";
          const etiquetaRespuesta = fila.esTexto
            ? val
            : p.opcionesMatriz?.find((o) => o.valor === val)?.etiqueta ?? "";
          filas.push({
            Tema: tema,
            Bloque: p.texto,
            "Preguntas Cerradas": fila.etiqueta,
            Respuesta: etiquetaRespuesta,
            Puntaje: 0,
            orden: orden++,
          });
        }
      } else {
        filas.push({
          Tema: tema,
          Bloque: p.bloque || "Bloque 0",
          "Preguntas Cerradas": p.texto,
          Respuesta: textoRespuesta(p, respuestas),
          Puntaje: puntajeRespuesta(p, respuestas),
          orden: orden++,
        });
      }
    }
  }

  const libro = nuevoLibro();
  const hoja = hojaDesdeFilas(filas, [26, 40, 60, 45, 9, 7]);
  agregarHoja(libro, hoja, "Export");
  return libroABuffer(libro);
}
