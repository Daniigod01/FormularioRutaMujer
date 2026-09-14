import { createHash } from "crypto";

export const COOKIE_ADMIN = "ruta_mujer_admin";

function claveEsperada(): string | null {
  const clave = process.env.ADMIN_PASSWORD;
  return clave ? clave : null;
}

// El valor que guardamos en la cookie NO es la clave en texto plano — es un
// hash derivado de ella, para no dejarla expuesta tal cual en el navegador.
export function tokenEsperado(): string | null {
  const clave = claveEsperada();
  if (!clave) return null;
  return createHash("sha256").update("ruta-mujer-admin:" + clave).digest("hex");
}

export function claveValida(intentada: string): boolean {
  const clave = claveEsperada();
  if (!clave) return false;
  return intentada === clave;
}

export function cookieValida(valorCookie: string | undefined): boolean {
  const esperado = tokenEsperado();
  if (!esperado || !valorCookie) return false;
  return valorCookie === esperado;
}
