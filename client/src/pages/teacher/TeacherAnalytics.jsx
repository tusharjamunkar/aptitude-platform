import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../api/axios';
import TopicBadge from '../../components/TopicBadge';

export default function TeacherAnalytics() {
  const [data, setData] = useState({
    radarData: [], trendData: [], atRiskStudents: [], topPerformers: [], topicWeakness: []
  });

  useEffect(() => {
    // Mock data for analytics
    setData({
      radarData: [
        { topic: 'Number System', A: 80 }, { topic: 'Algebra', A: 60 }, { topic: 'Geometry', A: 75 },
        { topic: 'Reasoning', A: 90 }, { topic: 'Data Int.', A: 65 }
      ],
      trendData: [
        { name: 'Test 1', avg: 65 }, { name: 'Test 2', avg: 68 }, { name: 'Test 3', avg: 72 }, { name: 'Test 4', avg: 75 }
      ],
      atRiskStudents: [
        { name: 'Alice Smith', avgScore: 42, weakTopics: ['Geometry', 'Data Int.'] },
        { name: 'Bob Johnson', avgScore: 48, weakTopics: ['Algebra'] }
      ],
      topPerformers: [
        { name: 'Charlie Brown', avgScore: 95, strongTopics: ['All'] },
        { name: 'Diana Prince', avgScore: 92, strongTopics: ['Reasoning', 'Geometry'] }
      ],
      topicWeakness: [
        { topic: 'Algebra', avgScore: 60, questionsFailed: 120 },
        { topic: 'Data Int.', avgScore: 65, questionsFailed: 95 }
      ]
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Class Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Overall Topic Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="topic" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Class Average" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Performance Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} name="Avg Score %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-red-200 bg-red-50/30">
          <h2 className="text-lg font-semibold text-red-800 mb-4 flex items-center"><span className="mr-2">⚠️</span> At-Risk Students (&lt; 50%)</h2>
          <ul className="space-y-3">
            {data.atRiskStudents.map((s, i) => (
              <li key={i} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-red-100">
                <div><p className="font-medium">{s.name}</p><p className="text-xs text-gray-500">Weak: {s.weakTopics.join(', ')}</p></div>
                <span className="font-bold text-red-600">{s.avgScore}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card border-green-200 bg-green-50/30">
          <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center"><span className="mr-2">⭐</span> Top Performers</h2>
          <ul className="space-y-3">
            {data.topPerformers.map((s, i) => (
              <li key={i} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-green-100">
                <div><p className="font-medium">{s.name}</p><p className="text-xs text-gray-500">Strong: {s.strongTopics.join(', ')}</p></div>
                <span className="font-bold text-green-600">{s.avgScore}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Topic Weakness Heatmap</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Topic</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Avg Score</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Questions Failed</th>
            </tr>
          </thead>
          <tbody>
            {data.topicWeakness.map((t, i) => (
              <tr key={i}>
                <td className="px-4 py-2">{t.topic}</td>
                <td className="px-4 py-2"><TopicBadge topic="Score" percentage={t.avgScore} /></td>
                <td className="px-4 py-2 text-gray-600">{t.questionsFailed} times</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
