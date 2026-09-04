import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTests: 0, totalStudents: 0, avgScore: 0, activeTests: 0 });
  const [myTests, setMyTests] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setStats({ totalTests: 24, totalStudents: 156, avgScore: 68, activeTests: 3 });
      setMyTests([
        { _id: '1', title: 'Midterm Aptitude Check', topic: 'Mixed', duration: 90, studentsCount: 145, avgScore: 65, isActive: true },
        { _id: '2', title: 'Number System Advanced', topic: 'Number System', duration: 45, studentsCount: 120, avgScore: 72, isActive: false },
        { _id: '3', title: 'Logical Reasoning Basics', topic: 'Logical Reasoning', duration: 60, studentsCount: 150, avgScore: 81, isActive: true },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Welcome back, {user?.name.split(' ')[0]}! 👩🏫
          </h1>
          <p className="text-slate-400 text-lg font-medium">Manage your tests and track student progress</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tests" value={stats.totalTests} icon="📋" gradient="blue" />
        <StatCard title="Total Students" value={stats.totalStudents} icon="👨🎓" gradient="green" />
        <StatCard title="Avg Class Score" value={`${stats.avgScore}%`} icon="📊" gradient="purple" />
        <StatCard title="Active Tests" value={stats.activeTests} icon="✅" gradient="orange" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => navigate('/teacher/create-test')}
          className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl mb-4">➕</div>
              <h3 className="text-xl font-bold mb-1">Create New Test</h3>
              <p className="text-indigo-200 text-sm font-medium">Build a custom assessment</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:translate-x-2 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/teacher/questions')}
          className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-1">Add Questions</h3>
              <p className="text-purple-200 text-sm font-medium">Manage your question bank</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:translate-x-2 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* My Tests Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">📚 My Recent Tests</h2>
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="p-4 font-bold text-slate-500 text-sm">Test Name</th>
                <th className="p-4 font-bold text-slate-500 text-sm">Topic</th>
                <th className="p-4 font-bold text-slate-500 text-sm text-center">Stats</th>
                <th className="p-4 font-bold text-slate-500 text-sm text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myTests.map((test) => (
                <tr key={test._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{test.title}</p>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      ⏱️ {test.duration} mins
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-bold border border-slate-200">
                      {test.topic}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">👨🎓 {test.studentsCount}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${test.avgScore >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>📊 {test.avgScore}% avg</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${test.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${test.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => navigate(`/teacher/results/${test._id}`)}
                      className="btn-secondary py-1.5 px-4 text-sm inline-flex items-center gap-2"
                    >
                      Results →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myTests.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              You haven't created any tests yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
