import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ testsTaken: 0, avgScore: 0, milestones: 0, streak: 0 });
  const [availableTests, setAvailableTests] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [milestoneProgress, setMilestoneProgress] = useState({ title: 'Novice', completed: 0, total: 5, percentage: 0 });

  useEffect(() => {
    // Mock data fetch - replace with actual API calls
    setTimeout(() => {
      setStats({ testsTaken: 12, avgScore: 76, milestones: 3, streak: 5 });
      setAvailableTests([
        { _id: '1', title: 'Number System Basics', topic: 'Number System', duration: 45, questionsCount: 20, deadline: new Date(Date.now() + 86400000).toISOString() },
        { _id: '2', title: 'Advanced Percentages', topic: 'Percentages', duration: 60, questionsCount: 25, deadline: null },
      ]);
      setRecentResults([
        { _id: '1', testName: 'Logical Reasoning Test 1', score: 85, date: new Date().toISOString() },
        { _id: '2', testName: 'Time and Work Quiz', score: 55, date: new Date(Date.now() - 86400000).toISOString() },
      ]);
      setMilestoneProgress({ title: 'Scholar', completed: 7, total: 10, percentage: 70 });
      setLoading(false);
    }, 1000);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getTopicColor = (topic) => {
    const colors = {
      'Number System': 'bg-blue-100 text-blue-800 border-blue-200',
      'Percentages': 'bg-green-100 text-green-800 border-green-200',
      'Logical Reasoning': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[topic] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">
              {getGreeting()}, {user?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-indigo-100 text-lg font-medium">Ready to ace your tests today?</p>
          </div>
          <div className="text-7xl drop-shadow-2xl hidden md:block animate-bounce-slow">
            🎯
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tests Taken" value={stats.testsTaken} icon="📝" gradient="blue" />
        <StatCard title="Avg Score" value={`${stats.avgScore}%`} icon="📈" gradient="green" trend="+5%" />
        <StatCard title="Milestones" value={stats.milestones} icon="🏆" gradient="purple" />
        <StatCard title="Day Streak" value={stats.streak} icon="🔥" gradient="orange" subtitle="Keep it up!" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Tests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              📚 Available Tests
              <span className="bg-indigo-100 text-indigo-700 text-sm py-1 px-3 rounded-full">{availableTests.length}</span>
            </h2>
          </div>
          
          {availableTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTests.map(test => (
                <div key={test._id} className="card flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-2 transition-all"></div>
                  <div className="pl-4">
                    <div className={`inline-block px-3 py-1 rounded-md text-xs font-bold border mb-3 ${getTopicColor(test.topic)}`}>
                      {test.topic}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{test.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 font-medium">
                      <span className="flex items-center gap-1">⏱️ {test.duration}m</span>
                      <span className="flex items-center gap-1">📋 {test.questionsCount} Qs</span>
                    </div>
                    {test.deadline && (
                      <div className="text-xs font-semibold text-red-500 bg-red-50 inline-block px-2 py-1 rounded mb-4 border border-red-100">
                        ⏳ Ends in {Math.ceil((new Date(test.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    )}
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => navigate(`/take-test/${test._id}`)}
                        className="w-full btn-primary py-2 text-sm"
                      >
                        Start Test →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No pending tests!</h3>
              <p className="text-slate-500">You're all caught up. Check back later for new assignments.</p>
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">📊 Recent Results</h2>
            <button onClick={() => navigate('/student/history')} className="text-indigo-600 text-sm font-bold hover:underline">View All →</button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {recentResults.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentResults.map(result => (
                  <div key={result._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 mb-1">{result.testName}</p>
                      <p className="text-xs font-medium text-slate-500">{new Date(result.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm ${result.score >= 60 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                      {result.score}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No recent results found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestone Strip */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl bg-purple-100 p-3 rounded-2xl shadow-inner border border-purple-200">🏆</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Next milestone: {milestoneProgress.title}</h3>
              <p className="text-sm font-medium text-slate-500">{milestoneProgress.completed} of {milestoneProgress.total} tests completed</p>
            </div>
          </div>
          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Progress</span>
              <span className="text-indigo-600">{milestoneProgress.percentage}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${milestoneProgress.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
