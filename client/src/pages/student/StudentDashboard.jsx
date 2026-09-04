import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    stats: { testsTaken: 0, avgScore: 0, milestones: 0, streak: 0 },
    availableTests: [],
    recentResults: [],
    milestoneProgress: { current: 5, target: 10, nextBadge: 'Silver Pro' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock API call
    setTimeout(() => {
      setData({
        stats: { testsTaken: 12, avgScore: 78, milestones: 3, streak: 5 },
        availableTests: [
          { _id: '1', title: 'Weekly Aptitude Test', topic: 'Mixed', duration: 45, deadline: new Date(Date.now() + 86400000).toISOString() },
          { _id: '2', title: 'Data Interpretation Basics', topic: 'Data Interpretation', duration: 30, deadline: new Date(Date.now() + 172800000).toISOString() }
        ],
        recentResults: [
          { id: '1', title: 'Number System Quiz', score: 85, date: '2023-10-20' },
          { id: '2', title: 'Algebra Fundamentals', score: 92, date: '2023-10-18' }
        ],
        milestoneProgress: { current: 12, target: 20, nextBadge: 'Gold Master' }
      });
      setLoading(false);
    }, 500);
  }, []);

  const handleStartTest = (testId) => {
    navigate(`/take-test/${testId}`);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500">Here's your progress and upcoming tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tests Taken" value={data.stats.testsTaken} icon="📝" color="blue" />
        <StatCard title="Average Score" value={`${data.stats.avgScore}%`} icon="🎯" color="green" />
        <StatCard title="Milestones Earned" value={data.stats.milestones} icon="🏆" color="purple" />
        <StatCard title="Current Streak" value={`${data.stats.streak} Days`} icon="🔥" color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Available Tests</h2>
          {data.availableTests.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">No tests available right now.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.availableTests.map(test => (
                <div key={test._id} className="card flex flex-col h-full border-l-4 border-l-primary-500">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{test.title}</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>📚 Topic: {test.topic}</p>
                      <p>⏱️ Duration: {test.duration} mins</p>
                      <p className="text-red-600">⏰ Deadline: {new Date(test.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => handleStartTest(test._id)} className="w-full btn-primary">Start Test</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Results</h2>
          <div className="card p-0 overflow-hidden divide-y divide-gray-100">
            {data.recentResults.map(res => (
              <div key={res.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{res.title}</p>
                  <p className="text-xs text-gray-500">{new Date(res.date).toLocaleDateString()}</p>
                </div>
                <div className={`font-bold ${res.score >= 80 ? 'text-green-600' : res.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {res.score}%
                </div>
              </div>
            ))}
          </div>
          <Link to="/student/history" className="block text-center text-primary-600 text-sm font-medium hover:underline">View All History →</Link>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="font-bold text-gray-900">Next Milestone: {data.milestoneProgress.nextBadge}</h3>
            <p className="text-sm text-gray-600">{data.milestoneProgress.target - data.milestoneProgress.current} tests left</p>
          </div>
          <span className="text-lg font-bold text-primary-700">{Math.round((data.milestoneProgress.current/data.milestoneProgress.target)*100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${(data.milestoneProgress.current/data.milestoneProgress.target)*100}%` }}></div>
        </div>
      </div>
    </div>
  );
}
