"use client";

import { type Pregunta, type Respuestas } from "@/lib/preguntas";

function Etiqueta({ p }: { p: Pregunta }) {
  return (
    <label className="mb-2.5 block text-[17px] font-medium leading-snug text-[var(--color-grafito)]">
      <span className="mr-1 font-bold text-[var(--color-azul)]">#{p.numero}</span> {p.texto}
      {p.requerido && <span className="ml-1 font-bold text-[var(--color-azul)]">*</span>}
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
            className="w-full rounded-lg border border-[var(--color-grafito-20)] bg-white px-4 py-2.5 text-base text-[var(--color-grafito)] focus:border-[var(--color-azul)]"
          />
        ) : (
          <textarea
            value={(valor as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--color-grafito-20)] bg-white px-4 py-2.5 text-base text-[var(--color-grafito)] focus:border-[var(--color-azul)]"
          />
        )}
        {p.pendiente && (
          <p className="mt-1 text-sm text-[var(--color-azul)]">
            ⚠ Listado pendiente de confirmar — por ahora, escribe la respuesta directamente.
          </p>
        )}
      </div>
    );
  }

  if (p.tipo === "archivo") {
    return (
      <div className="mb-6 rounded-lg border border-dashed border-[var(--color-azul)] bg-[var(--color-azul-20)]/40 p-4">
        <Etiqueta p={p} />
        <input
          type="file"
          onChange={(e) => onChange(e.target.files?.[0]?.name || "")}
          className="text-base"
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
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-base transition-colors " +
                (valor === op.valor
                  ? "border-[var(--color-azul)] bg-[var(--color-azul-20)]"
                  : "border-[var(--color-grafito-20)] bg-white hover:border-[var(--color-azul)]")
              }
            >
              <input
                type="radio"
                name={p.id}
                checked={valor === op.valor}
                onChange={() => onChange(op.valor)}
                className="mt-1 shrink-0"
              />
              <span>{op.etiqueta}</span>
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
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-base transition-colors " +
                (seleccionadas.includes(op.valor)
                  ? "border-[var(--color-azul)] bg-[var(--color-azul-20)]"
                  : "border-[var(--color-grafito-20)] bg-white hover:border-[var(--color-azul)]")
              }
            >
              <input
                type="checkbox"
                checked={seleccionadas.includes(op.valor)}
                onChange={() => toggle(op.valor)}
                className="mt-1 shrink-0"
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
        <div className="overflow-x-auto rounded-lg border border-[var(--color-grafito-20)]">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="bg-[var(--color-azul)] text-sm font-semibold text-white">
                <th className="px-4 py-3">Grupo poblacional</th>
                {p.opcionesMatriz?.map((op) => (
                  <th key={op.valor} className="px-4 py-3 text-center">
                    {op.etiqueta}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.filasMatriz?.map((fila) =>
                fila.esTexto ? (
                  <tr key={fila.id} className="border-b border-[var(--color-grafito-20)] last:border-0">
                    <td className="px-4 py-2.5">{fila.etiqueta}</td>
                    <td colSpan={p.opcionesMatriz?.length || 3} className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Especifique (opcional)"
                        value={respuestasMatriz[fila.id] || ""}
                        onChange={(e) =>
                          onChange({ ...respuestasMatriz, [fila.id]: e.target.value })
                        }
                        className="w-full rounded-md border border-[var(--color-grafito-20)] px-3 py-1.5 text-base focus:border-[var(--color-azul)]"
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={fila.id} className="border-b border-[var(--color-grafito-20)] last:border-0">
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
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
