const ApproveRejectModal = ({
    setApproveModal,
    approveModal,
    approverName,
    setApproverName,
    editedItems,
    setEditedItems,
    actioning,
    handleApprove,
    action,
    setRejectModal,
    rejectModal,
    rejecterName,
    setRejecterName,
    rejectReason,
    setRejectReason,
    handleReject,
    rejectItem,
    rejectSpecificItem,
    openHistory
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/30"
                onClick={() => {
                    action === "Approve" ? setApproveModal(null) : setRejectModal(null)
                }}
            />
            <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h2 className="text-gray-900 font-bold">
                        {action === "Approve" ? `Approve — ${approveModal.no}` : `Reject — ${rejectModal.request_no}`}
                    </h2>
                    <button
                        onClick={() => {
                            { action === "Approve" ? setApproveModal(null) : setRejectModal(null) }
                        }}
                        className="text-gray-400 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                            آپ کا نام *
                        </label>
                        <input
                            value={action === "Approve" ? approverName : rejecterName}
                            readOnly
                            onChange={(e) => {
                                { action === "Approve" ? setApproverName(e.target.value) : setRejecterName(e.target.value) }
                            }}
                            placeholder="Manager name"
                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
                        />
                    </div>

                    {action === "Approve" && (
                        <div>
                            <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
                                اگر ضرورت ہو تو مقدار میں تبدیلی کریں
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 text-gray-400 text-xs">
                                        <th className="text-left pb-2">آئٹم</th>
                                        <th className="text-center pb-2">درخواست کردہ</th>
                                        <th className="text-center pb-2">منظور شدہ مقدار</th>
                                        {editedItems.length > 1 && (
                                            <th className="text-center pb-2">عملیات</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {actioning ? (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="flex justify-center py-4">
                                                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        editedItems.map((i, idx) => (
                                            <tr
                                                key={i.request_item_id}
                                                className="border-b border-gray-100"
                                            >
                                                <td className="py-2">
                                                    <div className="text-gray-800 text-sm">
                                                        {i.item_name}
                                                    </div>
                                                    <div className="text-gray-400 text-xs font-mono">
                                                        {i.item_no} {i.item_type === "REUSABLE" ? "—" : `· ${i.item_uom}`}
                                                    </div>
                                                </td>

                                                <td className="py-2 font-mono text-gray-500 text-center">
                                                    {Number(i.requested_qty)}
                                                </td>

                                                <td className="py-2 text-center">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={Number(i.approved_qty)}
                                                        onChange={(e) => {
                                                            const u = [...editedItems];
                                                            u[idx] = {
                                                                ...u[idx],
                                                                approved_qty: +e.target.value,
                                                            };
                                                            setEditedItems(u);
                                                        }}
                                                        className="w-20 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-800 text-sm text-center focus:outline-none focus:border-emerald-500"
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        onClick={() => {
                                                            openHistory(i.item_no)
                                                        }}
                                                        // disabled={rejectSpecificItem === i.request_item_id}
                                                        className="text-zinc-800 text-sm font-semibold px-2 py-1 rounded disabled:opacity-40 bg-gray-200 hover:bg-gray-300"
                                                    >
                                                        {rejectSpecificItem === i.request_item_id ? "..." : "History"}
                                                    </button>
                                                </td>
                                                {editedItems.length > 1 && (
                                                    <td className="text-center">
                                                        <button
                                                            onClick={() => rejectItem(i.request_id, i.request_item_id)}
                                                            disabled={rejectSpecificItem === i.request_item_id}
                                                            className="text-white text-sm font-semibold px-2 py-1 rounded disabled:opacity-40 bg-red-600 hover:bg-red-500"
                                                        >
                                                            {rejectSpecificItem === i.request_item_id ? "..." : "مسترد"}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>)}

                    {action === "Reject" && (
                        <div>
                            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                مسترد کرنے کی وجہ *
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="وضاحت کریں کہ یہ درخواست کیوں مسترد کی جا رہی ہے"
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-400 resize-none"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <button
                            disabled={actioning}
                            onClick={() => {
                                { action === "Approve" ? setApproveModal(null) : setRejectModal(null) }
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                        >
                            منسوخ کریں
                        </button>
                        <button
                            onClick={action === "Approve" ? handleApprove : handleReject}
                            disabled={action === "Approve" ? actioning || !approverName.trim() : actioning || !rejecterName.trim() || !rejectReason.trim()}
                            className={`text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40 ${action === "Approve" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}
                        >
                            {action === "Approve" ? actioning ? "Processing..." : "منظوری کی تصدیق کریں" : actioning ? "Rejecting..." : "مسترد کرنے کی تصدیق کریں"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ApproveRejectModal