import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  FolderIcon, 
  RefreshIcon, 
  AlertIcon, 
  BookOpenIcon 
} from '../../components/Icons';
import BulkQuestionModal from '../../components/BulkQuestionModal';

export default function CreateTest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editTestId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editTestId);

  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form parameters
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Quantitative & Logical Aptitude',
    studyYear: 'All Years',
    department: 'All Departments',
    topic: 'Comprehensive Assessment',
    description: '',
    targetQuestionCount: 45,
    duration: 45,
    isMandatory: true,
    warningsAllowed: 1
  });

  // Step 2 Filters & Controls
  const [usageFilter, setUsageFilter] = useState('UNUSED'); // 'UNUSED' | 'USED' | 'ALL'
  const [showUsedSection, setShowUsedSection] = useState(false);
  const [topicFilter, setTopicFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('flat'); // 'flat' | 'topics'
  const [expandedTopics, setExpandedTopics] = useState({});

  useEffect(() => {
    fetchQuestions();
    if (isEditMode) {
      fetchTestForEdit(editTestId);
    }
  }, [editTestId]);

  const fetchTestForEdit = async (testId) => {
    try {
      const res = await api.get(`/tests/${testId}`);
      const test = res.data;
      if (test) {
        setFormData({
          title: test.title || '',
          subject: test.subject || 'Quantitative & Logical Aptitude',
          studyYear: test.studyYear || 'All Years',
          department: test.department || 'All Departments',
          topic: test.topic || '',
          description: test.description || '',
          targetQuestionCount: test.questions?.length || 45,
          duration: test.duration || 45,
          isMandatory: test.isMandatory ?? true,
          warningsAllowed: test.warningsAllowed ?? 1
        });
        if (test.questions && Array.isArray(test.questions)) {
          setSelectedQuestions(test.questions.map((q) => q.id));
        }
        toast.success(`Loaded "${test.title}" for editing`);
      }
    } catch (err) {
      console.error('Failed to load test for editing:', err);
      toast.error('Failed to load test for editing');
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/questions');
      const list = res.data || [];
      setQuestions(list);
    } catch (err) {
      console.error('Error fetching questions for test creation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique topics from fetched questions
  const availableTopics = useMemo(() => {
    const s = new Set();
    questions.forEach((q) => {
      if (q.topic) s.add(q.topic);
    });
    return Array.from(s).sort();
  }, [questions]);

  // Split overall questions into unused and previously used
  const unusedQuestions = useMemo(() => {
    return questions.filter((q) => !q.isUsed);
  }, [questions]);

  const usedQuestions = useMemo(() => {
    return questions.filter((q) => q.isUsed);
  }, [questions]);

  // Apply filters: Search, Topic, Difficulty
  const filterQuestion = (q) => {
    if (searchQuery) {
      const qText = (q.questionText || '').toLowerCase();
      const exam = (q.sourceExam || '').toLowerCase();
      const sTerm = searchQuery.toLowerCase();
      if (!qText.includes(sTerm) && !exam.includes(sTerm)) {
        return false;
      }
    }
    if (topicFilter !== 'All' && q.topic !== topicFilter) {
      return false;
    }
    if (difficultyFilter !== 'All' && q.difficulty !== difficultyFilter) {
      return false;
    }
    return true;
  };

  const filteredUnused = useMemo(() => {
    return unusedQuestions.filter(filterQuestion);
  }, [unusedQuestions, searchQuery, topicFilter, difficultyFilter]);

  const filteredUsed = useMemo(() => {
    return usedQuestions.filter(filterQuestion);
  }, [usedQuestions, searchQuery, topicFilter, difficultyFilter]);

  // Grouped by Topic for category / folder view
  const groupedByTopic = useMemo(() => {
    const map = {};
    questions.forEach((q) => {
      const t = q.topic || 'General';
      if (!map[t]) {
        map[t] = { unused: [], used: [] };
      }
      if (q.isUsed) {
        map[t].used.push(q);
      } else {
        map[t].unused.push(q);
      }
    });
    return map;
  }, [questions]);

  const toggleSelectQuestion = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectMultiple = (ids) => {
    const allSelected = ids.every((id) => selectedQuestions.includes(id));
    if (allSelected) {
      setSelectedQuestions((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedQuestions((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Quick Select N unused questions
  const handleQuickSelectUnused = (count) => {
    const eligible = filteredUnused.map((q) => q.id);
    const toSelect = eligible.slice(0, count);
    setSelectedQuestions(toSelect);
    toast.success(`Selected ${toSelect.length} unused questions`);
  };

  const handleClearSelection = () => {
    setSelectedQuestions([]);
    toast.success('Cleared question selection');
  };

  const toggleTopicExpand = (topic) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  const totalMarks = useMemo(() => {
    return questions
      .filter((q) => selectedQuestions.includes(q.id))
      .reduce((acc, q) => acc + (q.marks || 1), 0);
  }, [questions, selectedQuestions]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please specify a test title');
      setStep(1);
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question for the test');
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        duration: parseInt(formData.duration) || 45,
        questionIds: selectedQuestions
      };
      if (isEditMode && editTestId) {
        await api.put(`/tests/${editTestId}`, payload);
        toast.success('Assessment updated successfully!');
      } else {
        await api.post('/tests', payload);
        toast.success('Assessment created and published successfully!');
      }
      navigate('/teacher');
    } catch (err) {
      toast.error(err.response?.data?.error || (isEditMode ? 'Failed to update assessment' : 'Failed to create assessment'));
    } finally {
      setSubmitting(false);
    }
  };

  const [showBulkModal, setShowBulkModal] = useState(false);

  const targetCount = parseInt(formData.targetQuestionCount) || 45;
  const remainingCount = targetCount - selectedQuestions.length;

  const handleBulkQuestionsAdded = async (bulkResponse) => {
    try {
      const res = await api.get('/questions');
      const updatedList = res.data || [];
      setQuestions(updatedList);

      // Automatically select the newly created questions into this assessment!
      const currentIds = new Set(selectedQuestions);
      const newlyCreated = updatedList
        .filter((q) => !currentIds.has(q.id))
        .slice(0, bulkResponse?.addedCount || 10);
      
      const newSelectedIds = Array.from(new Set([...selectedQuestions, ...newlyCreated.map((q) => q.id)]));
      setSelectedQuestions(newSelectedIds);
      toast.success(`Selected ${newlyCreated.length} newly added questions for this assessment!`);
    } catch (err) {
      console.error('Error refreshing questions after bulk import:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Assessment</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure test parameters, select examination questions, and publish to students
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/70 rounded-xl">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
            step === 1
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Test Parameters
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
            step === 2
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Question Selection ({selectedQuestions.length})
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
            step === 3
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Final Review & Publish
        </button>
      </div>

      {/* Step 1: Configuration */}
      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Assessment Details
          </h2>

          <div>
            <label className="label-text">Assessment Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Previous Year Aptitude Assessment (45 Questions)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Subject Discipline</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. DBMS, Quantitative Aptitude"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="label-text">Target Study Year</label>
              <select
                className="select-field"
                value={formData.studyYear}
                onChange={(e) => setFormData({ ...formData, studyYear: e.target.value })}
              >
                <option value="All Years">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label-text mb-0">Number of Questions <span className="text-rose-500">*</span></label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {questions.length} available in bank
                </span>
              </div>
              <input
                type="number"
                min="1"
                max={questions.length || 100}
                className="input-field font-semibold text-slate-800"
                value={formData.targetQuestionCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setFormData({ ...formData, targetQuestionCount: val });
                }}
              />
              {/* Dynamic Preset Chips */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[10, 15, 20, 25, 30, 45].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetQuestionCount: Math.min(preset, questions.length || preset) })}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                      formData.targetQuestionCount === preset
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {preset} Qs
                  </button>
                ))}
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetQuestionCount: questions.length })}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                      formData.targetQuestionCount === questions.length
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                    }`}
                    title="Select all available questions in the question bank"
                  >
                    All ({questions.length})
                  </button>
                )}
              </div>
              {formData.targetQuestionCount > questions.length && questions.length > 0 && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  ⚠️ Target exceeds total questions ({questions.length}) in bank. Add questions or adjust count.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Topic / Module Scope</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. SQL, Normalization, Percentages"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>

            <div>
              <label className="label-text">Department Scope</label>
              <select
                className="select-field"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="All Departments">All Departments</option>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-text">Description & Instructions</label>
            <textarea
              rows={3}
              className="input-field"
              placeholder="Provide test instructions, negative marking rules, and proctoring requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="label-text flex items-center justify-between">
                <span>Duration (Minutes)</span>
                <span className="font-bold text-blue-600">{formData.duration} mins</span>
              </label>
              <input
                type="number"
                min="10"
                max="180"
                className="input-field"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 45 })}
              />
              <p className="text-[11px] text-slate-400 mt-1">Standard placement assessment duration is 45 minutes.</p>
            </div>

            <div>
              <label className="label-text">Tab Switch Warnings</label>
              <select
                value={formData.warningsAllowed}
                onChange={(e) => setFormData({ ...formData, warningsAllowed: parseInt(e.target.value) })}
                className="select-field"
              >
                <option value={1}>1 Warning (Recommended for Campus Placements)</option>
                <option value={0}>0 Warnings (Strict - Disqualify on 1st Violation)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!formData.title.trim()) {
                  toast.error('Please enter a test title');
                  return;
                }
                const count = parseInt(formData.targetQuestionCount) || 0;
                if (count <= 0) {
                  toast.error('Question count must be at least 1');
                  return;
                }
                if (questions.length > 0 && count > questions.length) {
                  toast.error(`Question count cannot exceed total questions available in bank (${questions.length})`);
                  return;
                }
                setStep(2);
              }}
              className="btn-primary text-xs py-2 px-4"
            >
              Continue to Question Selection →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Questions with Unused Priority */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Top Selection Status Header */}
          <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-indigo-600">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  Selected: {selectedQuestions.length} / {targetCount}
                </span>
                {selectedQuestions.length === targetCount ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✓ Target Met
                  </span>
                ) : remainingCount > 0 ? (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {remainingCount} Remaining
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    +{Math.abs(remainingCount)} Extra
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Marks: <span className="font-semibold text-slate-800">{totalMarks}</span> •{' '}
                <span className="text-emerald-700 font-medium">{unusedQuestions.length} Unused Available</span> •{' '}
                <span className="text-slate-500">{usedQuestions.length} Previously Used</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                title="Paste multiple questions from ChatGPT, PDF, or textbook"
              >
                <span>📋 Bulk Paste Questions</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectUnused(targetCount)}
                className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-xs transition-colors"
                title="Automatically select up to the required count from fresh unused questions"
              >
                ⚡ Select {Math.min(targetCount, filteredUnused.length)} Unused Questions
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                disabled={selectedQuestions.length === 0}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Clear Selection
              </button>

              <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setViewMode('flat')}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                    viewMode === 'flat' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  List View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('topics')}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                    viewMode === 'topics' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Topic Folders
                </button>
              </div>
            </div>
          </div>

          {/* Fast Filters Bar */}
          <div className="card p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="md:col-span-1">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Search Question</label>
                <input
                  type="text"
                  placeholder="Search question text or exams..."
                  className="input-field text-xs py-1.5 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Topic */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Topic Filter</label>
                <select
                  className="select-field text-xs py-1.5 w-full bg-white"
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                >
                  <option value="All">All Topics ({availableTopics.length})</option>
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Difficulty</label>
                <select
                  className="select-field text-xs py-1.5 w-full bg-white"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="All">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Usage Filter - Defaults to UNUSED */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Question Usage
                </label>
                <select
                  className="select-field text-xs py-1.5 w-full bg-white font-medium text-indigo-700 border-indigo-200"
                  value={usageFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUsageFilter(val);
                    if (val === 'USED' || val === 'ALL') {
                      setShowUsedSection(true);
                    }
                  }}
                >
                  <option value="UNUSED">🟢 Unused Questions Only (Default)</option>
                  <option value="USED">↻ Previously Used Questions Only</option>
                  <option value="ALL">All Questions (Unused + Used)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Question Listing */}
          {loading ? (
            <div className="card p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Loading questions repository and usage history...</p>
            </div>
          ) : viewMode === 'topics' ? (
            /* Topic Folders View */
            <div className="space-y-3">
              {Object.keys(groupedByTopic).map((topicName) => {
                const group = groupedByTopic[topicName];
                const filteredGroupUnused = group.unused.filter(filterQuestion);
                const filteredGroupUsed = group.used.filter(filterQuestion);

                const totalGroupCount = filteredGroupUnused.length + (showUsedSection || usageFilter !== 'UNUSED' ? filteredGroupUsed.length : 0);
                if (totalGroupCount === 0 && (searchQuery || topicFilter !== 'All' || difficultyFilter !== 'All')) {
                  return null;
                }

                const isExpanded = expandedTopics[topicName] ?? true;
                const selectedInTopic = [...filteredGroupUnused, ...filteredGroupUsed].filter((q) =>
                  selectedQuestions.includes(q.id)
                ).length;

                return (
                  <div key={topicName} className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
                    <div
                      onClick={() => toggleTopicExpand(topicName)}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-200/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderIcon className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">{topicName}</span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {filteredGroupUnused.length} unused
                        </span>
                        {filteredGroupUsed.length > 0 && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                            {filteredGroupUsed.length} used
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {selectedInTopic > 0 && (
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                            {selectedInTopic} selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const availableIds = [
                              ...filteredGroupUnused.map((q) => q.id),
                              ...(showUsedSection ? filteredGroupUsed.map((q) => q.id) : [])
                            ];
                            toggleSelectMultiple(availableIds);
                          }}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 p-1"
                        >
                          Select All in Topic
                        </button>
                        <span className="text-slate-400 text-xs font-bold">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 space-y-2.5 bg-slate-50/40">
                        {(usageFilter === 'UNUSED' || usageFilter === 'ALL') && (
                          <div className="space-y-2">
                            {filteredGroupUnused.map((q) => (
                              <QuestionSelectionCard
                                key={q.id}
                                question={q}
                                isSelected={selectedQuestions.includes(q.id)}
                                onToggle={() => toggleSelectQuestion(q.id)}
                              />
                            ))}
                          </div>
                        )}

                        {(showUsedSection || usageFilter === 'USED' || usageFilter === 'ALL') && filteredGroupUsed.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                              Previously Used ({filteredGroupUsed.length})
                            </div>
                            {filteredGroupUsed.map((q) => (
                              <QuestionSelectionCard
                                key={q.id}
                                question={q}
                                isSelected={selectedQuestions.includes(q.id)}
                                onToggle={() => toggleSelectQuestion(q.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat List View: Unused Always First */
            <div className="space-y-6">
              {/* 1. UNUSED QUESTIONS SECTION */}
              {(usageFilter === 'UNUSED' || usageFilter === 'ALL') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        UNUSED QUESTIONS ({filteredUnused.length})
                      </span>
                      <span className="text-xs text-slate-500">Never appeared in any previous assessment</span>
                    </div>

                    {filteredUnused.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSelectMultiple(filteredUnused.map((q) => q.id))}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Select All {filteredUnused.length} Unused
                      </button>
                    )}
                  </div>

                  {filteredUnused.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                      <BookOpenIcon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No unused questions match current filters</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Try changing your topic/search filters or expand previously used questions below.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                      {filteredUnused.map((q, idx) => (
                        <QuestionSelectionCard
                          key={q.id}
                          question={q}
                          index={idx + 1}
                          isSelected={selectedQuestions.includes(q.id)}
                          onToggle={() => toggleSelectQuestion(q.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. PREVIOUSLY USED QUESTIONS SECTION */}
              {(usageFilter === 'ALL' || usageFilter === 'USED' || showUsedSection) ? (
                <div className="space-y-3 pt-4 border-t-2 border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <RefreshIcon className="w-4 h-4 text-slate-500" />
                        PREVIOUSLY USED QUESTIONS ({filteredUsed.length})
                      </span>
                      <span className="text-xs text-slate-500">Available for reuse if desired</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {filteredUsed.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleSelectMultiple(filteredUsed.map((q) => q.id))}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-800"
                        >
                          Select All Used
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUsedSection(false);
                          if (usageFilter === 'USED') setUsageFilter('UNUSED');
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Hide Section ▲
                      </button>
                    </div>
                  </div>

                  {filteredUsed.length === 0 ? (
                    <div className="p-6 text-center bg-white rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500">No previously used questions match current filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                      {filteredUsed.map((q, idx) => (
                        <QuestionSelectionCard
                          key={q.id}
                          question={q}
                          index={idx + 1}
                          isSelected={selectedQuestions.includes(q.id)}
                          onToggle={() => toggleSelectQuestion(q.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Collapsible prompt to reveal used questions */
                <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white text-slate-500 flex items-center justify-center border border-slate-200 shrink-0">
                      <RefreshIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {usedQuestions.length} Previously Used Questions Available
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Hidden by default so you don't accidentally repeat questions. Need to reuse questions?
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowUsedSection(true)}
                    className="btn-secondary text-xs py-1.5 px-3.5 font-semibold text-slate-700 border-slate-300 hover:bg-white shrink-0"
                  >
                    Show Previously Used Questions ▼
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2 Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary text-xs py-2 px-4"
            >
              ← Back to Parameters
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {selectedQuestions.length} / {targetCount} Selected
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedQuestions.length === 0) {
                    toast.error('Please select at least 1 question');
                    return;
                  }
                  if (selectedQuestions.length !== targetCount) {
                    const proceed = window.confirm(
                      `You have selected ${selectedQuestions.length} questions, but your target is ${targetCount}. Do you want to proceed anyway?`
                    );
                    if (!proceed) return;
                  }
                  setStep(3);
                }}
                className="btn-primary text-xs py-2 px-5"
              >
                Proceed to Review ({selectedQuestions.length} Qs) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <div className="card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Review Assessment Configuration</h2>
            <p className="text-xs text-slate-500">Confirm test setup and selected questions before publishing to students</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Parameters</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Title:</span>
                <span className="font-bold text-slate-900">{formData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-medium text-slate-700">{formData.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Study Year:</span>
                <span className="font-medium text-slate-700">{formData.studyYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Topic:</span>
                <span className="font-medium text-slate-700">{formData.topic}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Exam Environment</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Test Duration:</span>
                <span className="font-bold text-blue-600">{formData.duration} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-slate-900">{selectedQuestions.length} Questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maximum Marks:</span>
                <span className="font-bold text-emerald-600">{totalMarks} Marks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fresh (Unused):</span>
                <span className="font-bold text-emerald-700">
                  {questions.filter((q) => selectedQuestions.includes(q.id) && !q.isUsed).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reused Questions:</span>
                <span className="font-bold text-slate-600">
                  {questions.filter((q) => selectedQuestions.includes(q.id) && q.isUsed).length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary text-xs py-2 px-4"
            >
              ← Edit Questions
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="btn-primary text-xs py-2.5 px-6"
            >
              {submitting ? 'Publishing Test...' : 'Publish Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Paste Questions Modal */}
      <BulkQuestionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onQuestionsAdded={handleBulkQuestionsAdded}
        existingQuestions={questions}
        initialTopic={formData.topic || formData.subject || 'Quantitative Aptitude'}
        isAssessmentMode={true}
      />
    </div>
  );
}

// Subcomponent for Question Card with usage badges
function QuestionSelectionCard({ question: q, index, isSelected, onToggle }) {
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  if (!q) return null;

  const topicName = q.topic || 'General';
  const difficultyLevel = q.difficulty || 'MEDIUM';
  const questionMarks = q.marks || 1;
  const usageCount = q.usageCount || 0;
  const testsList = Array.isArray(q.usedInTests) ? q.usedInTests : [];

  return (
    <div
      onClick={onToggle}
      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/30'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
            onChange={() => {}}
            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
          />
          {index && <span className="text-xs font-bold text-slate-700">#{index}</span>}
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {topicName}
          </span>
          {q.sourceExam && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {q.sourceExam}
            </span>
          )}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              difficultyLevel === 'EASY'
                ? 'bg-emerald-50 text-emerald-700'
                : difficultyLevel === 'HARD'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {difficultyLevel}
          </span>

          {/* USAGE STATUS BADGE */}
          {!q.isUsed ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              ✓ UNUSED
            </span>
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowUsageDetails(!showUsageDetails);
              }}
              className="text-[10px] font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
              title="Click to view tests that used this question"
            >
              ↻ USED {usageCount} {usageCount === 1 ? 'TIME' : 'TIMES'}
              {q.lastUsed && (
                <span className="text-[10px] font-normal text-slate-600">
                  (Last: {q.lastUsed?.title || 'Prior Assessment'})
                </span>
              )}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-500 shrink-0">+{questionMarks} mark</span>
      </div>

      <p className="text-xs font-medium text-slate-800 ml-6 line-clamp-2">
        {q.questionText || ''}
      </p>

      {/* Expanded Usage History Details */}
      {showUsageDetails && testsList.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 ml-6 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1"
        >
          <div className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
            Assessment Usage History:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
            {testsList.map((t, tIdx) => (
              <li key={t.id || tIdx}>
                <span className="font-semibold text-slate-800">{t.title || 'Assessment'}</span>
                {t.date && (
                  <span className="text-slate-400 ml-1">
                    ({new Date(t.date).toLocaleDateString()})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

