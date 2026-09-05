import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { CheckCircleIcon, UserIcon, TrophyIcon, AlertIcon } from '../../components/Icons';

export default function TestResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [resAttempts, resTests] = await Promise.all([
        api.get(`/tests/${id}/results`),
        api.get('/tests')
      ]);

      const attemptList = resAttempts.data || [];
      setResults(attemptList);

      const currentTest = (resTests.data || []).find((t) => t.id === id);
      setTestInfo(currentTest || { title: 'Assessment Results' });
    } catch (err) {
      console.error('Error fetching test results:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCandidates = results.length;
  const completedAttempts = results.filter((r) => r.status === 'COMPLETED');
  const avgScore = completedAttempts.length > 0
    ? Math.round(
        completedAttempts.reduce(
          (acc, r) => acc + (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0),
          0
        ) / completedAttempts.length
      )
    : 0;

  const highestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((r) => r.score))
    : 0;

  const disqualifiedCount = results.filter((r) => r.status === 'DISQUALIFIED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/teacher')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 mb-1 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {testInfo?.title || 'Assessment Results'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort examination score records, roll numbers, and submission log
          </p>
        </div>
      </div>

      {/* Cohort Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Candidates Attempted"
          value={totalCandidates}
          icon={<UserIcon />}
          subtitle="Submissions received"
          variant="primary"
        />
        <StatCard
          title="Cohort Average"
          value={`${avgScore}%`}
          icon={<CheckCircleIcon />}
          subtitle="Completed exam average"
          variant="success"
        />
        <StatCard
          title="Highest Score"
          value={highestScore}
          icon={<TrophyIcon />}
          subtitle="Top mark attained"
          variant="warning"
        />
        <StatCard
          title="Disqualified"
          value={disqualifiedCount}
          icon={<AlertIcon />}
          subtitle="Tab-switching violations"
          variant="danger"
        />
      </div>

      {/* Student Submissions Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Student Examination Ledger</h2>
          <p className="text-xs text-slate-500">Official evaluation records sorted by rank</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading student scores...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No candidates have submitted this assessment yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department & Year</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {results.map((att, idx) => {
                  const pct = att.totalMarks > 0 ? Math.round((att.score / att.totalMarks) * 100) : 0;
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {att.student?.name || 'Candidate'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {att.student?.rollNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {att.student?.department || 'Engineering'} {att.student?.studyYear ? `(${att.student.studyYear})` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {att.score} / {att.totalMarks}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${pct >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${att.tabSwitchCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {att.tabSwitchCount} tab switch{att.tabSwitchCount !== 1 ? 'es' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            att.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
