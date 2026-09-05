import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { TrophyIcon, CheckCircleIcon } from '../../components/Icons';

export default function StudentMilestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/milestones/my-progress');
      setMilestones(res.data?.milestones || []);
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Loading your milestones journey...</p>
      </div>
    );
  }

  const achievedCount = milestones.filter((m) => m.isAchieved).length;
  const progressPercent = milestones.length > 0 ? Math.round((achievedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
            <TrophyIcon className="w-3.5 h-3.5" />
            <span>Achievement Badges</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Milestones Journey</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete assessment goals and maintain high accuracy to unlock institutional badges
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
          <div className="text-2xl font-bold text-slate-900">
            {achievedCount} / {milestones.length}
          </div>
          <p className="text-xs text-slate-500 font-medium">Badges Unlocked ({progressPercent}%)</p>
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border p-6 shadow-sm transition-all flex flex-col justify-between ${
              m.isAchieved
                ? 'bg-white border-emerald-200 ring-1 ring-emerald-500/20'
                : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 shrink-0">
                  {m.badgeIcon || '🏆'}
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    m.isAchieved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {m.isAchieved ? 'Achieved' : 'In Progress'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">{m.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span>Progress</span>
                <span className="font-bold text-slate-800">
                  {m.testsCompleted} / {m.requiredTestsCount} Tests
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    m.isAchieved ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((m.testsCompleted / (m.requiredTestsCount || 1)) * 100))}%`
                  }}
                />
              </div>

              {m.achievedAt && (
                <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Unlocked on {new Date(m.achievedAt).toLocaleDateString()}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
