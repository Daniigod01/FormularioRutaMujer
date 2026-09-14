import { NextResponse } from "next/server";
import { claveValida, tokenEsperado, COOKIE_ADMIN } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const body = await req.json();
  const clave = String(body.clave || "");

  if (!claveValida(clave)) {
    return NextResponse.json({ ok: false, error: "Clave incorrecta." }, { status: 401 });
  }

  const token = tokenEsperado();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ADMIN, token!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });
  return res;
}
