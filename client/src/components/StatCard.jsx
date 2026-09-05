import React from 'react';

export default function StatCard({ title, value, icon, subtitle, trend, variant = 'primary' }) {
  const iconVariants = {
    primary: 'bg-blue-50 text-blue-600 border-blue-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    danger: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  const currentIconStyle = iconVariants[variant] || iconVariants.primary;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-all duration-150">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border text-base ${currentIconStyle}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
