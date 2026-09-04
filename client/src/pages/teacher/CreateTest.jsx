import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const TOPICS = [
  "Mixed", "Number System", "Percentages", "Logical Reasoning", "Data Interpretation"
];

export default function CreateTest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  
  const [testData, setTestData] = useState({
    title: '',
    topic: 'Mixed',
    description: '',
    duration: 45,
    scheduledFor: '',
    deadline: '',
    isMandatory: false,
    strictness: 'moderate', // low, moderate, high
    selectedQuestions: []
  });

  useEffect(() => {
    if (step === 2 && availableQuestions.length === 0) {
      // Mock fetching questions for step 2
      setTimeout(() => {
        setAvailableQuestions([
          { _id: '1', text: 'If 20% of a = b, then b% of 20 is the same as:', topic: 'Percentages', difficulty: 'Medium', marks: 2 },
          { _id: '2', text: 'A train running at 60 km/hr crosses a pole in 9s.', topic: 'Time Speed', difficulty: 'Easy', marks: 1 },
          { _id: '3', text: 'Next number in series: 2, 6, 12, 20, ?', topic: 'Logical Reasoning', difficulty: 'Easy', marks: 1 },
          { _id: '4', text: 'Find the odd one out: 3, 5, 11, 14, 17, 21', topic: 'Logical Reasoning', difficulty: 'Medium', marks: 2 },
          { _id: '5', text: 'Data sufficiency: Is x > y?', topic: 'Data Interpretation', difficulty: 'Hard', marks: 3 },
        ]);
      }, 500);
    }
  }, [step]);

  const toggleQuestionSelection = (question) => {
    const isSelected = testData.selectedQuestions.some(q => q._id === question._id);
    if (isSelected) {
      setTestData({
        ...testData,
        selectedQuestions: testData.selectedQuestions.filter(q => q._id !== question._id)
      });
    } else {
      setTestData({
        ...testData,
        selectedQuestions: [...testData.selectedQuestions, question]
      });
    }
  };

  const handleCreateTest = async () => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Test created successfully! 🎉', { duration: 4000 });
      navigate('/teacher');
    }, 1500);
  };

  const totalMarks = testData.selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Create New Test 🚀</h1>
        <p className="text-slate-500 font-medium">Design an assessment in 3 easy steps</p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full -z-10 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
          
          {[
            { num: 1, label: 'Test Info' },
            { num: 2, label: 'Questions' },
            { num: 3, label: 'Review' }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-white px-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 ${step > s.num ? 'bg-emerald-500 border-emerald-500 text-white' : step === s.num ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.num ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        
        {/* STEP 1: Info */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span>📋</span> Basic Information</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Test Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="input-field text-lg font-bold" 
                placeholder="e.g. Midterm Aptitude Assessment"
                value={testData.title}
                onChange={e => setTestData({...testData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Topic Focus</label>
                <select 
                  className="input-field"
                  value={testData.topic}
                  onChange={e => setTestData({...testData, topic: e.target.value})}
                >
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                  <span>Duration</span>
                  <span className="text-indigo-600">{testData.duration} minutes</span>
                </label>
                <input 
                  type="range" 
                  min="10" max="180" step="5"
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3"
                  value={testData.duration}
                  onChange={e => setTestData({...testData, duration: parseInt(e.target.value)})}
                />
                <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                  <span>10m</span>
                  <span>180m</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Instructions / Description</label>
              <textarea 
                rows="3" 
                className="input-field resize-none"
                placeholder="Enter instructions for students..."
                value={testData.description}
                onChange={e => setTestData({...testData, description: e.target.value})}
              ></textarea>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setStep(2)} 
                disabled={!testData.title}
                className="btn-primary px-8 py-3 text-lg"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Questions */}
        {step === 2 && (
          <div className="p-8 flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span>🧩</span> Select Questions</h2>
              <div className="relative">
                <input type="text" placeholder="Search questions..." className="input-field py-2 pl-10 pr-4 text-sm w-64" />
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {availableQuestions.map(q => {
                const isSelected = testData.selectedQuestions.some(sq => sq._id === q._id);
                return (
                  <div 
                    key={q._id} 
                    onClick={() => toggleQuestionSelection(q)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex gap-4 ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                  >
                    <div className="pt-1">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300'}`}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded">{q.topic}</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{q.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 mt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-4">
                <span>{testData.selectedQuestions.length} Selected</span>
                <span className="w-px h-4 bg-slate-700"></span>
                <span className="text-indigo-400">{totalMarks} Total Marks</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary py-2.5">← Back</button>
                <button 
                  onClick={() => setStep(3)} 
                  disabled={testData.selectedQuestions.length === 0}
                  className="btn-primary py-2.5 px-8"
                >
                  Review →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><span>👀</span> Final Review</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-4">Test Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-bold text-slate-500 mb-1">Title</dt>
                    <dd className="text-lg font-bold text-slate-800">{testData.title}</dd>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <dt className="text-xs font-bold text-slate-500 mb-1">Topic</dt>
                      <dd className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">{testData.topic}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-slate-500 mb-1">Duration</dt>
                      <dd className="font-bold text-slate-800 flex items-center gap-1">⏱️ {testData.duration} mins</dd>
                    </div>
                  </div>
                </dl>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
                 <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-4">Assessment Value</h3>
                 <div className="text-5xl font-black text-indigo-600 mb-2">{testData.selectedQuestions.length}</div>
                 <p className="text-slate-600 font-medium mb-4">Questions Selected</p>
                 <div className="inline-block bg-slate-200 text-slate-700 font-bold px-4 py-1.5 rounded-full text-sm">
                   Total: {totalMarks} Marks
                 </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setStep(2)} className="btn-secondary">← Edit Questions</button>
              <button 
                onClick={handleCreateTest} 
                disabled={loading}
                className="btn-primary py-4 px-10 text-lg flex items-center gap-2 shadow-indigo-500/30"
              >
                {loading ? (
                   <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Publishing...</>
                ) : '🚀 Publish Test Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
