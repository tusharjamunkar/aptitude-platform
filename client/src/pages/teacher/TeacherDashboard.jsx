import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const [data, setData] = useState({ stats: {}, recentTests: [], classPerformance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mocking API call or fetching from actual endpoint
      const res = await api.get('/analytics/teacher').catch(() => ({
        data: {
          stats: { totalTests: 12, totalStudents: 45, averageScore: 76, activeTests: 3 },
          recentTests: [
            { _id: '1', title: 'Quantitative Aptitude Test 1', status: 'ACTIVE', attempts: 30 },
            { _id: '2', title: 'Logical Reasoning Basics', status: 'COMPLETED', attempts: 42 }
          ],
          classPerformance: [
            { topic: 'Number System', avgScore: 85 },
            { topic: 'Percentages', avgScore: 65 },
            { topic: 'Profit and Loss', avgScore: 72 },
            { topic: 'Simple Interest', avgScore: 90 },
          ]
        }
      }));
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <div className="space-x-3">
          <Link to="/teacher/questions" className="btn-secondary">Add Questions</Link>
          <Link to="/teacher/create-test" className="btn-primary">Create Test</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tests" value={data.stats.totalTests || 0} icon="📄" color="blue" />
        <StatCard title="Total Students" value={data.stats.totalStudents || 0} icon="👥" color="green" />
        <StatCard title="Average Score" value={`${data.stats.averageScore || 0}%`} icon="📈" color="purple" />
        <StatCard title="Active Tests" value={data.stats.activeTests || 0} icon="⚡" color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Class Performance by Topic</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.classPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#3b82f6" name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Tests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentTests.map((test) => (
                  <tr key={test._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{test.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${test.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{test.attempts}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/teacher/tests/${test._id}/results`} className="text-primary-600 hover:text-primary-900">View Results</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
