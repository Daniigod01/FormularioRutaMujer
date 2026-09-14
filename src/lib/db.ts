import { Pool } from "pg";
import type { Respuestas } from "./preguntas";
import type { ResultadoEje } from "./puntaje";

// Cadena de conexión: Supabase (u otro Postgres estándar conectado por
// Vercel Marketplace) expone POSTGRES_URL o POSTGRES_URL_NON_POOLING.
// Le quitamos cualquier "sslmode" que traiga incluido en la URL, porque
// si no, node-postgres ignora la configuración de SSL que le pasamos
// aparte y termina fallando con "self-signed certificate in certificate chain".
function cadenaConexion(): string | undefined {
  const cruda =
    process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  if (!cruda) return undefined;
  try {
    const url = new URL(cruda);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return cruda;
  }
}

function bdConfigurada() {
  return Boolean(cadenaConexion());
}

// Un solo Pool reutilizado entre invocaciones "calientes" de la función
// serverless (igual patrón que usamos para cachear el token de Zoho en Ruta Mujer).
const globalConTipo = globalThis as unknown as { __pgPool?: Pool };

function obtenerPool(): Pool {
  if (!globalConTipo.__pgPool) {
    globalConTipo.__pgPool = new Pool({
      connectionString: cadenaConexion(),
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return globalConTipo.__pgPool;
}

let tablaLista = false;

async function asegurarTabla() {
  if (tablaLista) return;
  const pool = obtenerPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diagnosticos (
      id SERIAL PRIMARY KEY,
      empresa TEXT NOT NULL DEFAULT '',
      nit TEXT NOT NULL DEFAULT '',
      respuestas JSONB NOT NULL,
      resultado JSONB NOT NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
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
    const pool = obtenerPool();
    const empresa = String(respuestas["EjeA_nombre_de_la_organizacion"] ?? "");
    const nit = String(respuestas["EjeA_nit"] ?? "");
    const resultadoQuery = await pool.query(
      `INSERT INTO diagnosticos (empresa, nit, respuestas, resultado)
       VALUES ($1, $2, $3::jsonb, $4::jsonb)
       RETURNING id`,
      [empresa, nit, JSON.stringify(respuestas), JSON.stringify(resultado)]
    );
    return { ok: true, id: resultadoQuery.rows[0].id as number };
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
    const pool = obtenerPool();
    const resultado = await pool.query(
      `SELECT id, empresa, nit, creado_en FROM diagnosticos ORDER BY creado_en DESC LIMIT 500`
    );
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
    const pool = obtenerPool();
    const resultado = await pool.query(`SELECT respuestas FROM diagnosticos WHERE id = $1`, [id]);
    if (resultado.rows.length === 0) return null;
    return resultado.rows[0].respuestas as Respuestas;
  } catch {
    return null;
  }
}

export async function borrarDiagnostico(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!bdConfigurada()) {
    return { ok: false, error: "La base de datos no está configurada en el servidor todavía." };
  }
  try {
    await asegurarTabla();
    const pool = obtenerPool();
    await pool.query(`DELETE FROM diagnosticos WHERE id = $1`, [id]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
