import React, { useState, useEffect } from 'react';
import StatCard from '../../components/StatCard';
import TopicBadge from '../../components/TopicBadge';

export default function TeacherAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-bold text-slate-800">📊 Class Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Avg Score" value="68%" icon="📈" gradient="blue" />
        <StatCard title="Top Topic" value="Number Sys" icon="🌟" gradient="green" subtitle="Avg 82%" />
        <StatCard title="Weak Topic" value="Time/Work" icon="🎯" gradient="red" subtitle="Avg 45%" />
        <StatCard title="At Risk" value="12" icon="⚠️" gradient="orange" subtitle="Students &lt; 50%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">🏆 Top Performers</h3>
          <ul className="space-y-3">
            {[1,2,3].map(i => (
              <li key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700 flex items-center gap-2"><span className="text-xl">{['🥇','🥈','🥉'][i-1]}</span> Student Name</span>
                <span className="font-black text-indigo-600">{95 - i*3}%</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 text-red-500">⚠️ At Risk Students (&lt; 50%)</h3>
          <ul className="space-y-3">
            {[1,2,3].map(i => (
              <li key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                <span className="font-bold text-red-700">Struggling Student {i}</span>
                <span className="font-black text-red-600">{48 - i*2}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
