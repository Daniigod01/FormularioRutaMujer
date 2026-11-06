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
      // Nunca responder "éxito" si no se guardó: la empresa vería la pantalla
      // de envío exitoso y el diagnóstico se perdería sin que nadie lo note.
      // Dejamos las respuestas en el log para poder recuperarlas si hace falta.
      console.error("guardarDiagnostico FALLÓ:", guardado.error);
      console.error("Respuestas no guardadas:", JSON.stringify(respuestas));
      return NextResponse.json(
        { ok: false, error: "No se pudo guardar el diagnóstico. Intenta de nuevo en unos segundos." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, id: guardado.id });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}
