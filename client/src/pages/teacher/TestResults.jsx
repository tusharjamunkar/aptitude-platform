import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';

export default function TestResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setResults({
        testName: 'Midterm Aptitude Check',
        topic: 'Mixed Topics',
        stats: { totalAttempts: 145, avgScore: 68, passRate: 75, disqualified: 3 },
        students: [
          { rank: 1, name: 'Alex Johnson', score: 98, time: '38m', status: 'Passed' },
          { rank: 2, name: 'Sarah Williams', score: 95, time: '41m', status: 'Passed' },
          { rank: 3, name: 'Michael Chen', score: 92, time: '44m', status: 'Passed' },
          { rank: 4, name: 'Emily Davis', score: 88, time: '40m', status: 'Passed' },
          { rank: 120, name: 'John Doe', score: 45, time: '45m', status: 'Failed' },
        ]
      });
      setLoading(false);
    }, 600);
  }, [id]);

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="text-2xl drop-shadow-sm" title="First Place">🥇</span>;
    if (rank === 2) return <span className="text-2xl drop-shadow-sm" title="Second Place">🥈</span>;
    if (rank === 3) return <span className="text-2xl drop-shadow-sm" title="Third Place">🥉</span>;
    return <span className="text-sm font-bold text-slate-500 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center border border-slate-200">#{rank}</span>;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/teacher')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
          ←
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">{results.testName}</h1>
          <p className="text-slate-500 font-medium">Results and Analysis • {results.topic}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Attempts" value={results.stats.totalAttempts} icon="👨🎓" gradient="blue" />
        <StatCard title="Average Score" value={`${results.stats.avgScore}%`} icon="📊" gradient="purple" />
        <StatCard title="Pass Rate" value={`${results.stats.passRate}%`} icon="✅" gradient="green" />
        <StatCard title="Disqualified" value={results.stats.disqualified} icon="⚠️" gradient="orange" />
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">🏆 Class Leaderboard</h2>
          <button className="btn-secondary py-1.5 text-sm flex items-center gap-2">
            <span>📥</span> Export CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase font-bold text-slate-400 border-b border-slate-100">
                <th className="py-4 pl-6 w-16">Rank</th>
                <th className="py-4">Student Name</th>
                <th className="py-4 w-64">Score Bar</th>
                <th className="py-4 text-center">Score</th>
                <th className="py-4 text-center">Time</th>
                <th className="py-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.students.map((student, i) => (
                <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                  <td className="py-4 pl-6">{getRankBadge(student.rank)}</td>
                  <td className="py-4 font-bold text-slate-700">{student.name}</td>
                  <td className="py-4 pr-4">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${student.score >= 80 ? 'bg-emerald-500' : student.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${student.score}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-4 text-center font-black text-slate-800">{student.score}%</td>
                  <td className="py-4 text-center text-sm font-medium text-slate-500">{student.time}</td>
                  <td className="py-4 pr-6 text-right">
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${student.status === 'Passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
