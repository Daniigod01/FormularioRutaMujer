"use client";

import { type Pregunta, type Respuestas } from "@/lib/preguntas";

function Etiqueta({ p }: { p: Pregunta }) {
  return (
    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--color-grafito)]">
      <span className="text-[var(--color-oscuro)]">#{p.numero}</span> {p.texto}
    </label>
  );
}

export default function PreguntaRenderer({
  pregunta,
  valor,
  onChange,
}: {
  pregunta: Pregunta;
  valor: string | string[] | Record<string, string> | undefined;
  onChange: (v: string | string[] | Record<string, string>) => void;
}) {
  const p = pregunta;

  if (p.tipo === "texto") {
    const esCorta = p.texto.length < 40 && !p.texto.startsWith("¿Cuál");
    return (
      <div className="mb-6">
        <Etiqueta p={p} />
        {esCorta ? (
          <input
            type="text"
            value={(valor as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm focus:border-[var(--color-oscuro)]"
          />
        ) : (
          <textarea
            value={(valor as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm focus:border-[var(--color-oscuro)]"
          />
        )}
        {p.pendiente && (
          <p className="mt-1 text-xs text-[var(--color-oscuro)]/70">
            ⚠ Listado pendiente de confirmar — por ahora, escribe la respuesta directamente.
          </p>
        )}
      </div>
    );
  }

  if (p.tipo === "archivo") {
    return (
      <div className="mb-6 rounded-lg border border-dashed border-[var(--color-oscuro)]/30 bg-[var(--color-oscuro)]/5 p-4">
        <Etiqueta p={p} />
        <input
          type="file"
          onChange={(e) => onChange(e.target.files?.[0]?.name || "")}
          className="text-sm"
        />
      </div>
    );
  }

  if (p.tipo === "select") {
    return (
      <div className="mb-6">
        <Etiqueta p={p} />
        <div className="space-y-2">
          {p.opciones?.map((op) => (
            <label
              key={op.valor}
              className={
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors " +
                (valor === op.valor
                  ? "border-[var(--color-oscuro)] bg-[var(--color-oscuro)]/5"
                  : "border-[var(--color-line)] bg-white hover:bg-black/[0.02]")
              }
            >
              <input
                type="radio"
                name={p.id}
                checked={valor === op.valor}
                onChange={() => onChange(op.valor)}
                className="mt-0.5"
              />
              <span>
                {op.etiqueta}
                {typeof op.puntos === "number" && (
                  <span className="ml-1 text-xs text-[var(--color-grafito)]/40">
                    ({op.puntos} pt{op.puntos !== 1 ? "s" : ""})
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (p.tipo === "multiselect") {
    const seleccionadas = (valor as string[]) || [];
    function toggle(v: string) {
      if (seleccionadas.includes(v)) {
        onChange(seleccionadas.filter((x) => x !== v));
      } else {
        onChange([...seleccionadas, v]);
      }
    }
    return (
      <div className="mb-6">
        <Etiqueta p={p} />
        <div className="space-y-2">
          {p.opciones?.map((op) => (
            <label
              key={op.valor}
              className={
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors " +
                (seleccionadas.includes(op.valor)
                  ? "border-[var(--color-oscuro)] bg-[var(--color-oscuro)]/5"
                  : "border-[var(--color-line)] bg-white hover:bg-black/[0.02]")
              }
            >
              <input
                type="checkbox"
                checked={seleccionadas.includes(op.valor)}
                onChange={() => toggle(op.valor)}
                className="mt-0.5"
              />
              <span>{op.etiqueta}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (p.tipo === "matriz") {
    const respuestasMatriz = (valor as Record<string, string>) || {};
    return (
      <div className="mb-6">
        <Etiqueta p={p} />
        <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-black/[0.02] text-xs uppercase text-[var(--color-grafito)]/50">
                <th className="px-4 py-2">Grupo poblacional</th>
                {p.opcionesMatriz?.map((op) => (
                  <th key={op.valor} className="px-4 py-2 text-center">
                    {op.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.filasMatriz?.map((fila) => (
                <tr key={fila.id} className="border-b border-[var(--color-line)]/60">
                  <td className="px-4 py-2.5">{fila.etiqueta}</td>
                  {p.opcionesMatriz?.map((op) => (
                    <td key={op.valor} className="px-4 py-2.5 text-center">
                      <input
                        type="radio"
                        name={fila.id}
                        checked={respuestasMatriz[fila.id] === op.valor}
                        onChange={() =>
                          onChange({ ...respuestasMatriz, [fila.id]: op.valor })
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
