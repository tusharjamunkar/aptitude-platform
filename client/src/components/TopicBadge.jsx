import React from 'react';

export default function TopicBadge({ topic, percentage }) {
  if (percentage === undefined || percentage === null) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {topic}
      </span>
    );
  }

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = 'Average';

  if (percentage >= 80) {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'Strong';
  } else if (percentage >= 60) {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'Moderate';
  } else {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Needs Focus';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}>
      <span>{topic}</span>
      <span className="font-bold opacity-80">· {percentage}%</span>
      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">({label})</span>
    </span>
  );
}
