import { NextResponse } from "next/server";
import { guardarDiagnostico } from "@/lib/db";
import type { Respuestas } from "@/lib/preguntas";
import type { ResultadoEje } from "@/lib/puntaje";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const respuestas = body.respuestas as Respuestas;
    const resultado = body.resultado as { eje1: ResultadoEje; eje2: ResultadoEje };

    if (!respuestas || !resultado) {
      return NextResponse.json({ ok: false, error: "Faltan datos en la solicitud." }, { status: 400 });
    }

    const guardado = await guardarDiagnostico(respuestas, resultado);

    if (!guardado.ok) {
      // Si la base de datos aún no está configurada, dejamos que el
      // formulario avance igual (modo prueba), para poder probar el flujo
      // completo y el exportable sin quedar bloqueados.
      console.error("guardarDiagnostico:", guardado.error);
      return NextResponse.json({ ok: true, modoPrueba: true, error: guardado.error });
    }

    return NextResponse.json({ ok: true, id: guardado.id });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}
