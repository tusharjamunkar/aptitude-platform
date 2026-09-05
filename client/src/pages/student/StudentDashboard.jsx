import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import TopicBadge from '../../components/TopicBadge';
import YouTubeCard from '../../components/YouTubeCard';
import { BookOpenIcon, ClockIcon, CheckCircleIcon, TrophyIcon, ShieldCheckIcon, AlertIcon } from '../../components/Icons';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ testsTaken: 0, avgScore: 0, completed: 0, accuracy: 0 });
  const [availableTests, setAvailableTests] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [recommendedVideos, setRecommendedVideos] = useState({});
  const [studyTips, setStudyTips] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch available tests
      const testsRes = await api.get('/tests/available').catch(() => ({ data: [] }));
      const testList = testsRes.data || [];
      setAvailableTests(testList);

      // Fetch student analytics
      const analyticsRes = await api.get('/analytics/student').catch(() => ({ data: {} }));
      const anData = analyticsRes.data || {};

      setStats({
        testsTaken: anData.totalAttempts || 0,
        avgScore: Math.round(anData.averageScore || 0),
        completed: anData.totalCompleted || 0,
        accuracy: anData.topicPerformance?.length
          ? Math.round(
              anData.topicPerformance.reduce((acc, t) => acc + (t.avgPercentage || 0), 0) /
                anData.topicPerformance.length
            )
          : 0
      });

      setRecentResults(anData.testHistory?.slice(0, 5) || []);
      
      const weakList = anData.weakTopics || [];
      setWeakTopics(weakList);

      // Fetch video recommendations specifically for the student's weak topics (top 2 weak topics)
      if (weakList.length > 0) {
        for (const topic of weakList.slice(0, 2)) {
          try {
            const ytRes = await api.get(`/youtube/${encodeURIComponent(topic)}`);
            if (ytRes.data) {
              setRecommendedVideos(prev => ({ ...prev, [topic]: ytRes.data.videos || [] }));
              setStudyTips(prev => ({ ...prev, [topic]: ytRes.data.studyTips || [] }));
            }
          } catch (e) {
            console.error('Failed to load videos for topic', topic, e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Student Welcome Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Student Assessment Portal
            </span>
            {user?.studyYear && (
              <span className="text-xs font-medium text-slate-500">
                • {user.studyYear}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name || 'Student'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.department || 'Department of Engineering'} {user?.rollNumber ? `| Roll No: ${user.rollNumber}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/analytics')}
            className="btn-secondary text-xs py-2 px-3.5"
          >
            Detailed Analytics
          </button>
          <button
            onClick={() => navigate('/student/history')}
            className="btn-primary text-xs py-2 px-3.5"
          >
            Test History
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assessments Taken"
          value={stats.testsTaken}
          icon={<BookOpenIcon />}
          subtitle="Total test attempts recorded"
          variant="primary"
        />
        <StatCard
          title="Average Score"
          value={`${stats.avgScore}%`}
          icon={<CheckCircleIcon />}
          subtitle="Across all completed tests"
          variant="success"
        />
        <StatCard
          title="Overall Accuracy"
          value={`${stats.accuracy}%`}
          icon={<TrophyIcon />}
          subtitle="Topic average proficiency"
          variant="warning"
        />
        <StatCard
          title="Active Tests"
          value={availableTests.length}
          icon={<ClockIcon />}
          subtitle="Available in catalog"
          variant="purple"
        />
      </div>

      {/* Available & Retake Assessments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Assigned Assessments & Practice Tests
            </h2>
            <p className="text-xs text-slate-500">
              45-minute timed examinations. You can retake completed tests anytime to improve your score.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {availableTests.length} Tests
          </span>
        </div>

        {loading ? (
          <div className="card p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading assessments...</p>
          </div>
        ) : availableTests.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">No assessments available</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Check back soon when instructors publish active examinations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableTests.map((test) => {
              const previousAttempts = test.attempts || [];
              const hasCompleted = previousAttempts.some(a => a.status === 'COMPLETED');
              const latestAttempt = previousAttempts[0];
              const latestPct = latestAttempt && latestAttempt.totalMarks > 0
                ? Math.round((latestAttempt.score / latestAttempt.totalMarks) * 100)
                : null;

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                        {test.subject || 'Aptitude'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{test.duration || 45} mins</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5 line-clamp-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {test.description || 'Standard timed examination with automated scoring and anti-cheat tracking.'}
                    </p>

                    {/* Attempt Status Badge */}
                    {hasCompleted && (
                      <div className="mb-4 p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Attempts: <strong className="text-slate-800">{previousAttempts.length}</strong>
                        </span>
                        <span className="text-slate-500">
                          Last Score: <strong className={latestPct >= 60 ? 'text-emerald-600' : 'text-rose-600'}>{latestPct}%</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Proctored</span>
                    </div>

                    {hasCompleted ? (
                      <button
                        onClick={() => navigate(`/take-test/${test.id}`)}
                        className="btn-secondary text-xs py-2 px-3.5 font-semibold text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        🔄 Retake Test
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/take-test/${test.id}`)}
                        className="btn-primary text-xs py-2 px-4"
                      >
                        Start Test
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Areas to Improve & Recommended Videos Section */}
      {weakTopics.length > 0 && (
        <div className="space-y-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-6 rounded-2xl border border-amber-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Areas You Need to Improve (Targeted Video Lessons)
                </h2>
                <p className="text-xs text-slate-600">
                  Based on your incorrect questions, we prioritized learning lectures exclusively for your weakest subjects.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/analytics')}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              View All Topics →
            </button>
          </div>

          <div className="space-y-6">
            {weakTopics.slice(0, 2).map((topic) => (
              <div key={topic} className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <h3 className="text-sm font-bold text-slate-900">
                      Weak Topic Focus: {topic}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/70">
                    Needs Revision (&lt;60% Accuracy)
                  </span>
                </div>

                {studyTips[topic] && studyTips[topic].length > 0 && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                    <strong className="text-slate-800 font-semibold block mb-1">Key Revision Tips:</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {studyTips[topic].slice(0, 2).map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(recommendedVideos[topic] || []).slice(0, 3).map((vid) => (
                    <YouTubeCard key={vid.id} video={vid} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Submissions List with Retake Option */}
      {recentResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Test Submissions & History</h2>
              <p className="text-xs text-slate-500">Review your past performance logs or retake tests anytime</p>
            </div>
            <button
              onClick={() => navigate('/student/history')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Full History →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Assessment</th>
                  <th className="py-2.5 px-4">Attempt #</th>
                  <th className="py-2.5 px-4">Topic</th>
                  <th className="py-2.5 px-4">Score</th>
                  <th className="py-2.5 px-4">Percentage</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentResults.map((res, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{res.testTitle}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Attempt {res.attemptNumber || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{res.topic}</td>
                    <td className="py-3 px-4">
                      {res.score} / {res.totalMarks}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${res.percentage >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {res.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        res.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/take-test/${res.testId}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Retake →
                      </button>
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
