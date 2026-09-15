
const DateTimeCell = ({ ts }) => {
  if (!ts) return <span className="text-gray-700 text-xs">—</span>;
  const d = new Date(ts);
  return (
    <div dir="ltr">
      <div className="text-gray-600 text-xs font-mono">
        {d.toLocaleDateString()}
      </div>
      <div className="text-gray-400 text-xs font-mono">
        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
};

export default DateTimeCell