import { NextResponse } from "next/server";
import { crearRegistroDiagnostico } from "@/lib/zoho";
import { respuestasAZoho } from "@/lib/mapeoZoho";
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

    const campos = respuestasAZoho(respuestas, resultado);
    const resultadoEnvio = await crearRegistroDiagnostico(campos);

    if (!resultadoEnvio.ok) {
      // Registramos el motivo en los logs del servidor para diagnosticarlo
      // (Runtime Logs en Vercel). Mientras el módulo de Zoho no exista
      // todavía, dejamos que el formulario avance igual (modo prueba), para
      // poder probar el flujo completo y el exportable sin quedar bloqueados.
      console.error("crearRegistroDiagnostico:", resultadoEnvio.error);
      return NextResponse.json({ ok: true, modoPrueba: true, error: resultadoEnvio.error });
    }

    return NextResponse.json({ ok: true, id: resultadoEnvio.id });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}
