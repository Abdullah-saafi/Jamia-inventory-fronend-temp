export const mainAllItemsColumns = [
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

export const newRequestListColumns = [
    { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
    { key: "item_type", label: "نوع", format: (v) => (v ? v : "—") },
    { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
    { key: "created_at", label: "درخواست کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
    { key: "approved_at", label: "منظوری کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
    { key: "fulfilled_at", label: "تکمیل کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
    { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
]

export const returnRequestListColumns = [
    {
        key: "return_no",
        label: "واپسی نمبر",
        format: (value) => value || "—",
    },
    {
        key: "to_store_name",
        label: "وصول کنندہ اسٹور",
        format: (value) => value || "—",
    },
    {
        key: "sent_by_name",
        label: "بھیجنے والا",
        format: (value) => value || "—",
    },
    {
        key: "item_count",
        label: "آئٹمز",
        format: (value) => value || "—",
    },
    {
        key: "created_at",
        label: "تاریخ",
        format: (value) =>
            value
                ? new Date(value).toLocaleDateString()
                : "—",
    },
    {
        key: "status",
        label: "اسٹیٹس",
        format: (value) => value || "—",
    },
]

export const subStoreManagerColumns = [
    { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
    { key: "item_type", label: "نوع", format: (v) => (v ? v : "—") },
    { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
    { key: "created_at", label: "درخواست کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
    { key: "approved_at", label: "منظوری کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
    { key: "fulfilled_at", label: "تکمیل کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
    { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
]

export const mainSubStoreReqsColumns = [
    { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
    { key: "from_store_name", label: "اسٹور سے", format: (v) => (v ? v : "—") },
    { key: "to_store_name", label: "مرکزی اسٹور کو", format: (v) => (v ? v : "—") },
    { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
    { key: "approved_by_name", label: "منظور کنندہ", format: (v) => (v ? v : "—") },
    { key: "fulfilled_by_name", label: "مکمل کرنے والا", format: (v) => (v ? v : "—") },
    { key: "created_at", label: "درخواست کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
    { key: "fulfilled_at", label: "تکمیل کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
    { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
]

export const mainStoreProcessReturnsColumns = [
    {
        key: "return_no",
        label: "واپسی نمبر",
        format: (v) => (v ? v : "—"),
    },
    {
        key: "from_store_name",
        label: "بھیجنے والا اسٹور",
        format: (v) => (v ? v : "—"),
    },
    {
        key: "sent_by_name",
        label: "بھیجنے والا",
        format: (v) => (v ? v : "—"),
    },
    {
        key: "item_count",
        label: "آئٹمز",
        format: (v) => (v ? v : "—"),
    },
    {
        key: "created_at",
        label: "تاریخ",
        format: (v) =>
            v ? new Date(v).toLocaleDateString() : "—",
    },
    {
        key: "status",
        label: "اسٹیٹس",
        format: (v) => (v ? v : "—"),
    },
]

export const mainReqToHOColumns = [
    { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
    { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
    {
        key: "created_at",
        label: "درخواست کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "approved_at",
        label: "منظوری کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "fulfilled_at",
        label: " تکمیل کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
]

export const mainStoreApproverColumns = [
    { key: "request_no", label: "درخواست نمبر" },
    { key: "requested_by_name", label: "درخواست کنندہ" },
    {
        key: "created_at",
        label: "درخواست کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "approved_at",
        label: "منظوری کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "fulfilled_at",
        label: "تکمیل کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    { key: "status", label: "حالت" },
]

export const headOfficeColumns = [
    { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
    { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
    { key: "fulfilled_by_name", label: "مکمل کرنے والا", format: (v) => (v ? v : "—") },
    {
        key: "created_at",
        label: "درخواست کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "approved_at",
        label: "منظوری کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "fulfilled_at",
        label: "تکمیل کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
]

export const pettyCashColumns = [
    { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
    { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
    { key: "fulfilled_by_name", label: "مکمل کرنے والا", format: (v) => (v ? v : "—") },
    {
        key: "created_at",
        label: "درخواست کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "approved_at",
        label: "منظوری کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
        key: "fulfilled_at",
        label: "تکمیل کی تاریخ",
        format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
]