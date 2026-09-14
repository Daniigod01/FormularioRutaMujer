import { PREGUNTAS, type Respuestas } from "./preguntas";
import type { ResultadoEje } from "./puntaje";

// Convierte las respuestas del formulario (que internamente usan códigos
// cortos tipo "A"/"B"/"C" o slugs) a los mismos textos completos que se
// verían como opciones de lista en Zoho — así el registro que llega al CRM
// es legible tal cual, sin tener que traducir códigos después.
export function respuestasAZoho(
  respuestas: Respuestas,
  resultado: { eje1: ResultadoEje; eje2: ResultadoEje }
): Record<string, unknown> {
  const campos: Record<string, unknown> = {};

  for (const p of PREGUNTAS) {
    const valor = respuestas[p.id];
    if (valor === undefined) continue;

    if (p.tipo === "texto" || p.tipo === "archivo") {
      campos[p.id] = valor as string;
    } else if (p.tipo === "select") {
      const opcion = p.opciones?.find((o) => o.valor === valor);
      campos[p.id] = opcion?.etiqueta ?? (valor as string);
    } else if (p.tipo === "multiselect") {
      const seleccionadas = (valor as string[]) || [];
      campos[p.id] = seleccionadas
        .map((v) => p.opciones?.find((o) => o.valor === v)?.etiqueta ?? v)
        .join(";");
    } else if (p.tipo === "matriz") {
      const respuestasMatriz = (valor as Record<string, string>) || {};
      for (const fila of p.filasMatriz || []) {
        const v = respuestasMatriz[fila.id];
        const etiqueta = p.opcionesMatriz?.find((o) => o.valor === v)?.etiqueta ?? v ?? "";
        campos[fila.id] = etiqueta;
      }
    }
  }

  // Campos calculados (ver hoja "Resumen y puntajes" de la especificación).
  campos["Resumen_Puntaje_total_Eje_1"] = resultado.eje1.promedio;
  campos["Resumen_Puntaje_total_Eje_2"] = resultado.eje2.promedio;
  campos["Resumen_Nivel_Eje_1"] = resultado.eje1.nivel;
  campos["Resumen_Nivel_Eje_2"] = resultado.eje2.nivel;

  return campos;
}
