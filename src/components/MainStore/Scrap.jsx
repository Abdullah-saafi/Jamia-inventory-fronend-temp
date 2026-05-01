import { useEffect, useState } from "react";
import API from "../../services/api";

const STATUS_COLORS = {
  AVAILABLE: "bg-emerald-50 border-emerald-300 text-emerald-700",
  ASSIGNED: "bg-blue-50 border-blue-300 text-blue-700",
  DAMAGED: "bg-red-50 border-red-300 text-red-700",
};

const EMPTY_FORM = {
  asset_name: "",
  serial_number: "",
  store_id: "",
  status: "AVAILABLE",
  assigned_to: "",
};
const EMPTY_TRANSFER = { asset_id: "", from_store_id: "", to_store_id: "" };

export default function Scrap({ showToast }) {
  const [assets, setAssets] = useState([]);
  const [stores, setStores] = useState([]); // ← fetched internally
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [transfer, setTransfer] = useState(EMPTY_TRANSFER);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");

  // ── fetch stores once on mount ──────────────────────────────────────────────
  useEffect(() => {
    API.get("/stores")
      .then((res) => setStores(res.data.data || []))
      .catch(() => showToast?.("Failed to load stores", "error"));
  }, []);

  // ── fetch assets whenever filters change ────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterStore) params.set("store_id", filterStore);
      const res = await API.get(`/reusableItems${params}`);
      setAssets(res.data.data || []);
    } catch {
      showToast?.("Failed to load assets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus, filterStore]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.asset_name || !form.serial_number || !form.store_id)
      return showToast?.("Fill all required fields", "error");
    setSaving(true);
    try {
      await API.post("/assets", form);
      showToast?.("Asset created");
      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      showToast?.(e.response?.data?.message || "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await API.delete(`/reusableItems/${id}`);
      showToast?.("Deleted");
      load();
    } catch (e) {
      showToast?.(e.response?.data?.message || "Failed", "error");
    }
  };

  const handleTransfer = async () => {
    if (!transfer.to_store_id)
      return showToast?.("Select destination store", "error");
    setSaving(true);
    try {
      await API.post("/assets/transfer", transfer);
      showToast?.("Transfer requested");
      setShowTransfer(null);
      setTransfer(EMPTY_TRANSFER);
    } catch (e) {
      showToast?.(e.response?.data?.message || "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const openTransfer = (asset) => {
    setTransfer({
      asset_id: asset.asset_id,
      from_store_id: asset.store_id,
      to_store_id: "",
    });
    setShowTransfer(asset);
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Assets</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          + Add Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="DAMAGED">Damaged</option>
        </select>

        <select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.store_name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "آئٹم نمبر",
                "نام",
                "زمرہ",
                "اکائی",
                "آئٹم کی قسم",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No assets found.
                </td>
              </tr>
            ) : (
              assets.map((a) => (
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {a.reusableItem_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-emerald-600">
                    {a.reusableItem_id}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.store_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded border text-xs font-bold ${STATUS_COLORS[a.reusableItem_status]}`}
                    >
                      {a.reusableItem_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.assigned_to || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTransfer(a)}
                        className="text-xs text-blue-600 hover:text-blue-500 border border-blue-200 rounded px-2 py-1"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => handleDelete(a.asset_id)}
                        className="text-xs text-red-500 hover:text-red-400 border border-red-200 rounded px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )} */}
          </tbody>
        </table>
      </div>

      {/* Add Asset Modal */}
      {showAdd && (
        <Modal
          title="Add Asset"
          onClose={() => {
            setShowAdd(false);
            setForm(EMPTY_FORM);
          }}
        >
          <div className="space-y-3">
            <Field label="Asset Name *">
              <input
                value={form.asset_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, asset_name: e.target.value }))
                }
                placeholder="e.g. Dell Laptop"
                className={inputCls}
              />
            </Field>
            <Field label="Serial Number *">
              <input
                value={form.serial_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, serial_number: e.target.value }))
                }
                placeholder="e.g. SN-20241001"
                className={inputCls}
              />
            </Field>
            <Field label="Store *">
              <select
                value={form.store_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, store_id: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                className={inputCls}
              >
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </Field>
            <Field label="Assigned To">
              <input
                value={form.assigned_to}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assigned_to: e.target.value }))
                }
                placeholder="Person name (optional)"
                className={inputCls}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setForm(EMPTY_FORM);
                }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <Modal
          title={`Transfer: ${showTransfer.asset_name}`}
          onClose={() => setShowTransfer(null)}
        >
          <div className="space-y-3">
            <Field label="From Store">
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                {stores.find(
                  (s) => String(s.store_id) === String(showTransfer.store_id),
                )?.store_name || "—"}
              </div>
            </Field>
            <Field label="To Store *">
              <select
                value={transfer.to_store_id}
                onChange={(e) =>
                  setTransfer((t) => ({ ...t, to_store_id: e.target.value }))
                }
                className={inputCls}
              >
                <option value="">Select destination</option>
                {stores
                  .filter(
                    (s) => String(s.store_id) !== String(showTransfer.store_id),
                  )
                  .map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTransfer(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-40"
              >
                {saving ? "Requesting…" : "Request Transfer"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

