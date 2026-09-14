import preguntasData from "./preguntas_data.json";

export type Opcion = { valor: string; etiqueta: string; puntos?: number };
export type FilaMatriz = { id: string; etiqueta: string; esTexto?: boolean };

export type TipoCampo = "texto" | "select" | "multiselect" | "archivo" | "matriz";

export type Pregunta = {
  id: string;
  eje: "A" | "B" | "C" | "1" | "2";
  bloque?: string;
  numero: string | number;
  texto: string;
  tipo: TipoCampo;
  opciones?: Opcion[];
  filasMatriz?: FilaMatriz[];
  opcionesMatriz?: Opcion[];
  puntuable: boolean;
  pendiente?: boolean;
  ayuda?: string;
  condicion?: { dependeDe: string; mostrarSi?: string[]; mostrarSiNoEs?: string };
};

export const PREGUNTAS: Pregunta[] = preguntasData as Pregunta[];

export const EJES = [
  { id: "A", nombre: "Datos generales", corto: "Datos generales" },
  { id: "B", nombre: "Oportunidades de empleo", corto: "Oportunidades" },
  { id: "C", nombre: "Inclusión laboral", corto: "Inclusión laboral" },
  { id: "1", nombre: "Gestión del talento inclusivo y con perspectiva de género", corto: "Talento inclusivo" },
  { id: "2", nombre: "Gestión empresarial con perspectiva de género", corto: "Gestión empresarial" },
] as const;

// Nombre exacto de "Tema" tal como debe salir en el exportable (el
// exportable usa su propio orden interno: 1 → 2 → A → B → C, independiente
// del orden en que se responde el formulario).
export const TEMA_EXPORT: Record<string, string> = {
  "1": "Eje 1 Talento inclusivo",
  "2": "Eje 2 Gestión empresarial",
  A: "Eje A Datos generales",
  B: "Eje B Oportunidades de Empleo",
  C: "Eje C Inclusión Laboral",
};

export function preguntasDeEje(eje: string): Pregunta[] {
  return PREGUNTAS.filter((p) => p.eje === eje);
}

export function bloquesDeEje(eje: string): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const p of preguntasDeEje(eje)) {
    const b = p.bloque || "";
    if (b && !vistos.has(b)) {
      vistos.add(b);
      out.push(b);
    }
  }
  return out;
}

// Respuestas: mapa id de pregunta -> valor (string | string[] | Record<filaId,string>)
export type Respuestas = Record<string, string | string[] | Record<string, string>>;

export function esVisible(p: Pregunta, respuestas: Respuestas): boolean {
  if (!p.condicion) return true;
  const valorPadre = respuestas[p.condicion.dependeDe];
  if (p.condicion.mostrarSi) {
    return typeof valorPadre === "string" && p.condicion.mostrarSi.includes(valorPadre);
  }
  if (p.condicion.mostrarSiNoEs) {
    return typeof valorPadre === "string" && valorPadre !== "" && valorPadre !== p.condicion.mostrarSiNoEs;
  }
  return true;
}
