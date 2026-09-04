import React, { useState, useEffect } from 'react';

export default function StudentMilestones() {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setMilestones([
        { id: 1, title: 'Novice', desc: 'Complete your first test', required: 1, current: 1, achieved: true, date: '10/05/2023', icon: '🥚' },
        { id: 2, title: 'Apprentice', desc: 'Complete 5 tests', required: 5, current: 5, achieved: true, date: '15/05/2023', icon: '🐣' },
        { id: 3, title: 'Scholar', desc: 'Score above 80% on 3 tests', required: 3, current: 2, achieved: false, icon: '🎓' },
        { id: 4, title: 'Master', desc: 'Maintain a 5-day streak', required: 5, current: 0, achieved: false, icon: '👑' },
        { id: 5, title: 'Legend', desc: 'Top 10% in a global test', required: 1, current: 0, achieved: false, icon: '🐉' },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div></div>;
  }

  const achievedCount = milestones.filter(m => m.achieved).length;
  const progressPercent = Math.round((achievedCount / milestones.length) * 100);

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
              🏆 Your Journey
            </h1>
            <p className="text-purple-200 font-medium text-lg">Unlock achievements as you learn.</p>
          </div>
          
          <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center relative bg-white/5 backdrop-blur-sm shadow-inner">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
              <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * progressPercent) / 100} className="text-emerald-400 drop-shadow-md transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="text-center">
              <div className="text-3xl font-black text-white">{progressPercent}%</div>
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[3.25rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
        
        {milestones.map((m, idx) => (
          <div key={m.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            {/* Icon marker */}
            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform ${m.achieved ? 'bg-emerald-100 border-emerald-500 text-2xl scale-110' : m.current > 0 ? 'bg-indigo-50 border-indigo-400 text-xl' : 'bg-slate-50 border-slate-300 text-xl grayscale'}`}>
              {m.achieved ? m.icon : m.icon}
            </div>
            
            {/* Card */}
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border-2 transition-all ${m.achieved ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 shadow-md' : m.current > 0 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className={`text-lg font-black ${m.achieved ? 'text-emerald-800' : 'text-slate-800'}`}>{m.title}</h3>
                {m.achieved && <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-md border border-emerald-100 shadow-sm">{m.date}</span>}
                {!m.achieved && m.current === 0 && <span className="text-slate-400">🔒</span>}
              </div>
              <p className={`text-sm font-medium mb-4 ${m.achieved ? 'text-emerald-700/80' : 'text-slate-500'}`}>{m.desc}</p>
              
              {!m.achieved && (
                <div className="w-full">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-indigo-600">Progress</span>
                    <span className="text-slate-500">{m.current} / {m.required}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(m.current / m.required) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
      </div>

      <div className="mt-16 text-center">
        <p className="text-slate-500 font-medium italic">"Success is the sum of small efforts, repeated day in and day out."</p>
      </div>
    </div>
  );
}
