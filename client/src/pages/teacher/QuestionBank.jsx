import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const TOPICS = [
  "Number System", "Percentages", "Profit and Loss", "Simple Interest", "Compound Interest",
  "Time and Work", "Time Speed Distance", "Ratio and Proportion", "Averages", "Ages",
  "Probability", "Permutations and Combinations", "Data Interpretation", "Logical Reasoning",
  "Verbal Ability", "Coding Decoding", "Blood Relations", "Syllogisms", "Directions",
  "Clocks", "Calendars", "Mixtures and Alligation", "Pipes and Cisterns", "Trains", "Boats and Streams"
];

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(getInitialQuestionState());

  function getInitialQuestionState() {
    return {
      text: '',
      topic: TOPICS[0],
      difficulty: 'Medium',
      marks: 1,
      options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
      correctAnswer: 'A',
      explanation: ''
    };
  }

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      setQuestions([
        { _id: '1', text: 'If 20% of a = b, then b% of 20 is the same as:', topic: 'Percentages', difficulty: 'Medium', marks: 2, correctAnswer: 'A', options: [{id:'A', text:'4% of a'}, {id:'B', text:'5% of a'}, {id:'C', text:'20% of a'}, {id:'D', text:'None'}] },
        { _id: '2', text: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?', topic: 'Trains', difficulty: 'Easy', marks: 1, correctAnswer: 'D', options: [{id:'A', text:'120 m'}, {id:'B', text:'180 m'}, {id:'C', text:'324 m'}, {id:'D', text:'150 m'}] },
        { _id: '3', text: 'In a certain code language, "COMPUTER" is written as "RFUVQNPC". How is "MEDICINE" written in that code?', topic: 'Coding Decoding', difficulty: 'Hard', marks: 3, correctAnswer: 'A', options: [{id:'A', text:'EOJDJEFM'}, {id:'B', text:'EOJDEJFM'}, {id:'C', text:'MFEJDJOE'}, {id:'D', text:'MFEDJJOE'}] }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleOpenModal = (q = null) => {
    if (q) setCurrentQuestion(q);
    else setCurrentQuestion(getInitialQuestionState());
    setIsModalOpen(true);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    // API call would go here
    if (currentQuestion._id) {
      setQuestions(questions.map(q => q._id === currentQuestion._id ? currentQuestion : q));
      toast.success('Question updated successfully');
    } else {
      setQuestions([...questions, { ...currentQuestion, _id: Date.now().toString() }]);
      toast.success('Question added successfully');
    }
    setIsModalOpen(false);
  };

  const getDifficultyBadge = (diff) => {
    const styles = {
      'Easy': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Medium': 'bg-amber-100 text-amber-700 border-amber-200',
      'Hard': 'bg-red-100 text-red-700 border-red-200'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[diff] || styles.Medium}`}>{diff}</span>;
  };

  const filteredQuestions = questions.filter(q => {
    const matchTopic = filterTopic === 'All' || q.topic === filterTopic;
    const matchDiff = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
    const matchSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTopic && matchDiff && matchSearch;
  });

  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'Easy').length,
    medium: questions.filter(q => q.difficulty === 'Medium').length,
    hard: questions.filter(q => q.difficulty === 'Hard').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📝 Question Bank
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage your repository of aptitude questions</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <span>➕</span> Add Question
        </button>
      </div>

      {/* Filter Bar & Stats */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-3 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search questions..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
          >
            <option value="All">📚 All Topics</option>
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
              <button 
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterDifficulty === diff ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center gap-6 shadow-lg border border-slate-800">
          <div className="text-center px-4 border-r border-slate-700">
            <div className="text-2xl font-black text-indigo-400">{stats.total}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</div>
          </div>
          <div className="flex gap-4 text-sm font-bold">
            <span className="text-emerald-400 flex flex-col items-center"><span>{stats.easy}</span><span className="text-[10px] uppercase text-slate-400">Easy</span></span>
            <span className="text-amber-400 flex flex-col items-center"><span>{stats.medium}</span><span className="text-[10px] uppercase text-slate-400">Med</span></span>
            <span className="text-red-400 flex flex-col items-center"><span>{stats.hard}</span><span className="text-[10px] uppercase text-slate-400">Hard</span></span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
      ) : filteredQuestions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.map(q => (
            <div key={q._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 group">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getDifficultyBadge(q.difficulty)}
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{q.topic}</span>
                </div>
                <p className="text-slate-800 font-medium text-lg leading-snug line-clamp-2 group-hover:line-clamp-none transition-all">{q.text}</p>
                <div className="mt-3 flex gap-2">
                   <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Correct: {q.correctAnswer}</span>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 justify-end sm:justify-start items-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4">
                <button onClick={() => handleOpenModal(q)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors tooltip" title="Edit">✏️</button>
                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors tooltip" title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 border-dashed">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No questions found</h3>
          <p className="text-slate-500">Try adjusting your filters or add a new question.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 transform transition-all">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {currentQuestion._id ? '✏️ Edit Question' : '➕ Add New Question'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSaveQuestion} className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                <textarea 
                  required
                  rows="3"
                  className="input-field resize-none"
                  placeholder="Enter the question here..."
                  value={currentQuestion.text}
                  onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Topic</label>
                  <select 
                    className="input-field"
                    value={currentQuestion.topic}
                    onChange={e => setCurrentQuestion({...currentQuestion, topic: e.target.value})}
                  >
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Difficulty</label>
                  <select 
                    className="input-field"
                    value={currentQuestion.difficulty}
                    onChange={e => setCurrentQuestion({...currentQuestion, difficulty: e.target.value})}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Marks</label>
                  <input 
                    type="number" 
                    min="1" max="10"
                    required
                    className="input-field"
                    value={currentQuestion.marks}
                    onChange={e => setCurrentQuestion({...currentQuestion, marks: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Options & Correct Answer</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, idx) => (
                    <div 
                      key={opt.id} 
                      className={`flex border-2 rounded-xl overflow-hidden transition-all ${currentQuestion.correctAnswer === opt.id ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                      <button 
                        type="button"
                        onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: opt.id})}
                        className={`px-4 font-black text-lg transition-colors ${currentQuestion.correctAnswer === opt.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                      >
                        {opt.id}
                      </button>
                      <input 
                        type="text" 
                        required
                        placeholder={`Option ${opt.id}`}
                        className="flex-1 px-4 py-2 focus:outline-none font-medium"
                        value={opt.text}
                        onChange={e => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[idx].text = e.target.value;
                          setCurrentQuestion({...currentQuestion, options: newOpts});
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2">Click on the letter (A/B/C/D) to set the correct answer.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary px-8">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
