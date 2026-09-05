import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import TopicBadge from '../../components/TopicBadge';
import YouTubeCard from '../../components/YouTubeCard';
import { ChartIcon, TrophyIcon, CheckCircleIcon, BookOpenIcon, AlertIcon } from '../../components/Icons';

export default function StudentAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weakTopicVideos, setWeakTopicVideos] = useState({});
  const [weakTopicTips, setWeakTopicTips] = useState({});

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/student');
      const data = res.data || {};
      setAnalytics(data);

      // Only recommend videos for weak topics (<60%), strictly sorted weakest-first
      const weakList = data.weakTopics || [];
      const topicsToFetch = weakList.slice(0, 4);
      
      const vMap = {};
      const tMap = {};
      for (const topic of topicsToFetch) {
        try {
          const ytRes = await api.get(`/youtube/${encodeURIComponent(topic)}`);
          if (ytRes.data) {
            vMap[topic] = ytRes.data.videos || [];
            tMap[topic] = ytRes.data.studyTips || [];
          }
        } catch (e) {
          console.error('Error fetching videos for weak topic', topic, e);
        }
      }
      setWeakTopicVideos(vMap);
      setWeakTopicTips(tMap);
    } catch (err) {
      console.error('Error fetching student analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Compiling performance analytics...</p>
      </div>
    );
  }

  const topicData = (analytics?.topicPerformance || []).map((t) => ({
    topic: t.topic,
    score: Math.round(t.avgPercentage || 0)
  }));

  const trendData = (analytics?.testHistory || []).map((t, idx) => ({
    name: `Test ${idx + 1}`,
    score: t.percentage || 0
  })).reverse();

  const weakTopics = analytics?.weakTopics || [];
  const strongTopics = analytics?.strongTopics || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Performance Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed breakdown of your strengths, weak areas, and recommended video study materials
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Score"
          value={`${Math.round(analytics?.averageScore || 0)}%`}
          icon={<CheckCircleIcon />}
          subtitle="Cumulative assessment score"
          variant="primary"
        />
        <StatCard
          title="Tests Completed"
          value={analytics?.totalCompleted || 0}
          icon={<BookOpenIcon />}
          subtitle="Evaluated submissions"
          variant="success"
        />
        <StatCard
          title="Topics Mastered"
          value={strongTopics.length}
          icon={<TrophyIcon />}
          subtitle="Score ≥ 80% accuracy"
          variant="warning"
        />
        <StatCard
          title="Focus Areas"
          value={weakTopics.length}
          icon={<AlertIcon />}
          subtitle="Score < 60% threshold"
          variant="danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Progression Trend */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Score Progression Over Time</h3>
          <p className="text-xs text-slate-500 mb-4">Percentage score across sequential tests</p>

          <div className="h-64">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score %"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Complete more tests to visualize progression trends.
              </div>
            )}
          </div>
        </div>

        {/* Topic Mastery Radar */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Topic Proficiency Radar</h3>
          <p className="text-xs text-slate-500 mb-4">Relative accuracy distribution by syllabus topic</p>

          <div className="h-64">
            {topicData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={topicData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="topic" stroke="#64748b" fontSize={10} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#cbd5e1" fontSize={9} />
                  <Radar
                    name="Proficiency %"
                    dataKey="score"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Take tests spanning multiple topics to view radar analysis.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weak Areas & Curated YouTube Video Lessons */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Recommended Video Tutorials & Study Tips
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Targeted lectures and shortcuts to strengthen performance in weak examination areas
        </p>

        {Object.keys(weakTopicVideos).length === 0 ? (
          <div className="card p-8 text-center text-xs text-slate-500">
            No critical weak topics detected. Great job!
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(weakTopicVideos).map((topic) => (
              <div key={topic} className="card border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      Topic Improvement Required
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 capitalize">{topic}</h3>
                  </div>

                  {/* Study Tips Pills */}
                  {weakTopicTips[topic] && weakTopicTips[topic].length > 0 && (
                    <div className="text-xs text-slate-600 space-y-1">
                      <span className="font-semibold text-slate-800 text-[11px] block">Key Shortcuts:</span>
                      <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                        {weakTopicTips[topic].slice(0, 2).map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Verified YouTube Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(weakTopicVideos[topic] || []).map((video) => (
                    <YouTubeCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comprehensive Topic Table */}
      {analytics?.topicPerformance?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Topic-Wise Performance Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Complete mastery audit across all attempted questions</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Subject Topic</th>
                  <th className="py-2.5 px-4">Questions Attempted</th>
                  <th className="py-2.5 px-4">Correct Answers</th>
                  <th className="py-2.5 px-4">Accuracy %</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {analytics.topicPerformance.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{t.topic}</td>
                    <td className="py-3 px-4">{t.totalQuestions}</td>
                    <td className="py-3 px-4">{t.correctAnswers}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {Math.round(t.avgPercentage)}%
                    </td>
                    <td className="py-3 px-4">
                      <TopicBadge topic={t.topic} percentage={Math.round(t.avgPercentage)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
