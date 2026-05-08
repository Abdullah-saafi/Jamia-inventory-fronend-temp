import StatusBadge from "./StatusBadge";

export default function ItemsTable({ items = [], isDisputed, isReceived, isReturned }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-gray-400 text-xs">
          <th className="text-left pb-2 pr-4">اشیاء نمبر</th>
          <th className="text-left pb-2 pr-4">اشیاء کا نام</th>
          <th className="text-left pb-2 pr-4">UOM</th>
          <th className="text-center pb-2 pr-4">درخواست شدہ</th>
          <th className="text-center pb-2 pr-4">منظور شدہ</th>
          <th className="text-center pb-2 pr-4">مکمل شدہ</th>
          {(isDisputed || isReceived || isReturned) && (
            <>
              <th className="text-center pb-2 pr-4">وصول شدہ</th>
              <th className="text-center pb-2">حالت</th>
            </>
          )}
        </tr>
      </thead>

      <tbody>
        {items.map((i) => (
          <tr key={i.request_item_id} className="border-b border-gray-100">
            <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
              {i.item_no}
            </td>

            <td className="py-2 pr-4 text-gray-800">{i.item_name}</td>

            <td className="py-2 pr-4 text-gray-500 text-sm">{i.item_uom || "―"}</td>

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

            {(isDisputed || isReceived || isReturned) && (
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
                    <span                    >
                      <StatusBadge status={i.item_condition} />
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
  );
}
