import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { BookOpenIcon, UserIcon, UserGroupIcon, CheckCircleIcon, ClockIcon, PlusIcon, ClipboardListIcon } from '../../components/Icons';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTests: 0, totalStudents: 0, avgScore: 0, activeTests: 0 });
  const [tests, setTests] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [testsRes, analyticsRes] = await Promise.all([
        api.get('/tests').catch(() => ({ data: [] })),
        api.get('/analytics/teacher').catch(() => ({ data: {} }))
      ]);

      const testList = testsRes.data || [];
      const anData = analyticsRes.data || {};

      setTests(testList);
      setStats({
        totalTests: testList.length,
        totalStudents: anData.totalStudents || 0,
        avgScore: Math.round(anData.averageClassScore || 0),
        activeTests: testList.filter((t) => t.isActive).length
      });
    } catch (err) {
      console.error('Error fetching teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTestStatus = async (testId, currentStatus) => {
    try {
      await api.patch(`/tests/${testId}/activate`, { isActive: !currentStatus });
      setTests((prev) =>
        prev.map((t) => (t.id === testId ? { ...t, isActive: !currentStatus } : t))
      );
    } catch (err) {
      console.error('Failed to toggle test status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Instructor Administration
            </span>
            {user?.department && (
              <span className="text-xs font-medium text-slate-500">
                • {user.department}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Faculty Overview, {user?.name || 'Professor'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional assessments, review student submissions, and inspect cohort analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/teacher/students')}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserGroupIcon className="w-4 h-4 text-blue-600" />
            <span>All Students</span>
          </button>
          <button
            onClick={() => navigate('/teacher/questions?mode=bulk')}
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ClipboardListIcon className="w-4 h-4 text-indigo-600" />
            <span>Bulk Paste Questions</span>
          </button>
          <button
            onClick={() => navigate('/teacher/create-test')}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
          <button
            onClick={() => navigate('/teacher/questions')}
            className="btn-secondary text-xs py-2 px-3.5"
          >
            Question Bank
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Published Tests"
          value={stats.totalTests}
          icon={<BookOpenIcon />}
          subtitle="Curated assessment suites"
          variant="primary"
        />
        <div 
          onClick={() => navigate('/teacher/students')} 
          className="cursor-pointer hover:scale-[1.01] transition-transform"
          title="View all students"
        >
          <StatCard
            title="Students Evaluated"
            value={stats.totalStudents}
            icon={<UserIcon />}
            subtitle="View student directory →"
            variant="purple"
          />
        </div>
        <StatCard
          title="Cohort Average"
          value={`${stats.avgScore}%`}
          icon={<CheckCircleIcon />}
          subtitle="Overall candidate accuracy"
          variant="success"
        />
        <StatCard
          title="Live Proctored"
          value={stats.activeTests}
          icon={<ClockIcon />}
          subtitle="Currently active for students"
          variant="warning"
        />
      </div>

      {/* Tests Management Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Departmental Assessments</h2>
            <p className="text-xs text-slate-500">All tests administered under your instructor account</p>
          </div>
          <button
            onClick={() => navigate('/teacher/create-test')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            + New Test
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">No tests created yet</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Create your first 45-minute assessment or select from the 45 authentic previous-year questions.
            </p>
            <button
              onClick={() => navigate('/teacher/create-test')}
              className="btn-primary text-xs py-2 px-4"
            >
              Create First Test
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Subject Topic</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {test.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {test.topic || test.subject}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {test.duration || 45} mins
                    </td>
                    <td className="py-3.5 px-4">
                      {test._count?.questions || test.questions?.length || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      {test._count?.attempts || test.attempts?.length || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleTestStatus(test.id, test.isActive)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                          test.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {test.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/teacher/tests/${test.id}/results`)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 mr-3"
                      >
                        View Results →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
