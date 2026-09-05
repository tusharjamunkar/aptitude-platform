import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { BookOpenIcon, UserIcon, TrophyIcon, CheckCircleIcon } from '../../components/Icons';

export default function TeacherAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/teacher');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const {
    totalStudents = 0,
    totalTests = 0,
    averageClassScore = 0,
    testBreakdown = [],
    topPerformers = [],
    atRiskStudents = []
  } = data || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Analytics & Insights</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time performance metrics across all administered tests and students.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled test candidates"
          icon={<UserIcon className="w-5 h-5" />}
          variant="primary"
        />
        <StatCard
          title="Total Tests Created"
          value={totalTests}
          subtitle="Active & published"
          icon={<BookOpenIcon className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="Average Class Score"
          value={`${Math.round(averageClassScore)}%`}
          subtitle="Aggregate completed tests"
          icon={<TrophyIcon className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          title="Tests Assessed"
          value={testBreakdown.length}
          subtitle="Available for evaluation"
          icon={<CheckCircleIcon className="w-5 h-5" />}
          variant="purple"
        />
      </div>

      {/* Test Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-800">Test Performance Summary</h2>
          <span className="text-xs font-medium text-slate-500">{testBreakdown.length} Tests recorded</span>
        </div>

        {testBreakdown.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">No test submission data recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium">
                  <th className="py-3 px-6">Test Title</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Avg Score</th>
                  <th className="py-3 px-4">Pass Rate</th>
                  <th className="py-3 px-4">Disqualified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testBreakdown.map((t, idx) => (
                  <tr key={t.testId || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{t.title}</td>
                    <td className="py-3.5 px-4 text-slate-600">{t.totalAttempts}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{Math.round(t.avgScore || 0)}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        t.passRate >= 70 ? 'bg-emerald-50 text-emerald-700' :
                        t.passRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {Math.round(t.passRate || 0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {t.disqualifiedCount > 0 ? (
                        <span className="text-red-600 font-semibold">{t.disqualifiedCount} flagged</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Performers and At Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="text-base font-semibold text-slate-900">Academic Honors & Top Performers</h3>
          </div>
          {topPerformers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Top candidate insights will calculate automatically after student attempts.
            </div>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((student, i) => (
                <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="text-xs font-bold w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">#{i + 1}</span>
                    {student.name}
                  </span>
                  <span className="font-bold text-emerald-600">{Math.round(student.avgScore)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h3 className="text-base font-semibold text-slate-900">At-Risk Students (&lt; 50% Average)</h3>
          </div>
          {atRiskStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No students are currently flagged as at-risk.
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskStudents.map((student, i) => (
                <div key={i} className="flex justify-between items-center p-3.5 bg-amber-50/50 rounded-lg border border-amber-200/60">
                  <div>
                    <div className="font-semibold text-slate-800">{student.name}</div>
                    <div className="text-xs text-amber-700 font-medium">Requires conceptual guidance</div>
                  </div>
                  <span className="font-bold text-amber-700">{Math.round(student.avgScore)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
