import { NextResponse } from "next/server";
import { guardarDiagnostico } from "@/lib/db";
import { correoConfigurado, enviarCopiaPorCorreo } from "@/lib/correo";
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
    if (!guardado.ok) console.error("guardarDiagnostico FALLÓ:", guardado.error);

    // Copia por correo de cada diagnóstico (se guarde o no en la base).
    let correoEnviado = false;
    if (correoConfigurado()) {
      const correo = await enviarCopiaPorCorreo({
        respuestas,
        idGuardado: guardado.ok ? guardado.id : null,
        errorGuardado: guardado.ok ? undefined : guardado.error,
      });
      correoEnviado = correo.ok;
      if (!correo.ok) console.error("enviarCopiaPorCorreo FALLÓ:", correo.error);
    }

    if (guardado.ok) {
      return NextResponse.json({ ok: true, id: guardado.id, correoEnviado });
    }

    if (correoEnviado) {
      // La base falló pero las respuestas completas quedaron en el correo:
      // la información está a salvo, así que no hacemos repetir a la empresa.
      return NextResponse.json({ ok: true, id: null, correoEnviado, guardadoEnBD: false });
    }

    // No quedó en ningún lado: nunca responder "éxito".
    // Dejamos las respuestas en el log para poder recuperarlas si hace falta.
    console.error("Respuestas no guardadas:", JSON.stringify(respuestas));
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el diagnóstico. Intenta de nuevo en unos segundos." },
      { status: 503 }
    );
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}
