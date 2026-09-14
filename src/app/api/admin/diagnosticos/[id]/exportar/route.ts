import { cookies } from "next/headers";
import { cookieValida, COOKIE_ADMIN } from "@/lib/adminAuth";
import { obtenerDiagnostico } from "@/lib/db";
import { generarExcelDiagnostico } from "@/lib/exportarDiagnostico";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const jar = await cookies();
  const sesion = jar.get(COOKIE_ADMIN)?.value;

  if (!cookieValida(sesion)) {
    return new Response(JSON.stringify({ ok: false, error: "No autorizado." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = await params;
  const respuestas = await obtenerDiagnostico(id);
  if (!respuestas) {
    return new Response(JSON.stringify({ ok: false, error: "No se encontró el registro." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buffer = generarExcelDiagnostico(respuestas);
  const nombreEmpresa = String(respuestas["EjeA_nombre_de_la_organizacion"] || "empresa")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .slice(0, 60);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Diagnostico_${nombreEmpresa}.xlsx"`,
    },
  });
}
