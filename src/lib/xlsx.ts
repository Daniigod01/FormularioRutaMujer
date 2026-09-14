import * as XLSX from "xlsx";

export type Fila = Record<string, unknown>;

export function hojaDesdeFilas(filas: Fila[], anchos?: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.json_to_sheet(filas);
  if (anchos) ws["!cols"] = anchos.map((w) => ({ wch: w }));
  return ws;
}

export function nuevoLibro(): XLSX.WorkBook {
  return XLSX.utils.book_new();
}

export function agregarHoja(libro: XLSX.WorkBook, ws: XLSX.WorkSheet, nombre: string) {
  XLSX.utils.book_append_sheet(libro, ws, nombre.slice(0, 31));
}

export function libroABuffer(libro: XLSX.WorkBook): Buffer {
  return XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
