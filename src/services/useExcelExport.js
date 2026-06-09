import { useState } from "react";
import * as XLSX from "xlsx";

/**
 * useExcelExport — imperative hook when you need to trigger export from
 * your own button, table action, or context menu.
 *
 * Usage:
 *   const { exportToExcel, exporting } = useExcelExport();
 *   exportToExcel({ data, fileName, sheetName, columns });
 */
export function useExcelExport() {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async ({
    data = [],
    fileName = "export",
    sheetName = "Sheet1",
    columns,
    onBeforeExport,
  }) => {
    setExporting(true);
    try {
      let rows = data;
      if (typeof onBeforeExport === "function") {
        rows = await onBeforeExport();
      }
      if (!rows || rows.length === 0) {
        alert("No data to export.");
        return;
      }

      let sheetData;
      if (columns && columns.length > 0) {
        const headers = columns.map((c) => c.label);
        const body = rows.map((row) =>
          columns.map((c) => {
            const val = row[c.key];
            return typeof c.format === "function"
              ? c.format(val, row)
              : (val ?? "");
          }),
        );
        sheetData = [headers, ...body];
      } else {
        const keys = Object.keys(rows[0]);
        const headers = keys.map((k) =>
          k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        );
        const body = rows.map((row) => keys.map((k) => row[k] ?? ""));
        sheetData = [headers, ...body];
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const colWidths = sheetData[0].map((_, ci) => ({
        wch: Math.min(
          40,
          Math.max(10, ...sheetData.map((r) => String(r[ci] ?? "").length)),
        ),
      }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const ts = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${fileName}_${ts}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return { exportToExcel, exporting };
}
