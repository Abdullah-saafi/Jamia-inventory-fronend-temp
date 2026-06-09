const AddItemModal = ({setShowAddItem, setNewItem, regenerateItemNo, newItem, mainStores, handleSaveItem, savingItem}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-gray-900 font-bold text-base">
                Add New Item
              </h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  اشیاء نمبر{" "}
                  <span className="text-gray-400 font-normal normal-case">
                    (auto-generated, editable)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={newItem.item_no}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, item_no: e.target.value }))
                    }
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-emerald-600 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={regenerateItemNo}
                    title="Generate new number"
                    className="px-3 py-2 border border-gray-300 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-sm"
                  >
                    ↻
                  </button>
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  اشیاء کا نام
                </label>
                <input
                  value={newItem.item_name}
                  onChange={(e) =>
                    setNewItem((f) => ({ ...f, item_name: e.target.value }))
                  }
                  placeholder="e.g. Surgical Gloves"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    UOM *
                  </label>
                  <input
                    value={newItem.item_uom}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, item_uom: e.target.value }))
                    }
                    placeholder="pcs / kg / box…"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    زمرہ
                  </label>
                  <input
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="e.g. Medical"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    ابتدائی مقدار
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.item_quantity}
                    onChange={(e) =>
                      setNewItem((f) => ({
                        ...f,
                        item_quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                    کم از کم اسٹاک
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.min_quantity}
                    onChange={(e) =>
                      setNewItem((f) => ({
                        ...f,
                        min_quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  اسٹور*
                </label>
                <select
                  value={newItem.store_id}
                  onChange={(e) =>
                    setNewItem((f) => ({ ...f, store_id: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">اسٹور منتخب کریں</option>
                  {mainStores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={savingItem}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all"
              >
                {savingItem ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
  )
}

export default AddItemModal