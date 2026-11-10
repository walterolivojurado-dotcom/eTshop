import * as XLSX from "xlsx";

export interface ColWidth {
  wch: number;
}

export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName: string = "Inventario",
  colWidths?: number[]
) {
  const ws = XLSX.utils.json_to_sheet(data);

  if (colWidths && colWidths.length > 0) {
    ws["!cols"] = colWidths.map((wch) => ({ wch }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, fileName);
}
