const TypeBadge = ({ hasItems, itemType }) => {
  if (hasItems && itemType === "USABLE")
    return (
        <span className="inline-flex items-center bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded px-1.5 py-0.5">
          استعمال ہونے والی اشیاء
        </span>
    );
  if (hasItems && itemType === "REUSABLE")
    return (
        <span className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded px-1.5 py-0.5">
          واپس ہونے والی اشیاء
        </span>
    );
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded px-1.5 py-0.5">
      اشیاء
    </span>
  );
};

export default TypeBadge