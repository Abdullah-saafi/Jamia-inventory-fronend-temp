import DisputeResolutionPanel from "./DisputeResolutionPanel";
import StatusBadge from "./StatusBadge";

export default function ItemsTable({
  items = [],
  isDisputed,
  isReceived,
  isReturned,
  pageType,
  d,
  handleResolved,
  showToast,
  username
}) {
  const isClosed = d.status === "CLOSED";
  return (
    <>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-400 text-xs">
            <th className="text-left pb-2 pr-4">اشیاء نمبر</th>
            <th className="text-left pb-2 pr-4">اشیاء کا نام</th>
            <th className="text-left pb-2 pr-4">UOM</th>
            {(pageType === "subStore" || pageType === "subStoreManager") && (
              <th className="text-center pb-2 pr-4">درخواست شدہ</th>
            )}
            {pageType === "mainSubStoreReqs" && (
              <th className="text-center pb-2 pr-4">درخواست کردہ</th>
            )}
            <th className="text-center pb-2 pr-4">منظور شدہ</th>
            <th className="text-center pb-2 pr-4">مکمل شدہ</th>
            {(pageType === "subStore" || pageType === "subStoreManager") && (
              <th className="text-center pb-2 pr-4">واپس کیا گیا</th>
            )}
            {(isDisputed || isReceived || isReturned || isClosed) && (
              <>
                <th className="text-center pb-2 pr-4">وصول شدہ</th>

                <th className="text-center pb-2">حالت</th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
          {items.map((i) => {
            const hasItemIssue =
              (i.item_condition && i.item_condition !== "OK") ||
              (i.received_qty != null &&
                Number(i.received_qty) < Number(i.fulfilled_qty));
            return (
              <tr key={i.request_item_id} className={`border-b border-gray-100 ${hasItemIssue ? "bg-amber-50/50" : ""}`}>
                <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                  {i.item_no}
                </td>

                <td className="py-2 pr-4 text-gray-800">{i.item_name}</td>

                <td className="py-2 pr-4 text-gray-500 text-sm">
                  {i.item_uom || "―"}
                </td>

                <td className="py-2 pr-4 font-mono text-gray-800 text-center">
                  {i.requested_qty}
                </td>

                <td className="py-2 pr-4 font-mono text-center">
                  <span
                    className={
                      i.approved_qty != null ? "text-emerald-600" : "text-gray-300"
                    }
                  >
                    {i.approved_qty ?? "—"}
                  </span>
                </td>

                <td className="py-2 pr-4 font-mono text-center">
                  <span
                    className={
                      i.fulfilled_qty != null ? "text-blue-600" : "text-gray-300"
                    }
                  >
                    {i.fulfilled_qty ?? "—"}
                  </span>
                </td>
                {(pageType === "subStore" || pageType === "subStoreManager") && (
                  <>
                    <td className="py-2 pr-4 font-mono text-center">
                      <span
                        className={
                          Number(i.returned_qty) > 0
                            ? "text-orange-500 font-bold"
                            : "text-gray-300"
                        }
                      >
                        {Number(i.returned_qty) > 0 ? i.returned_qty : "—"}
                      </span>
                    </td>
                  </>
                )}
                {(isDisputed || isReceived || isReturned || isClosed) && (
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
                        <StatusBadge status={i.item_condition} />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {pageType === "mainSubStoreReqs" && (
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
                      </>
                    )}
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {isDisputed && (
        <DisputeResolutionPanel
          request={d}
          onResolved={handleResolved}
          showToast={showToast}
          managerName={username}
        />
      )
      }
    </>
  );
}
