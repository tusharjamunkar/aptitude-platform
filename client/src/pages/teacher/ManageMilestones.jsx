import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ManageMilestones() {
  const [milestones, setMilestones] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', requiredTestsCount: 1, badgeName: '', badgeIcon: '🏆', minAverageScore: 50
  });

  useEffect(() => {
    // Mock fetch
    setMilestones([
      { id: '1', title: 'Novice Tester', description: 'Complete your first 3 tests', requiredTestsCount: 3, badgeIcon: '🥉', badgeName: 'Bronze', minAverageScore: 40, studentsAchieved: 120 },
      { id: '2', title: 'Aptitude Pro', description: 'Maintain 80%+ over 10 tests', requiredTestsCount: 10, badgeIcon: '🏅', badgeName: 'Gold', minAverageScore: 80, studentsAchieved: 15 }
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMilestones([...milestones, { ...formData, id: Date.now().toString(), studentsAchieved: 0 }]);
    toast.success('Milestone created');
    setFormData({ title: '', description: '', requiredTestsCount: 1, badgeName: '', badgeIcon: '🏆', minAverageScore: 50 });
  };

  const handleDelete = (id) => {
    setMilestones(milestones.filter(m => m.id !== id));
    toast.success('Milestone deleted');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Milestones</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card h-fit">
          <h2 className="text-lg font-semibold mb-4">Create Milestone</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium">Title</label><input required type="text" className="input-field mt-1" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})}/></div>
            <div><label className="block text-sm font-medium">Description</label><textarea required className="input-field mt-1" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium">Required Tests</label><input required type="number" min="1" className="input-field mt-1" value={formData.requiredTestsCount} onChange={e=>setFormData({...formData, requiredTestsCount: e.target.value})}/></div>
              <div><label className="block text-sm font-medium">Min Avg Score</label><input required type="number" min="0" max="100" className="input-field mt-1" value={formData.minAverageScore} onChange={e=>setFormData({...formData, minAverageScore: e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-sm font-medium">Badge Name</label><input required type="text" className="input-field mt-1" value={formData.badgeName} onChange={e=>setFormData({...formData, badgeName: e.target.value})}/></div>
              <div><label className="block text-sm font-medium">Badge Emoji</label><input required type="text" className="input-field mt-1 text-2xl text-center" value={formData.badgeIcon} onChange={e=>setFormData({...formData, badgeIcon: e.target.value})}/></div>
            </div>
            <button type="submit" className="btn-primary w-full">Create</button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Existing Milestones</h2>
          {milestones.map(m => (
            <div key={m.id} className="card flex items-center justify-between p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{m.badgeIcon}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{m.title} <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2">{m.badgeName}</span></h3>
                  <p className="text-sm text-gray-600">{m.description}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">Criteria: {m.requiredTestsCount} tests @ {m.minAverageScore}% avg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{m.studentsAchieved} <span className="text-gray-500 font-normal">students</span></p>
                <button onClick={() => handleDelete(m.id)} className="text-danger-500 text-sm hover:underline mt-2">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
