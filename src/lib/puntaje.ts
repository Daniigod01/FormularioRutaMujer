import { PREGUNTAS, type Respuestas } from "./preguntas";

export type NivelEje = "Mínimo compromiso" | "Compromiso parcial" | "Avanzado";

export type ResultadoEje = {
  eje: string;
  puntajeTotal: number;
  preguntasRespondidas: number;
  promedio: number; // 0-2
  nivel: NivelEje;
};

export function nivelDePromedio(promedio: number): NivelEje {
  if (promedio <= 0.66) return "Mínimo compromiso";
  if (promedio <= 1.33) return "Compromiso parcial";
  return "Avanzado";
}

export function calcularResultadoEje(eje: "1" | "2", respuestas: Respuestas): ResultadoEje {
  const preguntas = PREGUNTAS.filter((p) => p.eje === eje && p.puntuable);
  let suma = 0;
  let contestadas = 0;
  for (const p of preguntas) {
    const valor = respuestas[p.id];
    if (typeof valor === "string" && valor) {
      const opcion = p.opciones?.find((o) => o.valor === valor);
      if (opcion && typeof opcion.puntos === "number") {
        suma += opcion.puntos;
        contestadas++;
      }
    }
  }
  const promedio = contestadas > 0 ? suma / contestadas : 0;
  return {
    eje,
    puntajeTotal: suma,
    preguntasRespondidas: contestadas,
    promedio: Math.round(promedio * 100) / 100,
    nivel: nivelDePromedio(promedio),
  };
}

export function calcularResultadoCompleto(respuestas: Respuestas) {
  return {
    eje1: calcularResultadoEje("1", respuestas),
    eje2: calcularResultadoEje("2", respuestas),
  };
}
