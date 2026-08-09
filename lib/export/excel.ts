import * as XLSX from "xlsx";

export function exportToExcel(
  filename: string,
  rows: Record<string, any>[]
) {
  if (!rows.length) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Data"
  );

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}