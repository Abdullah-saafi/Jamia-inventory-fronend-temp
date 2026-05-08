import DisputeResolutionPanel from "./DisputeResolutionPanel"
const RenderInlineDetail = (
  d,
  isLoading,
  onFulfill,
  fulfillingId,
  onResolved,
  setToast,
  managerName,
) => {
  const isDisputed = d.status === "DISPUTED";
  const isReceived = d.status === "RECEIVED";
  const isClosed = d.status === "CLOSED";
  const isReturned = d.status === "RETURN_BACK";
  
  const hasGRN = isDisputed || isReceived || isClosed || isReturned;

  return (
    <div className="space-y-4">
      {/* Emergency banner inside detail */}
      {d.is_emergency && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-red-500 text-sm font-bold">
            ہنگامی درخواست
          </span>
          <span className="text-red-400 text-xs">
            — سب اسٹور منیجر کی منظوری کے بغیر براہ راست بھیجی گئی
          </span>
        </div>
      )}

      {isReceived && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
          <div className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
            ✓ Sub Store Confirmed Receipt
          </div>
          {d.grn_note && (
            <div className="text-teal-700 text-sm">{d.grn_note}</div>
          )}
          {d.grn_at && (
            <div className="text-teal-400 text-xs mt-1">
              {new Date(d.grn_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {isClosed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
            Case Closed
          </div>
          <div className="text-gray-600 text-sm">
            Resolution:{" "}
            <span className="font-semibold">
              {d.resolution === "RETURN_ACCEPTED"
                ? "Return accepted — stock restored"
                : d.resolution === "RESENT"
                  ? "Fresh items resent via new request"
                  : d.resolution}
            </span>
          </div>
          {d.resolved_by_name && (
            <div className="text-gray-400 text-xs mt-1">
              By {d.resolved_by_name}
            </div>
          )}
          {d.resolved_at && (
            <div className="text-gray-400 text-xs">
              {new Date(d.resolved_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {d.notes && (
        <div className="bg-white rounded p-3 border border-gray-200">
          <div className="text-gray-400 text-xs mb-1">NOTES</div>
          <div className="text-gray-700 text-sm">{d.notes}</div>
        </div>
      )}

      {d.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="text-red-500 text-xs font-semibold mb-1">
            REJECTION REASON
          </div>
          <div className="text-red-600 text-sm">{d.rejection_reason}</div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-400 text-xs">
            <th className="text-left pb-2 pr-4">آئٹم نمبر</th>
            <th className="text-left pb-2 pr-4">آئٹم کا نام</th>
            <th className="text-left pb-2 pr-4">UOM</th>
            <th className="text-center pb-2 pr-4">درخواست کردہ</th>
            <th className="text-center pb-2 pr-4">منظور شدہ</th>
            <th className="text-center pb-2 pr-4">مکمل شدہ</th>
            {hasGRN && (
              <>
                <th className="text-center pb-2 pr-4">موصول شدہ</th>
                <th className="text-center pb-2">حالت</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {(d.items || []).map((i) => {
            const hasItemIssue =
              (i.item_condition && i.item_condition !== "OK") ||
              (i.received_qty != null &&
                Number(i.received_qty) < Number(i.fulfilled_qty));
            return (
              <tr
                key={i.request_item_id}
                className={`border-b border-gray-100 ${hasItemIssue ? "bg-amber-50/50" : ""}`}
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
                {hasGRN && (
                  <>
                    <td className="py-2 pr-4 font-mono text-center">
                      <span
                        className={
                          i.received_qty != null
                            ? Number(i.received_qty) < Number(i.fulfilled_qty)
                              ? "text-amber-600 font-bold"
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
                          className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${i.item_condition === "OK"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : i.item_condition === "DAMAGED"
                              ? "bg-amber-50 border-amber-300 text-amber-700"
                              : i.item_condition === "RETURN" 
                              ? "bg-blue-50 border-blue-300 text-blue-700" 
                              :"bg-red-50 border-red-300 text-red-700"
                            }`}
                        >
                          {i.item_condition}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
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
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {isDisputed && (
        <DisputeResolutionPanel
          request={d}
          onResolved={onResolved}
          setToast={setToast}
          managerName={managerName}
        />
      )}
    </div>
  );
};

export default RenderInlineDetail;