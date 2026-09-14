import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieValida, COOKIE_ADMIN } from "@/lib/adminAuth";
import { listarDiagnosticos } from "@/lib/db";

export async function GET() {
  const jar = await cookies();
  const sesion = jar.get(COOKIE_ADMIN)?.value;

  if (!cookieValida(sesion)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const resultado = await listarDiagnosticos();
  return NextResponse.json(resultado);
}
