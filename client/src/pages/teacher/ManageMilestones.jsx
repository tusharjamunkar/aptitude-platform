import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '../../components/Icons';

export default function ManageMilestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    requiredTestsCount: 1,
    badgeName: '',
    badgeIcon: '🏆',
    minAverageScore: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const res = await api.get('/milestones');
      setMilestones(res.data);
    } catch (err) {
      console.error('Failed to load milestones', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this milestone achievement?')) return;
    try {
      await api.delete(`/milestones/${id}`);
      setMilestones(prev => prev.filter(m => m.id !== id));
      toast.success('Milestone removed successfully');
    } catch (err) {
      toast.error('Failed to delete milestone');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.badgeName) {
      toast.error('Title and badge name are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/milestones', {
        ...form,
        requiredTestsCount: parseInt(form.requiredTestsCount, 10),
        minAverageScore: parseFloat(form.minAverageScore || 0)
      });
      setMilestones(prev => [...prev, res.data]);
      setIsModalOpen(false);
      setForm({
        title: '',
        description: '',
        requiredTestsCount: 1,
        badgeName: '',
        badgeIcon: '🏆',
        minAverageScore: 0
      });
      toast.success('Milestone created successfully');
    } catch (err) {
      toast.error('Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Milestone Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure progressive achievement badges to motivate student test completion.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {milestones.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-colors">
            <button
              onClick={() => handleDelete(m.id)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="Delete milestone"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl mx-auto mb-4">
              {m.badgeIcon || '🏆'}
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-1">{m.title}</h3>
            <p className="text-xs text-slate-500 text-center mb-4 min-h-[32px] line-clamp-2">{m.description || 'Awarded upon reaching test target.'}</p>
            
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500 font-medium">Requirement Target</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {m.requiredTestsCount} Completed {m.requiredTestsCount === 1 ? 'Test' : 'Tests'}
                {m.minAverageScore > 0 && ` (≥${m.minAverageScore}% avg)`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Achievement Milestone</h2>
            <p className="text-xs text-slate-500 mb-5">Set target tests and criteria for students to unlock this badge.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Aptitude Scholar"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief criterion explanation"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Badge Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Scholar"
                    value={form.badgeName}
                    onChange={e => setForm({ ...form, badgeName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Badge Icon (Emoji)</label>
                  <input
                    type="text"
                    required
                    placeholder="🎖️"
                    value={form.badgeIcon}
                    onChange={e => setForm({ ...form, badgeIcon: e.target.value })}
                    className="input-field text-center text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Required Tests</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.requiredTestsCount}
                    onChange={e => setForm({ ...form, requiredTestsCount: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Min Avg Score %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.minAverageScore}
                    onChange={e => setForm({ ...form, minAverageScore: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
