import { generarExcelDiagnostico } from "@/lib/exportarDiagnostico";
import type { Respuestas } from "@/lib/preguntas";

export async function POST(req: Request) {
  const body = await req.json();
  const respuestas = body.respuestas as Respuestas;

  const buffer = generarExcelDiagnostico(respuestas);
  const nombreEmpresa = String(respuestas["EjeA_nombre_de_la_organizacion"] || "empresa")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Diagnostico_${nombreEmpresa}.xlsx"`,
    },
  });
}
