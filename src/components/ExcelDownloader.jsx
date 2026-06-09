import { useState } from "react";
import * as XLSX from "xlsx";

/**
 * ExcelDownloader — drop-in button that exports any data to .xlsx
 *
 * Props:
 *  - data         {Array<Object>}   required  rows to export
 *  - fileName     {string}          optional  default "export"
 *  - sheetName    {string}          optional  default "Sheet1"
 *  - columns      {Array<{key, label, format}>}  optional column config
 *                   key    — key in each data object
 *                   label  — column header shown in Excel
 *                   format — optional fn(value, row) => formattedValue
 *  - buttonLabel  {string}          optional  default "Export Excel"
 *  - buttonClass  {string}          optional  extra Tailwind classes
 *  - onBeforeExport {() => Promise<Array> | Array}  optional async fn that
 *                   returns fresh data right before export (for server fetch)
 */
export default function ExcelDownloader({
  data = [],
  fileName = "export",
  sheetName = "Sheet1",
  columns,
  buttonLabel = "Export Excel",
  buttonClass = "",
  onBeforeExport,
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
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

      const colWidths = sheetData[0].map((_, colIdx) => ({
        wch: Math.min(
          40,
          Math.max(
            10,
            ...sheetData.map((row) => String(row[colIdx] ?? "").length),
          ),
        ),
      }));
      ws["!cols"] = colWidths;

      try {
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
          if (cell) {
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "10B981" } }, // emerald-500
              alignment: { horizontal: "center" },
            };
          }
        }
      } catch (_) {
        // xlsx-style not available — skip styling
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      XLSX.writeFile(wb, `${fileName}_${ts}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
        bg-emerald-600 hover:bg-emerald-700 text-white transition-colors
        disabled:opacity-60 disabled:cursor-not-allowed ${buttonClass}`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Exporting…
        </>
      ) : (
        <>{buttonLabel}</>
      )}
    </button>
  );
}
