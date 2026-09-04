export default function StatCard({ title, value, icon, gradient, subtitle, trend }) {
  // gradient: 'blue' | 'green' | 'purple' | 'orange'
  const gradients = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-emerald-500 to-green-700',
    purple: 'from-purple-500 to-indigo-700',
    orange: 'from-orange-400 to-red-500',
    indigo: 'from-indigo-500 to-purple-700',
    pink: 'from-pink-500 to-rose-600',
  };
  return (
    <div className={`bg-gradient-to-br ${gradients[gradient] || gradients.blue} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm border border-white/10 shadow-inner">
          {icon}
        </div>
        {trend && (
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold border border-white/10 flex items-center gap-1 shadow-sm">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-1">{title}</h4>
        <div className="flex items-baseline gap-2">
          <h2 className="text-4xl font-black tracking-tight">{value}</h2>
          {subtitle && <p className="text-white/70 text-xs font-medium">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
