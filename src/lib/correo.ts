import nodemailer from "nodemailer";
import type { Respuestas } from "./preguntas";
import { generarExcelDiagnostico } from "./exportarDiagnostico";

// Copia por correo de cada diagnóstico enviado.
//
// Variables de entorno (configurarlas en Vercel → Settings → Environment Variables):
//   SMTP_HOST      smtp.gmail.com (Gmail / Google Workspace) o smtp.office365.com (Outlook / Microsoft 365)
//   SMTP_PORT      465 para Gmail, 587 para Outlook (por defecto 465)
//   SMTP_USER      el correo de la fundación desde el que se envía
//   SMTP_PASS      contraseña de aplicación de ese correo (no la contraseña normal)
//   CORREO_DESTINO uno o varios correos separados por coma

function configCorreo() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const destino = process.env.CORREO_DESTINO;
  if (!host || !user || !pass || !destino) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return { host, port, user, pass, destino };
}

export function correoConfigurado() {
  return configCorreo() !== null;
}

function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function enviarCopiaPorCorreo(opciones: {
  respuestas: Respuestas;
  idGuardado: number | null;
  errorGuardado?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = configCorreo();
  if (!cfg) return { ok: false, error: "El envío por correo no está configurado (faltan variables SMTP)." };

  const { respuestas, idGuardado, errorGuardado } = opciones;
  const r = (id: string) => String(respuestas[id] ?? "").trim();
  const empresa = r("EjeA_nombre_de_la_organizacion") || "(sin nombre)";
  const nit = r("EjeA_nit");
  const fecha = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
  const guardado = idGuardado !== null;

  const asunto = guardado
    ? `Diagnóstico Ruta Mujer – ${empresa}`
    : `⚠ NO GUARDADO EN BASE DE DATOS – Diagnóstico Ruta Mujer – ${empresa}`;

  const filas: [string, string][] = [
    ["Empresa", empresa],
    ["Razón social", r("EjeA_razon_social")],
    ["NIT", nit],
    ["Persona que responde", r("EjeA_nombre_de_la_persona_que_responde")],
    ["Cargo", r("EjeA_cargo_de_la_persona_que_responde")],
    ["Fecha de envío", fecha],
    ["Estado", guardado ? `Guardado en el panel (id ${idGuardado})` : "NO quedó guardado en el panel"],
  ];

  const aviso = guardado
    ? ""
    : `<p style="color:#b00020"><strong>Este diagnóstico no se pudo guardar en la base de datos.</strong>
       Las respuestas completas están en los archivos adjuntos; consérvalos para cargarlo después.
       Error: ${escaparHtml(errorGuardado || "desconocido")}</p>`;

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
      <p>Se recibió un nuevo diagnóstico de Ruta Mujer.</p>
      ${aviso}
      <table cellpadding="6" style="border-collapse:collapse">
        ${filas
          .map(
            ([k, v]) =>
              `<tr><td style="border:1px solid #ddd;background:#f5f5f5"><strong>${escaparHtml(k)}</strong></td>
               <td style="border:1px solid #ddd">${escaparHtml(v || "—")}</td></tr>`
          )
          .join("")}
      </table>
      <p>Adjuntos: el diagnóstico completo en Excel y una copia exacta de las respuestas (JSON) para recargarlo si hiciera falta.</p>
    </div>`;

  const nombreArchivo = empresa.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60) || "empresa";

  try {
    const transporte = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    await transporte.sendMail({
      from: `"Formulario Ruta Mujer" <${cfg.user}>`,
      to: cfg.destino,
      subject: asunto,
      html,
      attachments: [
        { filename: `Diagnostico_${nombreArchivo}.xlsx`, content: generarExcelDiagnostico(respuestas) },
        {
          filename: `respuestas_${nombreArchivo}.json`,
          content: JSON.stringify(respuestas, null, 2),
          contentType: "application/json",
        },
      ],
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
