import StatusBadge from "../components/StatusBadge";
import DateTimeCell from "../components/DateTimeCell";
import ItemsTable from "../components/ItemsTable";
import TypeBadge from "./TypeBadge";
import { useAuth } from "../context/authContext";

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
  handleFulfill,
  fulfilling,
  handleAcceptReturn,
  returnLoading,
  handleResolved,
  showToast,
  username,
  setFulfillModal,
  setRequestNo,
}) {
  const isExpanded = detail && detail.request_id === r.request_id;
  const needsGRN = r.status === "FULFILLED" && !r.grn_at;
  const isDisputed = r.status === "DISPUTED";
  const isReturned = r.status === "RETURN_BACK" || r.status === "RETURN_ACCEPTED"
  const isReceived = r.status === "RECEIVED" || r.status === "PARTIALLY_RECEIVED";
  const hasItems = (r.item_count ?? 0) > 0;
  const isEmergency = r.is_emergency;
  const isClosed = r.status === "CLOSED";
  const canFulfill = r.status === "APPROVED";

  const { auth } = useAuth()

  return (
    <>
      <tr
        className={`border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-100 ${needsGRN
          ? "bg-blue-50/40 hover:bg-blue-50"
          : isDisputed
            ? "bg-amber-50/40 hover:bg-amber-50"
            : isEmergency && r.status === "APPROVED"
              ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-gray-50"
          } ${isExpanded ? "bg-gray-50" : ""}`}
        onClick={() => openDetail(r)}
      >
        {/* Request No */}
        <td className="px-4 py-3">
          <div className="flex  items-center gap-2">
            <span className="font-mono text-emerald-600 text-xs font-bold">
              {r.request_no}
            </span>
            {isEmergency && (
              <span className="bg-red-100 text-red-600 text-xs font-bold rounded px-1.5 py-0.5 border border-red-200">
                URGENT
              </span>
            )}
            {r.item_count > 0 && (
              <span className="bg-gray-100 flex gap-2 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                <div>
                  {r.item_count}
                </div>
                <div>
                  item{r.item_count > 1 ? "s" : ""}
                </div>
              </span>
            )}
          </div>
        </td>

        {(pageType === "subStore" || pageType === "subStoreManager") && (
          <>
            <td className="px-2 py-3">
              <TypeBadge hasItems={hasItems} itemType={r.item_type} />
            </td>
          </>
        )}
        {pageType === "mainSubStoreReqs" && (
          <>
            <td className="px-4 py-3 text-gray-700">
              {r.from_store_name}
            </td>
            <td className="px-4 py-3 text-gray-700">
              {r.to_store_name}
            </td>
          </>
        )}
        <td className="px-4 py-3 text-gray-600">
          {r.requested_by_name || "—"}
        </td>
        {pageType === "mainSubStoreReqs" && (
          <>
            <td className="px-4 py-3 text-gray-700">
              {r.approved_by_name || "—"}
            </td>
          </>
        )}
        {(pageType === "headOffice" || pageType === "mainSubStoreReqs" || pageType === "pettyCash") && (
          <td className="px-4 py-3 text-gray-700">
            {r.fulfilled_by_name || "—"}
          </td>
        )}
        <td className="px-4 py-3">
          <DateTimeCell ts={r.requested_at || r.created_at} />
        </td>
        {pageType === "mainSubStoreReqs" && (
          <>
            <td className="px-4 py-3">
              <DateTimeCell ts={r.fulfilled_at} />
            </td>
          </>
        )}
        {(pageType === "subStore" || pageType === "subStoreManager" || pageType === "headOffice" || pageType === "mainStoreApprover" || pageType === "mainReqToHO" || pageType === "pettyCash") && (
          <>
            <td className="px-4 py-3 ">
              <DateTimeCell ts={r.approved_at} />
            </td>
            <td className="px-4 py-3">
              <DateTimeCell ts={r.fulfilled_at} />
            </td>
          </>
        )}
        <td className="px-4 py-3">
          <StatusBadge status={r.status} />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {(needsGRN && (pageType === "subStore" || pageType === "mainReqToHO")) && (
              <button
                onClick={(e) => openGRN(e, r)}
                disabled={grnLoading}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {grnLoading ? "…" : "ڈلیوری کی تصدیق"}
              </button>
            )}
            {((pageType === "subStoreManager" || pageType === "mainStoreApprover") && r.status === "PENDING") && (
              <>
                <button
                  disabled={actioning === r.request_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openApprove(r.request_id, r.request_no);
                  }}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 ml-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {actioning === r.request_id ? "..." : "منظور کریں"}
                </button>
                <button
                  disabled={actioning === r.request_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openReject(r)
                  }}
                  className="text-xs bg-red-500 hover:bg-red-400 text-white rounded px-2 py-1 disabled:opacity-40"
                >
                  {actioning === r.request_id ? "..." : "مسترد کریں"}
                </button>
              </>
            )}
            {((pageType === "mainSubStoreReqs" || pageType === "headOffice" || pageType === "pettyCash") && canFulfill) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  if (pageType === "mainSubStoreReqs") {
                    handleFulfill(r.request_id);
                  } else {
                    setFulfillModal(true);
                    setRequestNo({
                      id: r.request_id,
                      no: r.request_no
                    });
                  }
                }}
                className={`text-white text-sm font-bold px-2.5 ml-2 py-1.5 cursor-pointer rounded disabled:opacity-40 ${isEmergency
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-500"
                  }`}
                disabled={fulfilling === r.request_id}
              >
                {fulfilling === r.request_id ? "..." : "تکمیل"}
              </button>
            )}
            {(pageType === "mainSubStoreReqs" && r.item_type === "REUSABLE" && r.status === "RETURN_BACK") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptReturn(r.request_id);
                }}
                className="text-xs bg-orange-400 hover:bg-orange-300 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                disabled={returnLoading}
              >
                {fulfilling === r.request_id
                  ? "..."
                  : "Accept Return"}
              </button>
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
        <tr
          className={`border-b-2 ${isEmergency && r.status === "APPROVED"
            ? "bg-red-50/20 border-red-300"
            : isDisputed
              ? "bg-amber-50/20 border-amber-300"
              : isReceived
                ? "bg-teal-50/20 border-teal-300"
                : isClosed
                  ? "bg-gray-50 border-gray-300"
                  : "bg-gray-50 border-emerald-200"
            }`}
        >
          <td colSpan={10} className="px-6 py-4 text-left leading-relaxed">
            {detailLoad ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {detail.is_emergency && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="text-red-500 text-sm font-bold">
                      ہنگامی درخواست
                    </span>
                    <span className="text-red-400 text-xs">
                      — سب اسٹور منیجر کی منظوری کے بغیر براہ راست بھیجی گئی
                    </span>
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
                        {detail.resolution === "RETURN_ACCEPTED"
                          ? "Return accepted — stock restored"
                          : detail.resolution === "RESENT"
                            ? "Fresh items resent via new request"
                            : detail.resolution}
                      </span>
                    </div>
                    {detail.resolved_by_name && (
                      <div className="text-gray-400 text-xs mt-1">
                        By {detail.resolved_by_name}
                      </div>
                    )}
                    {detail.resolved_at && (
                      <div className="text-gray-400 text-xs">
                        {new Date(detail.resolved_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
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
                      {isDisputed ? "⚠ Sub Store Reported Issues" : (pageType === "headOffice" && isDisputed) ? "✓ Main Store Confirmed Receipt" : "✓ Sub Store Confirmed Receipt"}
                    </div>
                    <div>{detail.grn_note}</div>
                    {detail.grn_at && <div className="text-xs opacity-60 mt-1">{new Date(detail.grn_at).toLocaleString()}</div>}
                  </div>
                )}

                <div>
                  {/* Title */}
                  <div className="text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-3">
                    آئٹم کی تفصیلات
                  </div>

                  {/* Driver Info */}
                  {(r.driver_name || r.driver_no || r.vehicle_no || r.ref_no || r.partial_request_no) && (
                    <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-3 ">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">

                        {r.driver_name && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <div className="text-gray-400 text-xs uppercase font-semibold mb-1">
                              ڈرائیور کا نام
                            </div>
                            <div className="text-gray-800 font-medium">
                              {r.driver_name || "-"}
                            </div>
                          </div>
                        )}

                        {r.driver_no && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <div className="text-gray-400 text-xs uppercase font-semibold mb-1">
                              ڈرائیور کا نمبر
                            </div>
                            <div className="text-gray-800 font-medium">
                              {r.driver_no || "-"}
                            </div>
                          </div>
                        )}

                        {r.vehicle_no && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <div className="text-gray-400 text-xs uppercase font-semibold mb-1">
                              گاڑی کا نمبر
                            </div>
                            <div className="text-gray-800 font-medium">
                              {r.vehicle_no || "-"}
                            </div>
                          </div>
                        )}

                        {r.ref_no && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <div className="text-gray-400 text-xs uppercase font-semibold mb-1">
                              پیٹی کیش ریفرنس نمبر
                            </div>
                            <div className="text-gray-800 font-medium">
                              {r.ref_no || "-"}
                            </div>
                          </div>
                        )}

                        {r.partial_request_no && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <div className="text-gray-400 text-xs uppercase font-semibold mb-1">
                              جزوی ریکویسٹ نمبر
                            </div>
                            <div className="text-gray-800 font-medium">
                              {r.partial_request_no || "-"}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                  <ItemsTable
                    items={detail?.items || []}
                    isDisputed={isDisputed}
                    isReceived={isReceived}
                    isReturned={isReturned}
                    d={detail}
                    detailLoad={detailLoad}
                    handleFulfill={handleFulfill}
                    fulfilling={fulfilling}
                    handleResolved={handleResolved}
                    showToast={showToast}
                    username={username}
                    pageType={pageType}
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
