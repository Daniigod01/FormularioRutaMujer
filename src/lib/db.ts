import { sql } from "@vercel/postgres";
import type { Respuestas } from "./preguntas";
import type { ResultadoEje } from "./puntaje";

function bdConfigurada() {
  return Boolean(process.env.POSTGRES_URL);
}

let tablaLista = false;

// Crea la tabla si todavía no existe. Se llama antes de cada operación —
// es barato (IF NOT EXISTS) y evita depender de un paso manual de "migración".
async function asegurarTabla() {
  if (tablaLista) return;
  await sql`
    CREATE TABLE IF NOT EXISTS diagnosticos (
      id SERIAL PRIMARY KEY,
      empresa TEXT NOT NULL DEFAULT '',
      nit TEXT NOT NULL DEFAULT '',
      respuestas JSONB NOT NULL,
      resultado JSONB NOT NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tablaLista = true;
}

export type ResultadoGuardar = { ok: true; id: number } | { ok: false; error: string };

export async function guardarDiagnostico(
  respuestas: Respuestas,
  resultado: { eje1: ResultadoEje; eje2: ResultadoEje }
): Promise<ResultadoGuardar> {
  if (!bdConfigurada()) {
    return { ok: false, error: "La base de datos no está configurada en el servidor todavía." };
  }
  try {
    await asegurarTabla();
    const empresa = String(respuestas["EjeA_nombre_de_la_organizacion"] ?? "");
    const nit = String(respuestas["EjeA_nit"] ?? "");
    const fila = await sql`
      INSERT INTO diagnosticos (empresa, nit, respuestas, resultado)
      VALUES (${empresa}, ${nit}, ${JSON.stringify(respuestas)}::jsonb, ${JSON.stringify(resultado)}::jsonb)
      RETURNING id
    `;
    return { ok: true, id: fila.rows[0].id as number };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type DiagnosticoResumen = { id: number; empresa: string; nit: string; fecha: string };
export type ListaDiagnosticos = { ok: true; items: DiagnosticoResumen[] } | { ok: false; error: string };

export async function listarDiagnosticos(): Promise<ListaDiagnosticos> {
  if (!bdConfigurada()) {
    return { ok: false, error: "La base de datos no está configurada en el servidor todavía." };
  }
  try {
    await asegurarTabla();
    const resultado = await sql`
      SELECT id, empresa, nit, creado_en
      FROM diagnosticos
      ORDER BY creado_en DESC
      LIMIT 500
    `;
    const items: DiagnosticoResumen[] = resultado.rows.map((r) => ({
      id: r.id as number,
      empresa: String(r.empresa || "(sin nombre)"),
      nit: String(r.nit || ""),
      fecha: String(r.creado_en),
    }));
    return { ok: true, items };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function obtenerDiagnostico(id: string): Promise<Respuestas | null> {
  if (!bdConfigurada()) return null;
  try {
    await asegurarTabla();
    const resultado = await sql`SELECT respuestas FROM diagnosticos WHERE id = ${id}`;
    if (resultado.rows.length === 0) return null;
    return resultado.rows[0].respuestas as Respuestas;
  } catch {
    return null;
  }
}
