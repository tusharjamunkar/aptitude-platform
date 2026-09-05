import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { BookOpenIcon, PlusIcon } from '../../components/Icons';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingQ, setEditingQ] = useState(null);

  const topicsList = [
    'Number System',
    'Percentages',
    'Profit and Loss',
    'Simple Interest',
    'Compound Interest',
    'Time and Work',
    'Time Speed Distance',
    'Ratio and Proportion',
    'Averages',
    'Ages',
    'Probability',
    'Permutations and Combinations',
    'Data Interpretation',
    'Logical Reasoning',
    'Verbal Ability',
    'Coding Decoding',
    'Blood Relations',
    'Syllogisms',
    'Directions',
    'Clocks',
    'Calendars',
    'Mixtures and Alligation',
    'Pipes and Cisterns',
    'Trains',
    'Boats and Streams'
  ];

  const initialForm = {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: 1,
    negativeMarks: 0,
    topic: 'Number System',
    difficulty: 'MEDIUM',
    sourceExam: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/questions');
      setQuestions(res.data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingQ(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQ(q);
    setFormData({
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      negativeMarks: q.negativeMarks || 0,
      topic: q.topic,
      difficulty: q.difficulty,
      sourceExam: q.sourceExam || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success('Question removed');
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQ) {
        const res = await api.put(`/questions/${editingQ.id}`, formData);
        setQuestions((prev) => prev.map((q) => (q.id === editingQ.id ? res.data : q)));
        toast.success('Question updated successfully');
      } else {
        const res = await api.post('/questions', formData);
        setQuestions((prev) => [res.data, ...prev]);
        toast.success('Question added to repository');
      }
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to save question');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(search.toLowerCase()) ||
      (q.sourceExam && q.sourceExam.toLowerCase().includes(search.toLowerCase()));
    const matchesTopic = topicFilter === 'All' || q.topic === topicFilter;
    const matchesDiff = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesTopic && matchesDiff;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of 45 previous-year aptitude problems and departmental questions
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80">
          <input
            type="text"
            className="input-field text-xs py-2"
            placeholder="Search question text or exam source (e.g. TCS, Infosys)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="select-field text-xs py-2 w-full sm:w-auto"
          >
            <option value="All">All Topics</option>
            {topicsList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="select-field text-xs py-2 w-full sm:w-auto"
          >
            <option value="All">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <span className="text-xs font-semibold text-slate-500 ml-1">
            {filteredQuestions.length} Questions
          </span>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Loading questions repository...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpenIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No questions match your filter</h3>
          <p className="text-xs text-slate-500">Adjust your search query or add a new question.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                    {q.topic}
                  </span>
                  {q.sourceExam && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {q.sourceExam}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      q.difficulty === 'EASY'
                        ? 'bg-emerald-50 text-emerald-700'
                        : q.difficulty === 'HARD'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 mr-2">
                    +{q.marks} mark{q.marks > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(q)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 hover:bg-rose-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-900 leading-relaxed mb-3">
                {q.questionText}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-slate-600">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div
                    key={opt}
                    className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      q.correctAnswer === opt
                        ? 'bg-emerald-50/80 border-emerald-300 font-semibold text-emerald-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        q.correctAnswer === opt
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-300'
                      }`}
                    >
                      {opt}
                    </span>
                    <span className="truncate">{q[`option${opt}`]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingQ ? 'Edit Assessment Question' : 'Add Question to Bank'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  className="input-field"
                  placeholder="Enter the complete question problem statement..."
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt}>
                    <label className="label-text">Option {opt}</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder={`Choice ${opt}`}
                      value={formData[`option${opt}`]}
                      onChange={(e) => setFormData({ ...formData, [`option${opt}`]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label-text">Correct Answer</label>
                  <select
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    className="select-field"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">Topic</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="select-field"
                  >
                    {topicsList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-text">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="select-field"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label-text">Marks Awarded</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <label className="label-text">Negative Marking</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    className="input-field"
                    value={formData.negativeMarks}
                    onChange={(e) => setFormData({ ...formData, negativeMarks: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="label-text">Exam Source (Optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. TCS NQT 2023"
                    value={formData.sourceExam}
                    onChange={(e) => setFormData({ ...formData, sourceExam: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5"
                >
                  {editingQ ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
