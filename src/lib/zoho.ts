// Cliente de Zoho CRM — SOLO se ejecuta en el servidor.
// Mismo patrón de autenticación que en la app de Ruta Mujer.

const ZOHO_ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
const ZOHO_API_DOMAIN = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

// Nombre del módulo en Zoho CRM que recibirá los diagnósticos.
// Actualízalo aquí una vez creado el módulo (ver Especificacion_Campos_Diagnostico_Empresas.xlsx).
export const MODULO_DIAGNOSTICO = process.env.ZOHO_MODULO_DIAGNOSTICO || "Diagnostico_Empresas_Potenciales";

function credencialesConfiguradas() {
  return Boolean(
    process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN
  );
}

type CacheToken = { value: string; expiresAt: number };
const globalConTipo = globalThis as unknown as {
  __zohoTokenCacheDiag?: CacheToken;
  __zohoTokenPromiseDiag?: Promise<string>;
};

async function obtenerAccessToken(): Promise<string> {
  const cache = globalConTipo.__zohoTokenCacheDiag;
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  if (globalConTipo.__zohoTokenPromiseDiag) return globalConTipo.__zohoTokenPromiseDiag;

  const promesa = (async () => {
    const params = new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      grant_type: "refresh_token",
    });
    const res = await fetch(`${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token?${params}`, { method: "POST" });
    if (!res.ok) {
      const cuerpo = await res.text();
      throw new Error(`No se pudo renovar el token de Zoho (${res.status}): ${cuerpo}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(`Zoho rechazó el refresh token: ${data.error}`);
    if (!data.access_token) throw new Error("Zoho no devolvió un access_token.");

    globalConTipo.__zohoTokenCacheDiag = {
      value: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };
    return data.access_token as string;
  })();

  globalConTipo.__zohoTokenPromiseDiag = promesa;
  try {
    return await promesa;
  } finally {
    globalConTipo.__zohoTokenPromiseDiag = undefined;
  }
}

export type ResultadoEnvio = { ok: true; id: string } | { ok: false; error: string };

// Crea un registro nuevo en el módulo de diagnóstico con los campos ya
// mapeados (clave = api_name del campo en Zoho, valor = respuesta).
export async function crearRegistroDiagnostico(
  camposZoho: Record<string, unknown>
): Promise<ResultadoEnvio> {
  if (!credencialesConfiguradas()) {
    return { ok: false, error: "Credenciales de Zoho no configuradas en el servidor todavía." };
  }
  try {
    const token = await obtenerAccessToken();
    const res = await fetch(`${ZOHO_API_DOMAIN}/crm/v6/${MODULO_DIAGNOSTICO}`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: [camposZoho] }),
    });
    const data = await res.json();
    const primerResultado = data?.data?.[0];
    if (!res.ok || primerResultado?.status !== "success") {
      const detalle = primerResultado?.message || JSON.stringify(data);
      throw new Error(`Zoho rechazó el registro: ${detalle}`);
    }
    return { ok: true, id: String(primerResultado.details.id) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Trae un registro de diagnóstico por ID (para el exportable).
export async function obtenerRegistroDiagnostico(id: string): Promise<Record<string, unknown> | null> {
  if (!credencialesConfiguradas()) return null;
  try {
    const token = await obtenerAccessToken();
    const res = await fetch(`${ZOHO_API_DOMAIN}/crm/v6/${MODULO_DIAGNOSTICO}/${id}`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0] ?? null;
  } catch {
    return null;
  }
}
