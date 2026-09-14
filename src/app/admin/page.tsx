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
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.ok) {
          setItems(data.items);
          setAutenticado(true);
        } else {
          setErrorLista(data.error);
        }
        setCargandoLista(false);
      })
      .catch(() => {
        setErrorLista("No se pudo cargar la lista.");
        setCargandoLista(false);
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

  const itemsFiltrados = items.filter(
    (i) =>
      i.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.nit.includes(busqueda)
  );

  if (autenticado === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2b2b2a]">
        <p className="text-white/50 text-sm">Cargando…</p>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2b2b2a] px-6">
        <form
          onSubmit={iniciarSesion}
          className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg"
        >
          <h1 className="mb-1 text-xl font-bold text-[#2b2b2a]">Panel Ruta Mujer</h1>
          <p className="mb-6 text-sm text-gray-500">
            Diagnósticos de empresas — acceso restringido
          </p>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-600">
            Clave de acceso
          </label>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoFocus
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
          />
          {errorLogin && <p className="mb-4 text-sm text-red-600">{errorLogin}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-[#2b2b2a] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <header className="flex items-center justify-between bg-[#2b2b2a] px-6 py-4 text-white">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Ruta Mujer</p>
          <h1 className="text-lg font-bold">Panel de diagnósticos empresariales</h1>
        </div>
        <button
          onClick={cerrarSesion}
          className="rounded-full border border-white/25 px-3 py-1.5 text-xs hover:bg-white/10"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por empresa o NIT…"
            className="w-72 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm"
          />
          <button
            onClick={cargarLista}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium hover:bg-gray-50"
          >
            ⟳ Actualizar
          </button>
        </div>

        {cargandoLista ? (
          <p className="text-sm text-gray-400">Cargando diagnósticos…</p>
        ) : errorLista ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">No se pudo conectar con Zoho.</p>
            <p className="mt-1 text-xs opacity-80">{errorLista}</p>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <p className="text-sm text-gray-400">Todavía no hay diagnósticos registrados.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">NIT</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3 font-medium text-[#2b2b2a]">{item.empresa}</td>
                    <td className="px-5 py-3 text-gray-500">{item.nit}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {item.fecha ? new Date(item.fecha).toLocaleDateString("es-CO") : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => descargar(item)}
                        className="rounded-full border border-[#2b2b2a]/30 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
                      >
                        ⬇ Descargar Excel
                      </button>
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
