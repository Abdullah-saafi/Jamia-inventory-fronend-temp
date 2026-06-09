import { useState } from "react";
import * as XLSX from "xlsx";

/**
 * ExcelDownloaderWithDates
 *
 * Props:
 *  - data             {Array}     local data to filter (if no onFetch)
 *  - dateKey          {string}    which field to filter by, e.g. "created_at"
 *  - fileName         {string}    base filename
 *  - sheetName        {string}
 *  - columns          {Array}     [{ key, label, format }]
 *  - buttonLabel      {string}
 *  - onFetch          {async fn}  (fromDate, toDate) => Array
 *                                 use this when you want to hit your API
 *                                 with date params instead of filtering locally
 */
export default function c({
  data = [],
  dateKey = "created_at",
  fileName = "export",
  sheetName = "Sheet1",
  columns,
  buttonLabel = "Export Excel",
  onFetch,
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setError("");

    if (!fromDate || !toDate) {
      setError("Please select both From and To dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From date cannot be after To date.");
      return;
    }

    setLoading(true);
    try {
      let rows;

      if (typeof onFetch === "function") {
        // Let the parent fetch from API with date params
        rows = await onFetch(fromDate, toDate);
      } else {
        // Filter local data by date range
        const [fy, fm, fd] = fromDate.split("-").map(Number);
        const [ty, tm, td] = toDate.split("-").map(Number);
        const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
        const to = new Date(ty, tm - 1, td, 23, 59, 59, 999);
        to.setHours(23, 59, 59, 999);

        rows = data.filter((row) => {
          const d = new Date(row[dateKey]);
          return d >= from && d <= to;
        });
      }

      if (!rows || rows.length < 0) {
        setError(`No data found between ${fromDate} and ${toDate}.`);
        setLoading(false);
        return;
      }

      let sheetData;
      const cols = columns && columns.length > 0 ? columns : null;

      if (cols) {
        const headers = cols.map((c) => c.label ?? c.key);
        const body = rows.map((row) =>
          cols.map((c) => {
            const val = c.key in row ? row[c.key] : "";
            return typeof c.format === "function"
              ? c.format(val, row)
              : (val ?? "");
          }),
        );
        sheetData = [headers, ...body];
      } else {
        // No columns defined — export every key from the data
        const keys = Object.keys(rows[0]);
        const headers = keys.map((k) =>
          k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        );
        const body = rows.map((row) => keys.map((k) => row[k] ?? ""));
        sheetData = [headers, ...body];
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Safe column width calculation
      ws["!cols"] = sheetData[0].map((_, ci) => ({
        wch: Math.min(
          40,
          Math.max(12, ...sheetData.map((r) => String(r[ci] ?? "").length)),
        ),
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}_${fromDate}_to_${toDate}.xlsx`);
    } catch (err) {
      console.error(err);
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
      {/* From Date */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          From
        </label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setError("");
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white
                     focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                     cursor-pointer"
        />
      </div>

      {/* To Date */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          To
        </label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setError("");
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white
                     focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                     cursor-pointer"
        />
      </div>

      {/* Quick range shortcuts */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {[{ label: "30 days", days: 30 }].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - days);
                setFromDate(from.toISOString().slice(0, 10));
                setToDate(to.toISOString().slice(0, 10));
                setError("");
              }}
              className="px-2 py-2 text-xs bg-white border border-gray-300 rounded-lg
                         hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700
                         transition-colors font-medium"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
                   rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white
                   transition-colors disabled:opacity-60 disabled:cursor-not-allowed self-end"
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

      {/* Error message */}
      {error && (
        <p className="w-full text-xs text-red-500 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
