import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import YouTubeCard from '../../components/YouTubeCard';
import TopicBadge from '../../components/TopicBadge';

export default function StudentAnalytics() {
  const [data, setData] = useState({
    stats: {}, trendData: [], radarData: [], topics: [], recommendations: {}
  });

  useEffect(() => {
    // Mock Data
    setData({
      stats: { avgScore: 72, testsCompleted: 15, bestScore: 95, masteredTopics: 4 },
      trendData: [
        { name: 'T1', score: 60 }, { name: 'T2', score: 65 }, { name: 'T3', score: 80 }, 
        { name: 'T4', score: 75 }, { name: 'T5', score: 85 }
      ],
      radarData: [
        { topic: 'Number System', A: 90 }, { topic: 'Percentages', A: 75 }, 
        { topic: 'Algebra', A: 50 }, { topic: 'Geometry', A: 65 }, { topic: 'Logical', A: 85 }
      ],
      topics: [
        { name: 'Number System', avgScore: 90, attempted: 50 },
        { name: 'Percentages', avgScore: 75, attempted: 30 },
        { name: 'Algebra', avgScore: 50, attempted: 45 },
        { name: 'Geometry', avgScore: 65, attempted: 20 },
      ],
      recommendations: {
        'Algebra': [
          { videoId: 'NybHckSEQBI', title: 'Algebra Basics: What Is Algebra? - Math Antics', channelTitle: 'mathantics', duration: '12:05' },
          { videoId: 'LwCRRUa8yTU', title: 'Algebra - Basic Algebra Lessons for Beginners', channelTitle: 'ultimatealgebra', duration: '15:20' }
        ]
      }
    });
  }, []);

  const weakTopics = data.topics.filter(t => t.avgScore < 60);
  const strongTopics = data.topics.filter(t => t.avgScore >= 80);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-500">Track your progress and identify areas for improvement.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Average Score" value={`${data.stats.avgScore}%`} icon="📊" color="blue" />
        <StatCard title="Tests Completed" value={data.stats.testsCompleted} icon="✅" color="green" />
        <StatCard title="Best Score" value={`${data.stats.bestScore}%`} icon="🏆" color="yellow" />
        <StatCard title="Mastered Topics" value={data.stats.masteredTopics} icon="⭐" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Performance Over Time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Topic Strengths</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="topic" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="My Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="text-2xl mr-2">🎯</span> Focus Areas (Weak Topics)
        </h2>
        {weakTopics.length === 0 ? (
          <div className="card text-center text-green-600 font-medium py-8">Great job! You don't have any significantly weak topics right now.</div>
        ) : (
          weakTopics.map(topic => (
            <div key={topic.name} className="card border-t-4 border-t-red-500 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">{topic.name}</h3>
                <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-200">Avg: {topic.avgScore}%</span>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">What to Study:</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>Review basic formulas and concepts</li>
                  <li>Practice easier questions to build confidence</li>
                  <li>Watch the recommended video tutorials below</li>
                </ul>
              </div>

              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">📺 Recommended Videos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.recommendations[topic.name]?.map((video, idx) => (
                  <YouTubeCard key={idx} video={video} />
                ))}
                {!data.recommendations[topic.name] && <p className="text-gray-500 italic">No videos available.</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card bg-green-50/50 border-green-100">
        <h2 className="text-xl font-bold text-green-800 flex items-center mb-4">
          <span className="text-2xl mr-2">💪</span> Strong Topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {strongTopics.map(t => (
            <div key={t.name} className="bg-white border border-green-200 px-4 py-2 rounded-lg shadow-sm flex flex-col items-center min-w-[120px]">
              <span className="font-semibold text-gray-800">{t.name}</span>
              <span className="text-green-600 font-bold text-lg">{t.avgScore}%</span>
            </div>
          ))}
          {strongTopics.length === 0 && <span className="text-gray-500">Keep practicing to build your strong topics!</span>}
        </div>
      </div>
    </div>
  );
}
