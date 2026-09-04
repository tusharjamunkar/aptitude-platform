import React from 'react';

export default function TopicBadge({ percentage }) {
  if (percentage >= 80) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 shadow-sm">
        <span className="text-emerald-500">💪</span> Strong
      </span>
    );
  } else if (percentage >= 60) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 shadow-sm">
        <span className="text-amber-500">📈</span> Average
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200 shadow-sm">
        <span className="text-red-500">🔴</span> Needs Work
      </span>
    );
  }
}
