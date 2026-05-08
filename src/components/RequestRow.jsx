import StatusBadge from "../components/StatusBadge";
import DateTimeCell from "../components/DateTimeCell";
import ItemsTable from "../components/ItemsTable";
import TypeBadge from "./TypeBadge";

export default function RequestRow({
  r,
  detail,
  detailLoad,
  openDetail,
  openGRN,
  grnLoading,
  pageType,
  actioning,
  openApprove,
  openReject,
  returnItem,
  returnModalLoading,
  // scrapItem,
  // scrapModalLoading
}) {
  const isExpanded = detail && detail.request_id === r.request_id;
  const needsGRN = r.status === "FULFILLED" && !r.grn_at;
  const isDisputed = r.status === "DISPUTED";
  const isReturned = r.status === "RETURN_BACK"
  const isReceived = r.status === "RECEIVED" || r.status === "PARTIALLY_RECEIVED";
  const isREUSABLE = r.item
  const hasItems = (r.item_count ?? 0) > 0;
  const hasAssets = (r.asset_count ?? 0) > 0;
  const isReturnable = r.item_type === "REUSABLE" && r.has_returnable_items && (r.status === "RECEIVED" || r.status === "DISPUTED");

  return (
    <>
      <tr
        className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-100 ${needsGRN
          ? "bg-blue-50/40 hover:bg-blue-50"
          : isDisputed
            ? "bg-amber-50/40 hover:bg-amber-50"
            : "hover:bg-gray-50"
          } ${isExpanded ? "bg-gray-50" : ""}`}
        onClick={() => openDetail(r)}
      >
        {/* Request No */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-600 text-xs font-bold">
              {r.request_no}
            </span>
            {r.is_emergency && (
              <span className="bg-red-100 text-red-600 text-xs font-bold rounded px-1.5 py-0.5 border border-red-200">
                URGENT
              </span>
            )}
            {r.item_count > 0 && (
              <span className="bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                {r.item_count} item{r.item_count > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </td>

        <td className="px-4 py-3">
          <TypeBadge hasItems={hasItems} hasAssets={hasAssets} />
        </td>
        <td className="px-4 py-3 text-gray-600">
          {r.requested_by_name || "—"}
        </td>
        <td className="px-4 py-3">
          <DateTimeCell ts={r.requested_at || r.created_at} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={r.status} />
        </td>
        <td className="px-4 py-3">
          <DateTimeCell ts={r.approved_at} />
        </td>
        <td className="px-4 py-3">
          <DateTimeCell ts={r.fulfilled_at} />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {(needsGRN && pageType === "subStore") && (
              <button
                onClick={(e) => openGRN(e, r)}
                disabled={grnLoading}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {grnLoading ? "…" : "Verify Delivery"}
              </button>
            )}
            {isReturnable && pageType === "subStore" && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  returnItem(r.request_id,)
                }}
                disabled={returnModalLoading}
                className="text-xs bg-orange-400 hover:bg-orange-300 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {returnModalLoading ? "…" : "Return Items"}
              </button>
            )}
            {(r.status === "PENDING" && pageType === "subStoreManager") && (
              <>
                <button
                  disabled={actioning}
                  onClick={(e) => {
                    e.stopPropagation();
                    openApprove(r);
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 ml-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {actioning ? "..." : "Approve"}
                </button>
                <button
                  disabled={actioning}
                  onClick={(e) => {
                    e.stopPropagation();
                    openReject(r)
                  }}
                  className="text-xs bg-red-500 hover:bg-red-400 text-white rounded px-2 py-1 disabled:opacity-40"
                >
                  {actioning ? "..." : "Reject"}
                </button>
              </>
            )}
            <span
              className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
            >
              {isExpanded ? "▲ Hide" : "▼ View"}
            </span>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-gray-50 border-b-2 border-emerald-200">
          <td colSpan={10} className="px-6 py-4">
            {detailLoad ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {detail?.notes && (
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <div className="text-gray-400 text-xs mb-1 uppercase font-bold">Notes</div>
                    <div className="text-gray-700 text-sm">{detail.notes}</div>
                  </div>
                )}

                {detail?.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-red-500 text-xs font-bold mb-1 uppercase">Rejection Reason</div>
                    <div className="text-red-600 text-sm">{detail.rejection_reason}</div>
                  </div>
                )}

                {(isDisputed || isReceived) && detail?.grn_note && (
                  <div className={`rounded-xl p-3 border text-sm ${isDisputed ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-teal-50 border-teal-200 text-teal-700"}`}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1">
                      {isDisputed ? "⚠ Sub Store Reported Issues" : "✓ Sub Store Confirmed Receipt"}
                    </div>
                    <div>{detail.grn_note}</div>
                    {detail.grn_at && <div className="text-xs opacity-60 mt-1">{new Date(detail.grn_at).toLocaleString()}</div>}
                  </div>
                )}

                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
                    Items
                  </div>
                  <ItemsTable
                    items={detail?.items || []}
                    isDisputed={isDisputed}
                    isReceived={isReceived}
                    isReturned={isReturned}
                  />
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
