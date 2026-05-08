const ReturnItemsModal = ({ 
    setReturnModal,
    handleReturn,
    returnModalLoading,
    returnForm,
    setReturnForm
    }) => {

    const handleQtyChange = (idx, newValue) => {
        const originalQty = Number(returnForm.returnData.items[idx].received_qty);
        let value = Number(newValue);
        console.log("qty",originalQty);
        

        if (value < 0) value = 0;
        if (value > originalQty) value = originalQty;
        const updatedData = { ...returnForm.returnData };
        updatedData.items[idx] = {
            ...updatedData.items[idx],
            return_qty_input: value
        };
        setReturnForm((f) => ({...f, returnData: updatedData}));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/30"
                onClick={() => {
                    setReturnModal(false)
                }}
            />
            <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h2 className="text-gray-900 font-bold">
                        {`Return — ${returnForm.returnData.request_no}`}
                    </h2>
                    <button
                        onClick={() => {
                            setReturnModal(false)
                        }}
                        className="text-gray-400 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                            Your Name *
                        </label>
                        <input
                            value={returnForm.sendByName}
                            readOnly
                            placeholder="Manager name"
                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none"
                        />
                    </div>
                    <div>
                        <button onClick={() => {
                            console.log("returnForm",returnForm);
                            
                        }}>
                            click
                        </button>
                    </div>
                    <div>
                            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                Note *
                            </label>
                            <textarea
                                value={returnForm.note}
                                onChange={(e) => setReturnForm((f) => ({...f, note: e.target.value}))}
                                rows={3}
                                placeholder="Any note"
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-400 resize-none"
                            />
                        </div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-2">
                        Adjust quantities if needed
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-400 text-xs">
                                <th className="text-left pb-2">Item</th>
                                <th className="text-center pb-2">Received Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnForm.returnData.items.map((i, idx) => (
                                <tr
                                    key={i.request_item_id}
                                    className="border-b border-gray-100"
                                >
                                    <td className="py-2">
                                        <div className="text-gray-800 text-sm">
                                            {i.item_name}
                                        </div>
                                        <div className="text-gray-400 text-xs font-mono">
                                            {i.item_no}
                                        </div>
                                    </td>
                                    <td className="py-2 text-center">
                                        <input
                                            type="number"
                                            value={i.return_qty_input ?? i.received_qty}
                                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                                            className="w-20 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:border-emerald-500 outline-none"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <button
                            disabled={returnModalLoading}
                            onClick={() => {
                                setReturnModal(false)
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleReturn(returnForm.returnData.request_id, returnForm.returnData)}
                            disabled={returnModalLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40"
                        >
                            Return
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReturnItemsModal