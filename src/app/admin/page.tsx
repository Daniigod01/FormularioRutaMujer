"use client";

import { useEffect, useState } from "react";

type Diagnostico = { id: string; empresa: string; nit: string; fecha: string };

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [items, setItems] = useState<Diagnostico[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  function cargarLista() {
    setCargandoLista(true);
    setErrorLista(null);
    fetch("/api/admin/diagnosticos")
      .then(async (r) => {
        if (r.status === 401) {
          setAutenticado(false);
          return null;
        }
        // La cookie es válida (no dio 401) — ya estamos autenticados,
        // independientemente de si la consulta a la base de datos salió bien.
        setAutenticado(true);
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.ok) {
          setItems(data.items);
        } else {
          setErrorLista(data.error);
        }
        setCargandoLista(false);
      })
      .catch(() => {
        setErrorLista("No se pudo cargar la lista.");
        setCargandoLista(false);
        setAutenticado((actual) => (actual === null ? false : actual));
      });
  }

  useEffect(() => {
    cargarLista();
  }, []);

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setErrorLogin(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    setCargando(false);
    if (res.ok) {
      setAutenticado(true);
      cargarLista();
    } else {
      const data = await res.json().catch(() => ({ error: "Error al iniciar sesión." }));
      setErrorLogin(data.error || "Clave incorrecta.");
    }
  }

  async function cerrarSesion() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAutenticado(false);
    setItems([]);
  }

  async function descargar(item: Diagnostico) {
    const res = await fetch(`/api/admin/diagnosticos/${item.id}/exportar`);
    if (!res.ok) {
      alert("No se pudo generar el Excel de este registro.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Diagnostico_${item.empresa}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function borrar(item: Diagnostico) {
    if (!confirm(`¿Borrar el diagnóstico de "${item.empresa}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const res = await fetch(`/api/admin/diagnosticos/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({ ok: false, error: "Error al borrar." }));
    if (!data.ok) {
      alert("No se pudo borrar: " + data.error);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  const itemsFiltrados = items.filter(
    (i) =>
      i.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.nit.includes(busqueda)
  );

  const logos = (alto: string) => (
    <div className={alto === "grande" ? "flex items-center gap-4" : "flex items-center gap-4 sm:gap-6"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/fci-logo.png" alt="Fundación Colombia Incluyente" className={alto === "grande" ? "h-10 w-auto" : "h-10 w-auto sm:h-12"} />
      <div className="h-9 w-px bg-[var(--color-grafito-20)] sm:h-10" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-colsubsidio.png" alt="Colsubsidio" className={alto === "grande" ? "h-8 w-auto" : "h-8 w-auto sm:h-10"} />
    </div>
  );

  if (autenticado === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-azul)]">
        <p className="text-sm text-white/80">Cargando…</p>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="on-dark flex min-h-screen items-center justify-center bg-[var(--color-azul)] px-6">
        <form
          onSubmit={iniciarSesion}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div className="flex justify-center border-b-4 border-[var(--color-amarillo)] bg-white px-6 py-5">
            {logos("grande")}
          </div>
          <div className="p-8">
            <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-azul)]">
              Panel Ruta Mujer
            </h1>
            <p className="mb-6 text-base text-[var(--color-grafito)]">
              Diagnósticos de empresas. Acceso restringido.
            </p>
            <label htmlFor="clave" className="mb-1.5 block text-base font-medium text-[var(--color-grafito)]">
              Clave de acceso
            </label>
            <input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoFocus
              className="mb-4 w-full rounded-lg border border-[var(--color-grafito-20)] px-4 py-2.5 text-base focus:border-[var(--color-azul)]"
            />
            {errorLogin && (
              <p role="alert" className="mb-4 rounded-md border-l-4 border-[var(--color-amarillo)] bg-[var(--color-amarillo-20)] px-3 py-2 text-[15px] text-[var(--color-azul)]">
                {errorLogin}
              </p>
            )}
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-full bg-[var(--color-azul)] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--color-grafito)] focus-visible:outline-[var(--color-azul)] disabled:opacity-60"
            >
              {cargando ? "Ingresando…" : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-4 border-[var(--color-amarillo)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-4 px-4 py-3 sm:px-6 sm:py-4">
          {logos("responsive")}
        </div>
      </header>

      <div className="on-dark bg-[var(--color-azul)] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-base font-medium text-[var(--color-amarillo)]">Ruta Mujer</p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              Panel de diagnósticos empresariales
            </h1>
          </div>
          <button
            onClick={cerrarSesion}
            className="shrink-0 rounded-full border-2 border-white px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-white/15"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por empresa o NIT…"
            aria-label="Buscar por empresa o NIT"
            className="w-full rounded-full border border-[var(--color-grafito-20)] bg-white px-5 py-2.5 text-base focus:border-[var(--color-azul)] sm:w-80"
          />
          <button
            onClick={cargarLista}
            className="rounded-full border-2 border-[var(--color-azul)] px-5 py-2 text-base font-semibold text-[var(--color-azul)] transition-colors hover:bg-[var(--color-azul)] hover:text-white"
          >
            ⟳ Actualizar
          </button>
        </div>

        {cargandoLista ? (
          <p className="text-base text-[var(--color-grafito)]">Cargando diagnósticos…</p>
        ) : errorLista ? (
          <div role="alert" className="rounded-lg border-l-4 border-[var(--color-amarillo)] bg-[var(--color-amarillo-20)] p-4 text-[15px] text-[var(--color-azul)]">
            <p className="font-semibold">No se pudo conectar con la base de datos.</p>
            <p className="mt-1">{errorLista}</p>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <p className="text-base text-[var(--color-grafito)]">Todavía no hay diagnósticos registrados.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-grafito-20)] bg-white">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="bg-[var(--color-azul)] text-sm font-semibold text-white">
                  <th className="px-5 py-3.5">Empresa</th>
                  <th className="px-5 py-3.5">NIT</th>
                  <th className="px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--color-grafito-20)] last:border-0 hover:bg-[var(--color-azul-20)]/30">
                    <td className="px-5 py-3.5 font-semibold text-[var(--color-azul)]">{item.empresa}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[var(--color-grafito)]">{item.nit}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-[var(--color-grafito)]">
                      {item.fecha ? new Date(item.fecha).toLocaleDateString("es-CO") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => descargar(item)}
                          className="whitespace-nowrap rounded-full bg-[var(--color-amarillo)] px-4 py-1.5 text-[15px] font-semibold text-[var(--color-azul)] transition-colors hover:bg-[var(--color-azul)] hover:text-[var(--color-amarillo)]"
                        >
                          ⬇ Descargar Excel
                        </button>
                        <button
                          onClick={() => borrar(item)}
                          className="whitespace-nowrap rounded-full border-2 border-[var(--color-grafito)] px-4 py-1.5 text-[15px] font-semibold text-[var(--color-grafito)] transition-colors hover:bg-[var(--color-grafito)] hover:text-white"
                        >
                          🗑 Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
