import { useState } from "react";
import useErrorHandler from "./useErrorHandler";
import StatusBadge from "./StatusBadge";
import { acceptReturn, resendItems, resolveDispute } from "../services/api";
import { useAuth } from "../context/authContext";

const DisputeResolutionPanel = ({
  request,
  onResolved,
  setToast,
  managerName,
}) => {
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [itemActions, setItemActions] = useState({});

  const { auth } = useAuth()
  const handleError = useErrorHandler()

  const disputedItems = (request.items || []).filter(
    (i) =>
      (i.item_condition && i.item_condition !== "OK") ||
      (i.received_qty != null &&
        Number(i.received_qty) < Number(i.fulfilled_qty)),
  );

  const handleResolve = async () => {
    if (Object.keys(itemActions).length === 0) {
      setToast({ message: "Please select at least one action", type: "error" });
      return;
    }

    try {
      setProcessing(true);

      const payload = {
        resolved_by_name: auth.username,
        items: Object.entries(itemActions).map(([id, action]) => ({
          request_item_id: Number(id),
          action,
        })),
      };

      console.log("payload",payload);
      await resolveDispute(request.request_id, payload);
      

      onResolved();

    } catch (error) {
      const msg = handleError(error, "Failed to perform action");
      setToast({ message: msg, type: "error" });
    } finally {
      setProcessing(false);
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
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex">
              <p>
                Affected Items
              </p>
              <p className="ml-auto mr-6">
                Action
              </p>
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
                    <span className="font-mono text-emerald-600 text-xs font-bold  shrink-0">
                      {i.item_no}
                    </span>
                    <span className="text-gray-700 font-mono text-xs flex-1">
                      {i.item_name}
                    </span>
                    {shortfall > 0 && (
                      <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">
                        {shortfall} — {i.item_uom} short
                      </span>
                    )}
                    {i.item_condition && i.item_condition !== "OK" && (
                      <StatusBadge status={i.item_condition} />
                    )}
                    <div className="flex gap-2">
                      {/* Accept Return */}
                      <label
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all
                            ${itemActions[i.request_item_id] === "RETURN_ACCEPT"
                            ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                            : "bg-white border-gray-300 text-gray-600 hover:border-emerald-400"
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={itemActions[i.request_item_id] === "RETURN_ACCEPT"}
                          onChange={(e) => {
                            setItemActions((prev) => {
                              const updated = { ...prev };

                              if (e.target.checked) {
                                updated[i.request_item_id] = "RETURN_ACCEPT";
                              } else {
                                delete updated[i.request_item_id];
                              }

                              return updated;
                            });
                          }}
                        />
                        Accept Return
                      </label>

                      {/* Resend */}
                      {i.item_condition !== "RETURN" && (
                        <label
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all
                            ${itemActions[i.request_item_id] === "RESEND"
                              ? "bg-blue-100 border-blue-500 text-blue-700"
                              : "bg-white border-gray-300 text-gray-600 hover:border-blue-400"
                            }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={itemActions[i.request_item_id] === "RESEND"}
                            onChange={(e) => {
                              setItemActions((prev) => {
                                const updated = { ...prev };

                                if (e.target.checked) {
                                  updated[i.request_item_id] = "RESEND";
                                } else {
                                  delete updated[i.request_item_id];
                                }

                                return updated;
                              });
                            }}
                          />
                          Resend
                        </label>
                      )}
                    </div>

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

        <div className="pt-4 border-t border-zinc-300">
          <button
            onClick={handleResolve}
            disabled={processing || Object.keys(itemActions).length !== disputedItems.length}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : "Confirm & Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisputeResolutionPanel;