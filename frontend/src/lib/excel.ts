import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Datos') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Professional formatting (headers in bold)
  // Note: basic xlsx doesn't support complex styling easily without xlsx-js-style,
  // but we can at least ensure the data is well-structured.
  
  XLSX.writeFile(wb, fileName);
}
