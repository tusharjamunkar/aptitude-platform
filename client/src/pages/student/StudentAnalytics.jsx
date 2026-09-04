import React, { useState, useEffect } from 'react';
import StatCard from '../../components/StatCard';
import YouTubeCard from '../../components/YouTubeCard';
import TopicBadge from '../../components/TopicBadge';

export default function StudentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setAnalytics({
        overallScore: 78,
        testsDone: 15,
        bestScore: 95,
        topicsMastered: 4,
        topicPerformance: [
          { topic: 'Number System', avg: 85, trend: '+5%' },
          { topic: 'Percentages', avg: 92, trend: '+12%' },
          { topic: 'Logical Reasoning', avg: 65, trend: '-2%' },
          { topic: 'Data Interpretation', avg: 58, trend: '+1%' },
          { topic: 'Time Speed Distance', avg: 45, trend: '-8%' },
        ],
        weakTopics: [
          {
            name: 'Time Speed Distance',
            score: 45,
            tips: ['Focus on relative speed concepts', 'Practice conversions between km/hr and m/s', 'Draw diagrams for train problems'],
            videos: [
              { id: '1', title: 'Time Speed Distance Masterclass', channel: 'Aptitude Ninja', duration: '45:20', views: '1.2M', thumb: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=500&q=80' },
              { id: '2', title: 'Relative Speed Shortcuts', channel: 'Math Tricks', duration: '12:05', views: '450K', thumb: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500&q=80' }
            ]
          },
          {
            name: 'Data Interpretation',
            score: 58,
            tips: ['Improve fast calculation techniques', 'Learn to approximate percentages quickly'],
            videos: [
              { id: '3', title: 'Pie Charts Explained', channel: 'Data Mastery', duration: '20:15', views: '800K', thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80' }
            ]
          }
        ]
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
            📊 My Performance
          </h1>
          <p className="text-slate-500 font-medium">Detailed breakdown of your aptitude journey</p>
        </div>
        <div className="flex items-center gap-4 bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100">
          <div className="text-slate-600 font-bold text-sm uppercase tracking-wider">Overall Score</div>
          <div className="text-4xl font-black text-indigo-700">{analytics.overallScore}%</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tests Taken" value={analytics.testsDone} icon="📝" gradient="blue" />
        <StatCard title="Best Score" value={`${analytics.bestScore}%`} icon="🌟" gradient="green" />
        <StatCard title="Topics Mastered" value={analytics.topicsMastered} icon="🎓" gradient="purple" subtitle="Score > 80%" />
        <StatCard title="Needs Work" value={analytics.weakTopics.length} icon="🎯" gradient="orange" subtitle="Score < 60%" />
      </div>

      {/* Topics Breakdown */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">🔍 Topic Breakdown</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase font-bold text-slate-400 border-b border-slate-100">
                  <th className="pb-3 pl-2">Topic</th>
                  <th className="pb-3">Average Score</th>
                  <th className="pb-3">Performance</th>
                  <th className="pb-3 text-right pr-2">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analytics.topicPerformance.map((topic, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-2 font-bold text-slate-700">{topic.topic}</td>
                    <td className="py-4 font-bold text-slate-800 text-lg">{topic.avg}%</td>
                    <td className="py-4">
                      <TopicBadge percentage={topic.avg} />
                    </td>
                    <td className={`py-4 pr-2 text-right font-bold ${topic.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                      {topic.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Weak Topics Section - The most important part */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <span className="text-red-500">🎯</span> Improve These Topics
        </h2>
        
        {analytics.weakTopics.map((topic, idx) => (
          <div key={idx} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Topic Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
              <div>
                <div className="text-red-100 text-sm font-bold uppercase tracking-wider mb-1">Needs Attention</div>
                <h3 className="text-2xl md:text-3xl font-black">{topic.name}</h3>
              </div>
              <div className="bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                <span className="text-red-100 font-medium">Current Avg:</span>
                <span className="text-3xl font-black">{topic.score}%</span>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Study Tips */}
              <div className="lg:col-span-1">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>💡</span> What to focus on:
                </h4>
                <ul className="space-y-3">
                  {topic.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-6 w-full btn-secondary py-3 text-sm flex items-center justify-center gap-2">
                  <span>📝</span> Take Practice Test
                </button>
              </div>

              {/* Recommended Videos */}
              <div className="lg:col-span-2">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📺</span> Recommended Lessons
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topic.videos.map(video => (
                    <YouTubeCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
