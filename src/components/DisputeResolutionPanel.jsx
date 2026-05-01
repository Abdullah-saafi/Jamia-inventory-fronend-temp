import { useState } from "react";
import useErrorHandler from "./useErrorHandler";
import StatusBadge from "./StatusBadge";
import { acceptReturn, resendItems } from "../services/api";

const DisputeResolutionPanel = ({
  request,
  onResolved,
  setToast,
  managerName,
}) => {
  const [processing, setProcessing] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  
  const handleError = useErrorHandler()

  const disputedItems = (request.items || []).filter(
    (i) =>
      (i.item_condition && i.item_condition !== "OK") ||
      (i.received_qty != null &&
        Number(i.received_qty) < Number(i.fulfilled_qty)),
  );

  const handleAcceptReturn = async () => {
    setProcessing("return");
    try {
      await acceptReturn(request.request_id, { resolved_by_name: managerName });
      setToast({message: "Return accepted — stock restored to main store", type: "success"});
      onResolved();
    } catch (e) {
      const msg = handleError(e, "Failed to accept return");
      setToast({message: msg, type:"error"});
    } finally {
      setProcessing(null);
      setConfirmed(null);
    }
  };

  const handleResend = async () => {
    setProcessing("resend");
    try {
      const res = await resendItems(request.request_id, {
        resolved_by_name: managerName,
        item_type: request.item_type
      });
      setToast({message: res.data?.message || "New request created and ready to fulfill"});
      onResolved();
    } catch (e) {
      const msg = handleError(e, "Failed to create resend request");
      setToast({message: msg, type:"error"});
    } finally {
      setProcessing(null);
      setConfirmed(null);
    }
  };

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-amber-700 text-sm font-bold">
          Dispute Resolution Required
        </span>
      </div>

      <div className="p-4 space-y-4 bg-white">
        {request.grn_note && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
              Sub Store Says
            </div>
            <div className="text-amber-800 text-sm">{request.grn_note}</div>
            {request.grn_at && (
              <div className="text-amber-400 text-xs mt-1">
                {new Date(request.grn_at).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {disputedItems.length > 0 && (
          <div>
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Affected Items
            </div>
            <div className="space-y-1.5">
              {disputedItems.map((i) => {
                const shortfall =
                  Number(i.fulfilled_qty ?? 0) -
                  Number(i.received_qty ?? i.fulfilled_qty ?? 0);
                return (
                  <div
                    key={i.request_item_id}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                  >
                    <span className="font-mono text-emerald-600 text-xs font-bold w-20 shrink-0">
                      {i.item_no}
                    </span>
                    <span className="text-gray-700 text-sm flex-1">
                      {i.item_name}
                    </span>
                    {shortfall > 0 && (
                      <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">
                        {shortfall} {i.item_uom} short
                      </span>
                    )}
                    {i.item_condition && i.item_condition !== "OK" && (
                      <StatusBadge status={i.item_condition} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
            Resolved By
          </label>
          <div className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none">
            {managerName || "—"}
          </div>
        </div>

        {confirmed === null ? (
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setConfirmed("return")}
              disabled={!!processing}
              className="flex-1 flex flex-col items-center gap-1 border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl px-4 py-3 transition-colors group disabled:opacity-40"
            >
              <span className="text-2xl">↩</span>
              <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700">
                Accept Return
              </span>
              <span className="text-xs text-gray-400 group-hover:text-emerald-500 text-center">
                Add missing qty back to main store stock & close case
              </span>
            </button>

            <button
              onClick={() => setConfirmed("resend")}
              disabled={!!processing}
              className="flex-1 flex flex-col items-center gap-1 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-4 py-3 transition-colors group disabled:opacity-40"
            >
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
                Resend Fresh Items
              </span>
              <span className="text-xs text-gray-400 group-hover:text-blue-500 text-center">
                Auto-create new request for missing quantities
              </span>
            </button>
          </div>
        ) : (
          <div
            className={`rounded-xl border-2 p-4 space-y-3 ${
              confirmed === "return"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div
              className={`text-sm font-bold ${
                confirmed === "return" ? "text-emerald-700" : "text-blue-700"
              }`}
            >
              {confirmed === "return"
                ? "Confirm: Accept return and restore stock?"
                : "Confirm: Create a new resend request?"}
            </div>
            <div
              className={`text-xs ${
                confirmed === "return" ? "text-emerald-600" : "text-blue-600"
              }`}
            >
              {confirmed === "return"
                ? "Missing quantities will be added back to main store inventory and this case will be closed."
                : `A new APPROVED request will be created for the ${disputedItems.length} affected item(s). The original dispute will be closed.`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmed(null)}
                disabled={!!processing}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={
                  confirmed === "return" ? handleAcceptReturn : handleResend
                }
                disabled={!!processing}
                className={`flex-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-40 transition-colors ${
                  confirmed === "return"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {processing
                  ? "Processing…"
                  : confirmed === "return"
                    ? "Yes, Accept Return & Close"
                    : "Yes, Create Resend Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeResolutionPanel;