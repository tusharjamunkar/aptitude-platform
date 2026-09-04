import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ManageMilestones() {
  const [milestones, setMilestones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMilestones([
      { id: 1, title: 'Novice', desc: 'Complete first test', required: 1, icon: '🥚', usersAchieved: 120 },
      { id: 2, title: 'Apprentice', desc: 'Complete 5 tests', required: 5, icon: '🐣', usersAchieved: 85 },
      { id: 3, title: 'Scholar', desc: 'Score >80% on 3 tests', required: 3, icon: '🎓', usersAchieved: 45 },
    ]);
  }, []);

  const handleDelete = (id) => {
    if(window.confirm('Delete this milestone?')) {
      setMilestones(milestones.filter(m => m.id !== id));
      toast.success('Milestone deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🏆 Manage Milestones</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Configure achievements for students</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          ➕ Add Milestone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {milestones.map(m => (
          <div key={m.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative group">
            <button onClick={() => handleDelete(m.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
            <div className="text-5xl mb-4 bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-md mx-auto -mt-10">{m.icon}</div>
            <h3 className="text-xl font-bold text-center text-slate-800 mb-1">{m.title}</h3>
            <p className="text-slate-500 text-sm text-center font-medium mb-4">{m.desc}</p>
            <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl text-center">
              <div className="font-bold text-lg">{m.usersAchieved}</div>
              <div className="text-xs uppercase tracking-wider font-semibold">Students Achieved</div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Milestone</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Title (e.g. Master)" className="input-field" />
              <input type="text" placeholder="Description" className="input-field" />
              <input type="text" placeholder="Emoji Icon 👑" className="input-field" />
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => { setIsModalOpen(false); toast.success('Added'); }} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
