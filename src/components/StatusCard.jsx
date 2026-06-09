import { ArrowUpRight } from 'lucide-react';

const StatusCard = ({ title, count, onClick, colorClass, isActive }) => {
  // if (count <= 0) return null

  const activeStyles = "bg-gradient-to-bl from-green-600 via-emerald-600 to-green-600 border-transparent shadow-lg scale-103";
  const inactiveStyles = "bg-white border-gray-200 hover:shadow-md";

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-2xl p-4 border transition-all duration-300 cursor-pointer group min-w-[200px] flex-1 ${
        isActive ? activeStyles : inactiveStyles
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="z-10">
          <p className={`text-sm font-medium transition-colors ${isActive ? "text-white" : "text-black"}`}>
            {title}
          </p>
        </div>
        
        {/* Icon Container */}
        <div className={`p-1.5 rounded-full text-black transition-all ${
          isActive 
            ? `${colorClass} bg-white }`
            : `${colorClass} }`
        } group-hover:scale-110`}>
          <ArrowUpRight size={16} />
        </div>
      </div>

      <div className="flex items-baseline gap-2 z-10">
        <h3 className={`text-4xl font-bold transition-colors ${isActive ? "text-white" : "text-gray-800"}`}>
          {count}
        </h3>
      </div>

      {/* Subtle indicator for active state */}
      {isActive && (
        <div className="absolute bottom-2 right-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default StatusCard