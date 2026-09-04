import React, { useState, useEffect } from 'react';
import TopicBadge from '../../components/TopicBadge';

export default function TestHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setTimeout(() => {
      setHistory([
        { id: 1, title: 'Number System Advanced Test', topic: 'Number System', date: '2023-10-15', score: 85, total: 100, status: 'Completed', questions: 20 },
        { id: 2, title: 'Weekly Mixed Aptitude', topic: 'Mixed', date: '2023-10-10', score: 65, total: 100, status: 'Completed', questions: 25 },
        { id: 3, title: 'Logical Reasoning Basics', topic: 'Logical Reasoning', date: '2023-10-05', score: 45, total: 100, status: 'Completed', questions: 15 },
        { id: 4, title: 'Speed Math Qualifier', topic: 'Mixed', date: '2023-09-28', score: 0, total: 50, status: 'Disqualified', questions: 10 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filtered = filter === 'All' ? history : history.filter(h => h.status === filter);

  if (loading) {
    return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-1">📋 Test History</h1>
          <p className="text-slate-500 font-medium">Review your past attempts and scores</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {['All', 'Completed', 'Disqualified'].map(tab => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${filter === tab ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(test => (
            <div key={test.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-2 h-full ${test.status === 'Disqualified' ? 'bg-red-500' : test.score >= 80 ? 'bg-emerald-500' : test.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}></div>
              
              <div className="flex justify-between items-start mb-4 pl-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md mb-2 inline-block border border-slate-200">
                    {test.topic}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{test.title}</h3>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                    📅 {new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                
                <div className="text-right shrink-0 ml-4">
                  {test.status === 'Completed' ? (
                    <div className="flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-4 shadow-sm ${test.score >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : test.score >= 60 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {test.score}%
                      </div>
                    </div>
                  ) : (
                    <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-md border border-red-200 flex items-center gap-1">
                      ⚠️ Disqualified
                    </span>
                  )}
                </div>
              </div>

              <div className="pl-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-sm font-medium text-slate-500">
                  {test.questions} Questions • {test.total} Marks Total
                </div>
                {test.status === 'Completed' && (
                  <button className="text-indigo-600 text-sm font-bold hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Review Details →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 border-dashed">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No history found</h3>
          <p className="text-slate-500">You haven't taken any tests in this category yet.</p>
        </div>
      )}
    </div>
  );
}
