import { Clock, Flame, Moon, Sun } from "lucide-react";
const PeakHoursCard = ({ data = [] }) => {

  if (!Array.isArray(data)) return null;

  const iconMap = {
    "Lunch Rush": {
      icon: <Sun size={16} />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30"
    },
    "Evening Rush": {
      icon: <Flame size={16} />,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/30"
    },
    "Slow Hours": {
      icon: <Moon size={16} />,
      color: "text-gray-400",
      bg: "bg-white/5 border-white/10"
    }
  };

  const hours = data.map(h => ({
    ...h,
    ...iconMap[h.label]
  }));
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-lg">Peak Hours</h2>
        <Clock size={18} className="text-gray-400" />
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {hours.map((h, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${h.bg} hover:scale-[1.02] transition`}
          >

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-black/30 ${h.color}`}>
                {h.icon}
              </div>

              <p className="text-sm font-medium">{h.label}</p>
            </div>

            <span className={`text-sm font-semibold ${h.color}`}>
              {h.time}
            </span>

          </div>
        ))}
      </div>
    </div>
  );
};

export default PeakHoursCard;