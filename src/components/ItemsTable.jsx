import { useState } from "react";
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
  const [previewImg, setPreviewImg] = useState(null);
  const isClosed = d.status === "CLOSED";
  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-400 text-xs">
            <th className="text-left pb-2 pr-4">اشیاء نمبر</th>
            <th className="text-left pb-2 pr-4">اشیاء کا نام</th>
            <th className="text-left pb-2 pr-4">اکائی</th>
            {(pageType === "subStore" || pageType === "subStoreManager") && (
              <th className="text-center pb-2 pr-4">درخواست شدہ</th>
            )}
            {(pageType === "mainSubStoreReqs" || pageType === "headOffice") && (
              <th className="text-center pb-2 pr-4">درخواست کردہ</th>
            )}
            <th className="text-center pb-2 pr-4">منظور شدہ</th>
            <th className="text-center pb-2 pr-4">مکمل شدہ</th>
            {(isDisputed || isReceived || isReturned || isClosed) && (
              <>
                <th className="text-center pb-2 pr-4">وصول شدہ</th>

                <th className="text-center pb-2">حالت</th>
              </>
            )}
            <th className="text-center pb-2 pr-4">تصویر</th>
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

                <td className="py-2 pr-4 text-gray-700 text-sm">
                  {i.item_uom || "―"}
                </td>

                <td className="py-2 pr-4 font-mono text-gray-700 text-center">
                  {i.requested_qty}
                </td>

                <td className="py-2 pr-4 font-mono text-center">
                  <span
                    className={
                      i.approved_qty != null ? "text-emerald-600" : "text-gray-700"
                    }
                  >
                    {i.approved_qty ?? "—"}
                  </span>
                </td>

                <td className="py-2 pr-4 font-mono text-center">
                  <span
                    className="text-gray-700"
                  >
                    {Number(i.fulfilled_qty)}
                  </span>
                </td>

                {(isDisputed || isReceived || isReturned || isClosed) && (
                  <>
                    <td className="py-2 pr-4 font-mono text-center">
                      <span
                        className={
                          i.received_qty != null
                            ? Number(i.received_qty) < Number(i.fulfilled_qty)
                              ? "text-amber-600"
                              : "text-teal-600"
                            : "text-gray-700"
                        }
                      >
                        {i.received_qty ?? "—"}
                      </span>
                    </td>
                    <td className="py-2 text-center">
                      {i.item_condition ? (
                        <StatusBadge status={i.item_condition} />
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                  </>
                )}
                <td className="px-4 py-3 text-center">
                  {i.image_url ? (
                    <button
                      onClick={() => setPreviewImg(i.image_url)}
                      title="تصویر دیکھیں"
                      className="text-xl hover:scale-125 transition-transform"
                    >
                      🖼️
                    </button>
                  ) : (
                    <span className="text-gray-300 text-lg">—</span>
                  )}
                </td>
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
      )}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewImg(null)}
        >
          <img
            src={previewImg}
            alt="preview"
            className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl border-4 border-white"
          />
        </div>
      )}
    </>
  );
}
