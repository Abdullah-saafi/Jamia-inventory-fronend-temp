function DetailPanel({
  detail,
  isDisputed,
  isReceived,
  needsGRN,
  grnLoading,
  onOpenGRN,
}) {
  if (!detail) return null;
  const showGRNColumns = isDisputed || isReceived;
  const hasItems = detail.items?.length > 0;
  const hasAssets = detail.assets?.length > 0;

  return (
    <div className="space-y-4">
      {/* GRN note */}
      {showGRNColumns && detail.grn_note && (
        <div
          className={`rounded-xl p-3 border text-sm ${isDisputed ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-teal-50 border-teal-200 text-teal-700"}`}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-1">
            {isDisputed
              ? "⚠ Sub Store Reported Issues"
              : "✓ Sub Store Confirmed Receipt"}
          </div>
          <div>{detail.grn_note}</div>
          {detail.grn_at && (
            <div className="text-xs opacity-60 mt-1">
              {new Date(detail.grn_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {detail.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="text-red-500 text-xs font-semibold mb-1">
            REJECTION REASON
          </div>
          <div className="text-red-600 text-sm">{detail.rejection_reason}</div>
        </div>
      )}

      {/* Consumable Items */}
      {hasItems && (
        <div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>📦 Consumable Items</span>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded">
              {detail.items.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-xs">
                <th className="text-left pb-2 pr-4">چیز نمبر</th>
                <th className="text-left pb-2 pr-4">چیز کا نام</th>
                <th className="text-left pb-2 pr-4">UOM</th>
                <th className="text-center pb-2 pr-4">درخواست کردہ</th>
                <th className="text-center pb-2 pr-4">منظور شدہ</th>
                <th className="text-center pb-2 pr-4">مکمل شدہ</th>
                {showGRNColumns && (
                  <>
                    <th className="text-center pb-2 pr-4">موصول شدہ</th>
                    <th className="text-center pb-2">حالت</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {detail.items.map((i) => (
                <tr
                  key={i.request_item_id}
                  className="border-b border-gray-100"
                >
                  <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                    {i.item_no}
                  </td>
                  <td className="py-2 pr-4 text-gray-800">{i.item_name}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">
                    {i.item_uom}
                  </td>
                  <td className="py-2 pr-4 font-mono text-gray-800 text-center">
                    {i.requested_qty}
                  </td>
                  <td className="py-2 pr-4 font-mono text-center">
                    <span
                      className={
                        i.approved_qty != null
                          ? "text-emerald-600"
                          : "text-gray-300"
                      }
                    >
                      {i.approved_qty ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-center">
                    <span
                      className={
                        i.fulfilled_qty != null
                          ? "text-blue-600"
                          : "text-gray-300"
                      }
                    >
                      {i.fulfilled_qty ?? "—"}
                    </span>
                  </td>
                  {showGRNColumns && (
                    <>
                      <td className="py-2 pr-4 font-mono text-center">
                        <span
                          className={
                            i.received_qty != null
                              ? Number(i.received_qty) < Number(i.fulfilled_qty)
                                ? "text-amber-600"
                                : "text-teal-600"
                              : "text-gray-300"
                          }
                        >
                          {i.received_qty ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        {i.item_condition ? (
                          <span
                            className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${
                              i.item_condition === "OK"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : i.item_condition === "DAMAGED"
                                  ? "bg-amber-50 border-amber-300 text-amber-700"
                                  : "bg-red-50 border-red-300 text-red-700"
                            }`}
                          >
                            {i.item_condition}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assets */}
      {hasAssets && (
        <div>
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <span>🖥️ Assets</span>
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
              {detail.assets.length}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 text-xs">
                <th className="text-left pb-2 pr-4">Asset Name</th>
                <th className="text-left pb-2 pr-4">Serial No.</th>
                <th className="text-center pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.assets.map((a) => (
                <tr key={a.asset_id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-800 font-medium">
                    {a.asset_name}
                  </td>
                  <td className="py-2 pr-4 font-mono text-blue-600 text-xs">
                    {a.serial_number}
                  </td>
                  <td className="py-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded border text-xs font-bold ${
                        a.status === "AVAILABLE"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : a.status === "ASSIGNED"
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-red-50 border-red-300 text-red-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
