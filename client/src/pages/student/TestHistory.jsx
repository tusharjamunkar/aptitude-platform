import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { HistoryIcon, CheckCircleIcon, ClockIcon } from '../../components/Icons';

export default function TestHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attempts');
      setAttempts(res.data || []);
    } catch (err) {
      console.error('Error fetching test history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (attemptId) => {
    try {
      const res = await api.get(`/attempts/${attemptId}`);
      setSelectedAttempt(res.data);
    } catch (err) {
      console.error('Error fetching attempt breakdown:', err);
    }
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Retrieving examination records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examination History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of all your submitted assessments and score records
          </p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No assessment attempts recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Take available assessments from your dashboard to see your performance logs here.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Attempt</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Improvement</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {attempts.map((att, idx) => {
                  const pct = att.totalMarks > 0 ? Math.round((att.score / att.totalMarks) * 100) : 0;
                  
                  // Calculate improvement from earlier attempt of the same test if available
                  const sameTestEarlierAttempts = attempts.filter(
                    a => a.testId === att.testId && 
                    new Date(a.createdAt) < new Date(att.createdAt) && 
                    a.status === 'COMPLETED'
                  );
                  let improvementText = null;
                  if (sameTestEarlierAttempts.length > 0) {
                    const prev = sameTestEarlierAttempts[sameTestEarlierAttempts.length - 1];
                    const prevPct = prev.totalMarks > 0 ? Math.round((prev.score / prev.totalMarks) * 100) : 0;
                    const diff = pct - prevPct;
                    improvementText = {
                      diff,
                      prevPct
                    };
                  }

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {att.test?.title || 'Assessment'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Attempt {att.attemptNumber || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(att.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {att.score} / {att.totalMarks}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${pct >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {improvementText ? (
                          <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                            improvementText.diff > 0
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : improvementText.diff < 0
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : 'text-slate-600 bg-slate-100'
                          }`}>
                            {improvementText.diff > 0 ? `+${improvementText.diff}%` : `${improvementText.diff}%`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Base Attempt</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            att.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : att.status === 'DISQUALIFIED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleViewDetails(att.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => navigate(`/take-test/${att.testId}?mode=retest`)}
                          className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                        >
                          Retake
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Breakdown Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedAttempt.test?.title || 'Test Breakdown'}
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed question review and correct answers
                </p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {(selectedAttempt.answers || []).map((ans, i) => (
                <div key={ans.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">Q{i + 1}. {ans.question?.questionText}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ans.isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : ans.selectedAnswer
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {ans.isCorrect ? 'Correct' : ans.selectedAnswer ? 'Incorrect' : 'Skipped'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-slate-600 font-medium">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Your Answer:</span>
                      <span className="font-bold text-slate-800">{ans.selectedAnswer || 'None'}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Correct Answer:</span>
                      <span className="font-bold text-emerald-700">{ans.question?.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 text-right">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
