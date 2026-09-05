import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { BookOpenIcon, PlusIcon, DocumentTextIcon, ClipboardListIcon, AlertIcon, CheckCircleIcon } from '../../components/Icons';
import { parseBulkQuestions } from '../../utils/questionParser';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [usageFilter, setUsageFilter] = useState('All'); // 'All' | 'UNUSED' | 'USED'
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

  const location = useLocation();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkParsedQuestions, setBulkParsedQuestions] = useState([]);
  const [bulkStats, setBulkStats] = useState({ rawCount: 0, validCount: 0, attentionCount: 0 });
  const [bulkStep, setBulkStep] = useState('input'); // 'input' | 'preview'
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);

  // Common batch metadata
  const [commonMetadata, setCommonMetadata] = useState({
    topic: 'Number System',
    difficulty: 'MEDIUM',
    marks: 1,
    negativeMarks: 0,
    sourceExam: ''
  });

  useEffect(() => {
    fetchQuestions();
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'bulk') {
      setShowBulkModal(true);
    }
  }, [location.search]);

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

  const handleOpenBulkModal = () => {
    setBulkRawText('');
    setBulkParsedQuestions([]);
    setBulkStats({ rawCount: 0, validCount: 0, attentionCount: 0 });
    setBulkStep('input');
    setDuplicateWarnings([]);
    setShowBulkModal(true);
  };

  const handleProcessBulkText = () => {
    if (!bulkRawText.trim()) {
      toast.error('Please paste your questions or upload a text file first');
      return;
    }

    const parsed = parseBulkQuestions(bulkRawText, commonMetadata);
    if (parsed.questions.length === 0) {
      toast.error('Could not detect any questions. Please check the formatting.');
      return;
    }

    // Check for duplicates against existing questions in local state
    const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const existingSet = new Set(questions.map((q) => norm(q.questionText)));
    const dups = [];

    const updatedQuestions = parsed.questions.map((q) => {
      const isDup = existingSet.has(norm(q.questionText));
      if (isDup) {
        dups.push(q.displayIndex);
      }
      return {
        ...q,
        isDuplicate: isDup
      };
    });

    setDuplicateWarnings(dups);
    setBulkParsedQuestions(updatedQuestions);
    setBulkStats({
      rawCount: parsed.rawCount,
      validCount: parsed.validCount,
      attentionCount: parsed.attentionCount
    });
    setBulkStep('preview');

    if (parsed.attentionCount > 0) {
      toast(
        `${parsed.questions.length} questions parsed: ${parsed.validCount} valid, ${parsed.attentionCount} need answer selection.`,
        { icon: '⚠️' }
      );
    } else {
      toast.success(`${parsed.questions.length} questions parsed successfully!`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      toast.error('For PDF files, please open the PDF and copy/paste the text directly into the box.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (text) {
        setBulkRawText(text);
        toast.success(`Loaded file: ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleUpdateParsedQuestion = (index, field, value) => {
    setBulkParsedQuestions((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Re-evaluate attention status
      const hasAllOptions = target.optionA && target.optionB && target.optionC && target.optionD;
      const hasAnswer = Boolean(target.correctAnswer && ['A', 'B', 'C', 'D'].includes(target.correctAnswer));
      const hasText = Boolean(target.questionText.trim());

      const issues = [];
      if (!hasText) issues.push('Missing question text');
      if (!target.optionA || !target.optionB) issues.push('Missing options');
      else if (!hasAllOptions) issues.push('All 4 options required');
      if (!hasAnswer) issues.push('Correct answer not provided');

      target.needsAttention = issues.length > 0;
      target.issues = issues;
      updated[index] = target;

      // Update counters
      const valid = updated.filter((q) => !q.needsAttention).length;
      setBulkStats({
        rawCount: updated.length,
        validCount: valid,
        attentionCount: updated.length - valid
      });

      return updated;
    });
  };

  const handleDeleteParsedQuestion = (index) => {
    setBulkParsedQuestions((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      const reIndexed = updated.map((q, i) => ({ ...q, displayIndex: i + 1 }));
      const valid = reIndexed.filter((q) => !q.needsAttention).length;
      setBulkStats({
        rawCount: reIndexed.length,
        validCount: valid,
        attentionCount: reIndexed.length - valid
      });
      return reIndexed;
    });
    toast.success('Question removed from batch');
  };

  const handleApplyCommonToAll = () => {
    setBulkParsedQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        topic: commonMetadata.topic,
        difficulty: commonMetadata.difficulty,
        marks: commonMetadata.marks,
        negativeMarks: commonMetadata.negativeMarks,
        sourceExam: commonMetadata.sourceExam
      }))
    );
    toast.success('Updated common metadata on all questions');
  };

  const handleSaveBulkQuestions = async () => {
    if (bulkParsedQuestions.length === 0) {
      toast.error('No questions to save');
      return;
    }

    // Filter out invalid ones or prompt
    const stillNeedAttention = bulkParsedQuestions.filter((q) => q.needsAttention);
    if (stillNeedAttention.length > 0) {
      const proceed = window.confirm(
        `${stillNeedAttention.length} questions still have missing answers or options. Would you like to review them first? Click 'Cancel' to review, or 'OK' to save only the ${bulkStats.validCount} valid questions.`
      );
      if (!proceed) return;
    }

    const questionsToSave = bulkParsedQuestions.filter((q) => !q.needsAttention);
    if (questionsToSave.length === 0) {
      toast.error('None of the questions are ready to save. Please provide the correct answers/options.');
      return;
    }

    try {
      setIsBulkSubmitting(true);
      const payload = {
        questions: questionsToSave,
        skipDuplicates,
        commonMetadata
      };

      const res = await api.post('/questions/bulk', payload);

      toast.success(res.data.message || `Added ${res.data.addedCount} questions successfully!`);
      setShowBulkModal(false);
      fetchQuestions();
    } catch (err) {
      console.error('Bulk save error:', err);
      toast.error(err.response?.data?.error || 'Failed to save bulk questions');
    } finally {
      setIsBulkSubmitting(false);
    }
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
    const matchesUsage =
      usageFilter === 'All'
        ? true
        : usageFilter === 'UNUSED'
        ? !q.isUsed
        : Boolean(q.isUsed);
    return matchesSearch && matchesTopic && matchesDiff && matchesUsage;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of previous-year aptitude problems and departmental questions
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleOpenBulkModal}
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ClipboardListIcon className="w-4 h-4 text-indigo-600" />
            <span>Bulk Paste Questions</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Single Question</span>
          </button>
        </div>
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

          <select
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value)}
            className="select-field text-xs py-2 w-full sm:w-auto font-medium text-indigo-700"
          >
            <option value="All">All Usage</option>
            <option value="UNUSED">🟢 Unused Questions</option>
            <option value="USED">↻ Previously Used</option>
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

                  {/* Question Usage Badge */}
                  {!q.isUsed ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      ✓ UNUSED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1" title={q.lastUsed ? `Last used in: ${q.lastUsed.title}` : ''}>
                      ↻ USED {q.usageCount} {q.usageCount === 1 ? 'TIME' : 'TIMES'}
                    </span>
                  )}
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

      {/* Bulk Question Entry & Review Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <ClipboardListIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {bulkStep === 'input' ? 'Bulk Paste Questions' : 'Review & Verify Questions'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {bulkStep === 'input'
                      ? 'Copy/paste questions from ChatGPT, Gemini, PDFs, or textbook notes without manual typing'
                      : `Review parsed questions, customize answers, and verify before saving to question bank`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 text-lg font-bold leading-none"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: INPUT & COMMON METADATA */}
            {bulkStep === 'input' && (
              <div className="flex-1 overflow-y-auto py-5 space-y-5">
                {/* Common Defaults Section */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Batch Defaults (Applies to all questions unless overridden)
                    </span>
                    <span className="text-[11px] text-slate-500">You can edit individual questions later</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Subject Topic</label>
                      <select
                        className="select-field text-xs py-1.5 w-full bg-white"
                        value={commonMetadata.topic}
                        onChange={(e) => setCommonMetadata({ ...commonMetadata, topic: e.target.value })}
                      >
                        {topicsList.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Difficulty</label>
                      <select
                        className="select-field text-xs py-1.5 w-full bg-white"
                        value={commonMetadata.difficulty}
                        onChange={(e) => setCommonMetadata({ ...commonMetadata, difficulty: e.target.value })}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Marks / Question</label>
                      <input
                        type="number"
                        min="1"
                        className="input-field text-xs py-1.5 bg-white"
                        value={commonMetadata.marks}
                        onChange={(e) => setCommonMetadata({ ...commonMetadata, marks: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Source / Exam Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. Previous Year / AI / Textbook"
                        className="input-field text-xs py-1.5 bg-white"
                        value={commonMetadata.sourceExam}
                        onChange={(e) => setCommonMetadata({ ...commonMetadata, sourceExam: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Paste Text Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <DocumentTextIcon className="w-4 h-4 text-indigo-600" />
                      <span>Paste Questions Text</span>
                    </label>

                    {/* File Upload Option */}
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 transition-colors">
                        <span>Upload TXT File</span>
                        <input
                          type="file"
                          accept=".txt,.text,.md"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    className="w-full border border-slate-300 rounded-xl p-3.5 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                    placeholder={`Paste questions here in any format. Example:\n\n1. What is the capital of France?\nA) Berlin\nB) Madrid\nC) Paris\nD) Rome\nAnswer: C\n\nQ2. Which number is prime?\na. 4\nb. 7\nc. 9\nd. 15\nAns: b\n\n**3. Book questions without answers work too:**\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\n(You can pick the answer in the review step!)`}
                    value={bulkRawText}
                    onChange={(e) => setBulkRawText(e.target.value)}
                  ></textarea>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Supports A/B/C/D, 1/2/3/4, Markdown, and questions missing answers from textbooks.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkRawText(`1. A car travels 180 km in 3 hours. What is its average speed?
A) 50 km/h
B) 60 km/h
C) 70 km/h
D) 80 km/h
Answer: B

2. If 15% of a number is 45, what is the number?
A) 250
B) 300
C) 350
D) 400
Answer: B

3. A sum of money doubles itself in 5 years at simple interest. What is the rate of interest per annum?
A) 10%
B) 15%
C) 20%
D) 25%
Answer: C

4. A train 150m long is running at 54 km/hr. How much time will it take to pass an electric pole?
A) 10 seconds
B) 12 seconds
C) 15 seconds
D) 18 seconds
Ans: A

5. Textbook problem without given answer:
A) Formula A
B) Formula B
C) Formula C
D) Formula D`);
                        toast.success('Loaded 5 sample questions');
                      }}
                      className="text-indigo-600 hover:text-indigo-700 underline font-medium"
                    >
                      Load Sample Questions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & REVIEW */}
            {bulkStep === 'preview' && (
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Stats & Batch Control Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Parsed: {bulkStats.rawCount} Total
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ {bulkStats.validCount} Ready
                    </span>
                    {bulkStats.attentionCount > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        ⚠️ {bulkStats.attentionCount} Need Answer Selection
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Skip existing duplicate questions</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleApplyCommonToAll}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                    >
                      Sync Common Topic/Difficulty to All
                    </button>
                  </div>
                </div>

                {/* Duplicate Notification Banner if found */}
                {duplicateWarnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
                    <AlertIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">
                        {duplicateWarnings.length} duplicate question(s) detected:
                      </span>{' '}
                      Question #{duplicateWarnings.join(', #')} already exist in your Question Bank.{' '}
                      {skipDuplicates ? 'They will be safely skipped upon saving.' : 'They will be saved as duplicates.'}
                    </div>
                  </div>
                )}

                {/* List of Parsed Question Cards */}
                <div className="space-y-3.5 max-h-[52vh] overflow-y-auto pr-1">
                  {bulkParsedQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className={`p-4 rounded-xl border transition-all ${
                        q.needsAttention
                          ? 'border-amber-300 bg-amber-50/30'
                          : q.isDuplicate
                          ? 'border-slate-300 bg-slate-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            Q#{q.displayIndex}
                          </span>
                          {q.needsAttention ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              ⚠️ Action Required: {q.issues.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              ✓ Ready
                            </span>
                          )}
                          {q.isDuplicate && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                              Duplicate found
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteParsedQuestion(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold p-1 hover:bg-rose-50 rounded"
                          title="Remove question"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Question Text */}
                      <div className="mb-3">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Question Prompt</label>
                        <textarea
                          rows={2}
                          className="input-field text-xs py-1.5 font-medium bg-white"
                          value={q.questionText}
                          onChange={(e) => handleUpdateParsedQuestion(idx, 'questionText', e.target.value)}
                        />
                      </div>

                      {/* 4 Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <div key={opt} className="flex items-center gap-1.5">
                            <span
                              className={`w-6 h-6 shrink-0 rounded text-xs font-bold flex items-center justify-center ${
                                q.correctAnswer === opt
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt}
                            </span>
                            <input
                              type="text"
                              className="input-field text-xs py-1 bg-white"
                              placeholder={`Option ${opt}`}
                              value={q['option' + opt]}
                              onChange={(e) => handleUpdateParsedQuestion(idx, 'option' + opt, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Answer Selection & Row Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 items-center">
                        <div className="sm:col-span-1">
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Correct Answer <span className="text-rose-500">*</span>
                          </label>
                          <select
                            className={`select-field text-xs py-1 w-full font-bold ${
                              !q.correctAnswer ? 'border-amber-400 bg-amber-50 text-amber-900' : 'bg-white text-emerald-800'
                            }`}
                            value={q.correctAnswer}
                            onChange={(e) => handleUpdateParsedQuestion(idx, 'correctAnswer', e.target.value)}
                          >
                            <option value="">-- Select Answer --</option>
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Topic</label>
                          <select
                            className="select-field text-xs py-1 w-full bg-white"
                            value={q.topic}
                            onChange={(e) => handleUpdateParsedQuestion(idx, 'topic', e.target.value)}
                          >
                            {topicsList.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Difficulty</label>
                          <select
                            className="select-field text-xs py-1 w-full bg-white"
                            value={q.difficulty}
                            onChange={(e) => handleUpdateParsedQuestion(idx, 'difficulty', e.target.value)}
                          >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Marks</label>
                          <input
                            type="number"
                            min="1"
                            className="input-field text-xs py-1 bg-white"
                            value={q.marks}
                            onChange={(e) => handleUpdateParsedQuestion(idx, 'marks', parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {bulkStep === 'input' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessBulkText}
                    className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
                  >
                    <span>Process & Preview Questions</span>
                    <span>→</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setBulkStep('input')}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    ← Back to Paste Box
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isBulkSubmitting || bulkStats.validCount === 0}
                      onClick={handleSaveBulkQuestions}
                      className="btn-primary text-xs py-2 px-6 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isBulkSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Questions...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Save {bulkStats.validCount} Valid Questions</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
