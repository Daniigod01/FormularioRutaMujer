import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieValida, COOKIE_ADMIN } from "@/lib/adminAuth";
import { borrarDiagnostico } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const jar = await cookies();
  const sesion = jar.get(COOKIE_ADMIN)?.value;

  if (!cookieValida(sesion)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const resultado = await borrarDiagnostico(id);
  return NextResponse.json(resultado);
}
