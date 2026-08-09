import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToPDF(
  title: string,
  rows: Record<string, any>[]
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("ALESSANDRO ENTERPRISES", 14, 20);

  doc.setFontSize(12);
  doc.text("Enterprise Management Platform", 14, 28);

  doc.setFontSize(16);
  doc.text(title, 14, 42);

  doc.setFontSize(10);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    14,
    50
  );

  if (rows.length > 0) {
    autoTable(doc, {
      startY: 58,
      head: [Object.keys(rows[0])],
      body: rows.map((row) => Object.values(row)),
      theme: "grid",
      headStyles: {
        fillColor: [3, 22, 47], // Alessandro navy
      },
    });
  }

  doc.save(`${title}.pdf`);
}