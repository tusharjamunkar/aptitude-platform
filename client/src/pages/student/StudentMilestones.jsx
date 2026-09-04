import { useState, useEffect } from 'react';

export default function StudentMilestones() {
  const [milestones, setMilestones] = useState([]);
  
  useEffect(() => {
    // Mock Data
    setMilestones([
      { id: '1', title: 'First Steps', description: 'Complete your first test', required: 1, current: 1, badgeIcon: '🥚', status: 'ACHIEVED', date: '2023-10-01' },
      { id: '2', title: 'Novice Tester', description: 'Complete 5 tests', required: 5, current: 5, badgeIcon: '🥉', status: 'ACHIEVED', date: '2023-10-15' },
      { id: '3', title: 'Consistency is Key', description: 'Complete 10 tests', required: 10, current: 7, badgeIcon: '🥈', status: 'IN_PROGRESS' },
      { id: '4', title: 'Aptitude Pro', description: 'Maintain 80% over 10 tests', required: 10, current: 7, avgScore: 82, badgeIcon: '🥇', status: 'IN_PROGRESS' },
      { id: '5', title: 'Grandmaster', description: 'Complete 50 tests', required: 50, current: 7, badgeIcon: '👑', status: 'LOCKED' }
    ]);
  }, []);

  const achievedCount = milestones.filter(m => m.status === 'ACHIEVED').length;
  const progressPercent = Math.round((achievedCount / milestones.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Milestone Journey</h1>
        <p className="text-lg text-gray-500">Collect badges as you improve your aptitude skills.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-end mb-2">
          <span className="font-semibold text-gray-700">Overall Progress</span>
          <span className="text-2xl font-bold text-primary-600">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4">
          <div className="bg-gradient-to-r from-primary-500 to-indigo-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="text-center mt-4 text-sm font-medium text-gray-600">
          {progressPercent === 100 ? "Incredible! You've collected all badges." : "Keep going! You're doing great."}
        </p>
      </div>

      <div className="space-y-4">
        {milestones.map((m, idx) => (
          <div key={m.id} className={`card flex items-center p-6 relative overflow-hidden transition-all ${
            m.status === 'ACHIEVED' ? 'border-l-4 border-l-green-500 bg-green-50/10' : 
            m.status === 'IN_PROGRESS' ? 'border-l-4 border-l-blue-500 shadow-md' : 'opacity-70 grayscale'
          }`}>
            <div className="text-5xl mr-6 z-10">{m.badgeIcon}</div>
            
            <div className="flex-1 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-xl font-bold ${m.status === 'LOCKED' ? 'text-gray-600' : 'text-gray-900'}`}>{m.title}</h3>
                  <p className="text-gray-600 mt-1">{m.description}</p>
                </div>
                {m.status === 'ACHIEVED' && (
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                    ✓ Achieved {m.date && `on ${new Date(m.date).toLocaleDateString()}`}
                  </span>
                )}
                {m.status === 'LOCKED' && <span className="text-gray-400 text-sm font-medium">🔒 Locked</span>}
              </div>

              {m.status !== 'ACHIEVED' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{m.current} / {m.required}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${m.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-400'}`} style={{ width: `${(m.current/m.required)*100}%` }}></div>
                  </div>
                  {m.avgScore && <p className="text-xs text-gray-500 mt-2">Current Avg Score: {m.avgScore}%</p>}
                </div>
              )}
            </div>
            
            {/* Decorative background for achieved items */}
            {m.status === 'ACHIEVED' && (
              <div className="absolute right-[-20px] top-[-20px] text-9xl opacity-5 select-none">{m.badgeIcon}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
