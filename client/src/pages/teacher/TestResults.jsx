import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';

export default function TestResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const res = await api.get(`/tests/${id}/results`).catch(() => ({
        data: {
          testInfo: { title: 'Quantitative Aptitude 1', date: '2023-10-15', duration: 60, totalMarks: 50 },
          stats: { totalAttempts: 45, avgScore: 35.5, passRate: 75, disqualified: 2 },
          students: [
            { id: '1', name: 'John Doe', score: 45, percentage: 90, status: 'COMPLETED', timeSpent: 45 },
            { id: '2', name: 'Jane Smith', score: 0, percentage: 0, status: 'DISQUALIFIED', timeSpent: 12 },
            { id: '3', name: 'Bob Wilson', score: 38, percentage: 76, status: 'COMPLETED', timeSpent: 55 }
          ],
          questionAnalysis: [
            { qId: 'Q1', successRate: 85 },
            { qId: 'Q2', successRate: 45 },
            { qId: 'Q3', successRate: 92 },
            { qId: 'Q4', successRate: 30 }
          ]
        }
      }));
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!data) return <div className="text-center py-10">No data found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.testInfo.title} - Results</h1>
          <p className="text-gray-500 mt-1">Date: {data.testInfo.date} | Duration: {data.testInfo.duration} mins | Total Marks: {data.testInfo.totalMarks}</p>
        </div>
        <button className="btn-secondary flex items-center">
          <span className="mr-2">📥</span> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Attempts" value={data.stats.totalAttempts} icon="👥" color="blue" />
        <StatCard title="Average Score" value={data.stats.avgScore} icon="📊" color="green" subtitle={`Out of ${data.testInfo.totalMarks}`} />
        <StatCard title="Pass Rate" value={`${data.stats.passRate}%`} icon="✅" color="purple" />
        <StatCard title="Disqualified" value={data.stats.disqualified} icon="⚠️" color="red" />
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Question Success Rate</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.questionAnalysis} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="qId" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="successRate" fill="#10b981" name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Student Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`badge ${student.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{student.score}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.percentage}%</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{student.timeSpent} mins</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
