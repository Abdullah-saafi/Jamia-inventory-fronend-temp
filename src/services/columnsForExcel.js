export const mainAllItemsColumn = [
    { key: "item_no", label: "آئٹم نمبر", format: (v) => (v ? v : "—") },
    { key: "item_name", label: "نام", format: (v) => (v ? v : "—") },
    { key: "category", label: "زمرہ", format: (v) => (v ? v : "—") },
    { key: "item_uom", label: "اکائی / UOM", format: (v) => (v ? v : "—") },
    { key: "item_quantity", label: "مرکزی اسٹور کا اسٹاک", format: (v) => (v ? v : "—") },
    { key: "sub_qty", label: "ذیلی اسٹورز کو بھیجا گیا", format: (v) => (v ? v : "—") },
    { key: "transit_qty", label: "ذیلی اسٹورزکوبھیجی جارہی", format: (v) => (v ? v : "—") },
    { key: "mainstore_transit_qty", label: "مین اسٹور کو بھیجی جارہی", format: (v) => (v ? v : "—") },
    { key: "total_qty", label: "باقی اسٹاک", format: (v) => (v ? v : "—") },
    { key: "min_quantity", label: "کم از کم اسٹاک", format: (v) => (v ? v : "—") },
    { key: "returned_qty", label: "واپس آئٹمز", format: (v) => (v ? v : "—") },
    { key: "scrapped_qty", label: "اسکریپ", format: (v) => (v ? v : "—") },
    {
        key: "condition",
        label: "حالت",
        format: (_, row) =>
            row.current_quantity <= row.minimum_quantity
                ? "Low"
                : "OK",
    },
]

export const newRequestListColumn = [
    { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
    { key: "item_type", label: "نوع", format: (v) => (v ? v : "—") },
    { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
    { key: "created_at", label: "درخواست کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
    { key: "approved_at", label: "منظوری کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
    { key: "fulfilled_at", label: "تکمیل کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
    { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
]
