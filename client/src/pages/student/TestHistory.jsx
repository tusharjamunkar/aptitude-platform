import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function TestHistory() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, COMPLETED, DISQUALIFIED

  useEffect(() => {
    // Mock Data
    setHistory([
      { id: '1', title: 'Quantitative Aptitude Basics', topic: 'Number System', date: '2023-10-20T10:00:00Z', duration: 45, score: 40, totalMarks: 50, percentage: 80, status: 'COMPLETED' },
      { id: '2', title: 'Logical Reasoning 1', topic: 'Logical Reasoning', date: '2023-10-18T14:30:00Z', duration: 30, score: 0, totalMarks: 30, percentage: 0, status: 'DISQUALIFIED' },
      { id: '3', title: 'Data Interpretation Weekly', topic: 'Data Interpretation', date: '2023-10-15T09:00:00Z', duration: 60, score: 55, totalMarks: 60, percentage: 91.6, status: 'COMPLETED' },
      { id: '4', title: 'Speed Math', topic: 'Mixed', date: '2023-10-10T16:00:00Z', duration: 15, score: 10, totalMarks: 20, percentage: 50, status: 'COMPLETED' }
    ]);
  }, []);

  const filteredHistory = history.filter(h => filter === 'ALL' || h.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Test History</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['ALL', 'COMPLETED', 'DISQUALIFIED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{attempt.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{attempt.topic} • {attempt.duration} mins</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(attempt.date).toLocaleDateString()}
                    <span className="block text-xs">{new Date(attempt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      attempt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      attempt.status === 'DISQUALIFIED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {attempt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attempt.status === 'DISQUALIFIED' ? (
                      <span className="text-red-600 font-bold">0</span>
                    ) : (
                      <div>
                        <p className={`text-sm font-bold ${attempt.percentage >= 80 ? 'text-green-600' : attempt.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {attempt.percentage}%
                        </p>
                        <p className="text-xs text-gray-500">{attempt.score} / {attempt.totalMarks}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 bg-primary-50 px-3 py-1 rounded-md">View Details</button>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No history found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
