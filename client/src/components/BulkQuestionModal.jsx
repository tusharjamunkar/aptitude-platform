import React, { useState, useMemo } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  AlertIcon, 
  CheckCircleIcon 
} from './Icons';
import { parseBulkQuestions } from '../utils/questionParser';

const DEFAULT_TOPICS = [
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
  'Boats and Streams',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Data Structures'
];

export default function BulkQuestionModal({
  isOpen,
  onClose,
  onQuestionsAdded,
  existingQuestions = [],
  initialTopic = 'Quantitative Aptitude',
  isAssessmentMode = false
}) {
  const [step, setStep] = useState('input'); // 'input' | 'preview'
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [stats, setStats] = useState({ rawCount: 0, validCount: 0, attentionCount: 0 });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);

  // Batch common metadata
  const [commonMetadata, setCommonMetadata] = useState({
    topic: initialTopic || 'Quantitative Aptitude',
    difficulty: 'MEDIUM',
    marks: 1,
    negativeMarks: 0,
    sourceExam: ''
  });

  // Calculate how many are currently selected
  const selectedCount = useMemo(() => {
    return parsedQuestions.filter((q) => q.isSelected).length;
  }, [parsedQuestions]);

  const allSelected = useMemo(() => {
    return parsedQuestions.length > 0 && parsedQuestions.every((q) => q.isSelected);
  }, [parsedQuestions]);

  if (!isOpen) return null;

  const handleProcessText = () => {
    if (!rawText.trim()) {
      toast.error('Please paste your questions or load sample questions first');
      return;
    }

    const parsed = parseBulkQuestions(rawText, commonMetadata);
    if (!parsed.questions || parsed.questions.length === 0) {
      toast.error('Could not detect any questions. Please check the formatting.');
      return;
    }

    // Check duplicates against existing questions
    const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const existingSet = new Set(existingQuestions.map((q) => norm(q.questionText)));
    const dups = [];

    const updated = parsed.questions.map((q) => {
      const isDup = existingSet.has(norm(q.questionText));
      if (isDup) dups.push(q.displayIndex);
      return {
        ...q,
        isDuplicate: isDup,
        isSelected: true // Default: select all parsed questions
      };
    });

    setDuplicateWarnings(dups);
    setParsedQuestions(updated);
    setStats({
      rawCount: parsed.rawCount,
      validCount: parsed.validCount,
      attentionCount: parsed.attentionCount
    });
    setStep('preview');

    toast.success(`${parsed.questions.length} of ${parsed.questions.length} questions parsed successfully!`);
  };

  const handleToggleSelectAll = () => {
    const nextState = !allSelected;
    setParsedQuestions((prev) => prev.map((q) => ({ ...q, isSelected: nextState })));
  };

  const handleToggleSelectQuestion = (idx) => {
    setParsedQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], isSelected: !updated[idx].isSelected };
      return updated;
    });
  };

  const handleUpdateQuestion = (idx, field, value) => {
    setParsedQuestions((prev) => {
      const updated = [...prev];
      const target = { ...updated[idx], [field]: value };

      // Re-evaluate issues
      const hasOptions = Boolean(target.optionA && target.optionB);
      const hasAllOptions = Boolean(target.optionA && target.optionB && target.optionC && target.optionD);
      const hasAnswer = Boolean(target.correctAnswer && ['A', 'B', 'C', 'D'].includes(target.correctAnswer));
      const hasText = Boolean((target.questionText || '').trim());

      const issues = [];
      if (!hasText) issues.push('Missing question text');
      if (!hasOptions) issues.push('Missing options');
      else if (!hasAllOptions) issues.push('All 4 options recommended');
      if (!hasAnswer) issues.push('Select correct answer');

      target.needsAttention = issues.length > 0;
      target.issues = issues;
      updated[idx] = target;

      const valid = updated.filter((q) => !q.needsAttention).length;
      setStats({
        rawCount: updated.length,
        validCount: valid,
        attentionCount: updated.length - valid
      });
      return updated;
    });
  };

  const handleDeleteQuestion = (idx) => {
    setParsedQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      const reIndexed = updated.map((q, i) => ({ ...q, displayIndex: i + 1 }));
      const valid = reIndexed.filter((q) => !q.needsAttention).length;
      setStats({
        rawCount: reIndexed.length,
        validCount: valid,
        attentionCount: reIndexed.length - valid
      });
      return reIndexed;
    });
    toast.success('Question removed');
  };

  const handleSyncCommonToAll = () => {
    setParsedQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        topic: commonMetadata.topic,
        difficulty: commonMetadata.difficulty,
        marks: commonMetadata.marks,
        negativeMarks: commonMetadata.negativeMarks,
        sourceExam: commonMetadata.sourceExam
      }))
    );
    toast.success('Synchronized metadata across all questions');
  };

  const handleSetMissingAnswersDefault = (answerLetter = 'A') => {
    setParsedQuestions((prev) =>
      prev.map((q) => {
        if (!q.correctAnswer) {
          const updated = { ...q, correctAnswer: answerLetter };
          const hasOptions = Boolean(updated.optionA && updated.optionB);
          const hasAllOptions = Boolean(updated.optionA && updated.optionB && updated.optionC && updated.optionD);
          const hasText = Boolean((updated.questionText || '').trim());
          const issues = [];
          if (!hasText) issues.push('Missing question text');
          if (!hasOptions) issues.push('Missing options');
          else if (!hasAllOptions) issues.push('All 4 options recommended');
          updated.needsAttention = issues.length > 0;
          updated.issues = issues;
          return updated;
        }
        return q;
      })
    );
    toast.success(`Assigned option ${answerLetter} to questions without answers`);
  };

  const handleSave = async () => {
    const questionsToSave = parsedQuestions.filter((q) => q.isSelected);
    if (questionsToSave.length === 0) {
      toast.error('Please select at least 1 question to import');
      return;
    }

    // Check if any selected questions are missing answers or text
    const missingAnswer = questionsToSave.filter((q) => !q.correctAnswer);
    if (missingAnswer.length > 0) {
      const proceed = window.confirm(
        `${missingAnswer.length} selected question(s) do not have a correct answer marked. Would you like to automatically set their answer to 'A' and proceed?`
      );
      if (!proceed) return;
      questionsToSave.forEach((q) => {
        if (!q.correctAnswer) q.correctAnswer = 'A';
      });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        questions: questionsToSave,
        skipDuplicates,
        commonMetadata
      };

      const res = await api.post('/questions/bulk', payload);
      toast.success(res.data.message || `Added ${res.data.addedCount} questions successfully!`);

      if (onQuestionsAdded) {
        await onQuestionsAdded(res.data);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save bulk questions:', err);
      toast.error(err.response?.data?.error || 'Failed to save questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSampleQuestions = () => {
    setRawText(`1. What is the full form of DBMS?
A) Data Base Management System
B) Digital Base Memory System
C) Direct Backup Management Software
D) Data Business Model Software
Answer: A

2. Which SQL command is used to retrieve data from a table?
A) INSERT
B) SELECT
C) UPDATE
D) DELETE
Answer: B

3. Which of the following is a non-volatile memory?
A) RAM
B) Cache
C) ROM
D) Register
Answer: C

4. In DBMS, ACID property 'A' stands for:
A) Atomicity
B) Accuracy
C) Authenticity
D) Availability
Answer: A

5. Which normal form removes partial functional dependencies?
A) 1NF
B) 2NF
C) 3NF
D) BCNF
Answer: B

6. What is a primary key?
A) A column that allows duplicate values
B) A unique identifier for a tuple in a table
C) An optional reference to another table
D) None of the above
Answer: B

7. Which command is used to delete a table and all its contents?
A) REMOVE
B) DROP
C) TRUNCATE
D) CLEAR
Answer: B

8. Which operation is used for combining rows from two or more tables?
A) JOIN
B) PROJECT
C) SELECT
D) DIVIDE
Answer: A

9. What is the time complexity of searching an element in a balanced binary search tree?
A) O(1)
B) O(N)
C) O(log N)
D) O(N^2)
Answer: C

10. A train running at 72 km/h crosses an electric pole in 15 seconds. What is the length of the train?
A) 250 metres
B) 300 metres
C) 350 metres
D) 400 metres
Answer: B`);
    toast.success('Loaded 10 sample questions');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bulk Question Entry (Copy / Paste)
              </h2>
              <p className="text-xs text-slate-500">
                Paste questions from ChatGPT, PDFs, textbooks, or notes • Auto-formatted in seconds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: INPUT BOX */}
        {step === 'input' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Common Metadata Defaults Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Default Metadata Applied to All Questions:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Topic</label>
                  <select
                    className="select-field text-xs py-1.5 w-full bg-white"
                    value={commonMetadata.topic}
                    onChange={(e) => setCommonMetadata({ ...commonMetadata, topic: e.target.value })}
                  >
                    {DEFAULT_TOPICS.map((t) => (
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
                    placeholder="e.g. Previous Year / GATE"
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
                  <span>Paste Questions Text (All 10, 20, 50 questions at once)</span>
                </label>

                <button
                  type="button"
                  onClick={loadSampleQuestions}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold underline"
                >
                  Load 10 Sample Questions
                </button>
              </div>

              <textarea
                rows={12}
                className="w-full border border-slate-300 rounded-xl p-3.5 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder-slate-400 leading-relaxed"
                placeholder={`Paste multiple questions here. Supports:
- Numbered lists (1., 2., 3...)
- Question prefixes (Q1., Question 1:, Q1-)
- Options: A), B), C), D) or inline (A) ... B) ...)
- Answer keys: Answer: B, Ans: C, or separate Answer Key at the end
- Textbooks without answers (you can select answers in preview!)`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Every question will be parsed and previewed before being added.</span>
                <span>{rawText.split('\n').filter(Boolean).length} lines entered</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & SELECTION */}
        {step === 'preview' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Feedback & Stats Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-950">
                    {parsedQuestions.length} of {parsedQuestions.length} questions parsed successfully!
                  </span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Select the questions you want to {isAssessmentMode ? 'add to this assessment' : 'add to question bank'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  {selectedCount} / {parsedQuestions.length} Selected
                </span>

                {stats.attentionCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetMissingAnswersDefault('A')}
                    className="text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors"
                    title="Quickly fill missing answers with Option A"
                  >
                    Auto-set {stats.attentionCount} missing answers to A
                  </button>
                )}
              </div>
            </div>

            {/* Selection & Duplicate Controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {/* Select All Checkbox */}
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Select All ({parsedQuestions.length})</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span>Skip existing duplicates</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSyncCommonToAll}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
              >
                Apply Metadata to All
              </button>
            </div>

            {/* Duplicate Notification if found */}
            {duplicateWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
                <AlertIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">{duplicateWarnings.length} duplicate(s) detected:</span>{' '}
                  Question #{duplicateWarnings.join(', #')} already exist in repository.
                </div>
              </div>
            )}

            {/* Question Cards List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    q.isSelected
                      ? 'border-indigo-400 bg-indigo-50/20 ring-1 ring-indigo-400/30'
                      : 'border-slate-200 bg-white opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="checkbox"
                        checked={q.isSelected}
                        onChange={() => handleToggleSelectQuestion(idx)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0"
                      />
                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                        #{q.displayIndex}
                      </span>
                      {q.needsAttention ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          ⚠️ {q.issues.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          ✓ Ready
                        </span>
                      )}
                      {q.isDuplicate && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                          Duplicate
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold p-1 hover:bg-rose-50 rounded"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="mb-3">
                    <textarea
                      rows={2}
                      className="input-field text-xs py-1.5 font-medium bg-white"
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestion(idx, 'questionText', e.target.value)}
                    />
                  </div>

                  {/* Options with Click-to-Select-Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div
                        key={opt}
                        className={`flex items-center gap-1.5 p-1 rounded-lg border ${
                          q.correctAnswer === opt
                            ? 'border-emerald-500 bg-emerald-50/50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, 'correctAnswer', opt)}
                          className={`w-6 h-6 shrink-0 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                            q.correctAnswer === opt
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Click to mark Option ${opt} as correct answer`}
                        >
                          {opt}
                        </button>
                        <input
                          type="text"
                          className="w-full text-xs py-0.5 px-1 bg-transparent border-0 focus:outline-none text-slate-800"
                          placeholder={`Option ${opt}`}
                          value={q['option' + opt] || ''}
                          onChange={(e) => handleUpdateQuestion(idx, 'option' + opt, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Footer row: Correct answer selector and metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 items-center text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Correct Answer</label>
                      <select
                        className={`select-field text-xs py-1 w-full font-bold ${
                          !q.correctAnswer ? 'border-amber-400 bg-amber-50 text-amber-900' : 'bg-white text-emerald-800'
                        }`}
                        value={q.correctAnswer}
                        onChange={(e) => handleUpdateQuestion(idx, 'correctAnswer', e.target.value)}
                      >
                        <option value="">-- Pick Answer --</option>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Topic</label>
                      <select
                        className="select-field text-xs py-1 w-full bg-white"
                        value={q.topic}
                        onChange={(e) => handleUpdateQuestion(idx, 'topic', e.target.value)}
                      >
                        {DEFAULT_TOPICS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Difficulty</label>
                      <select
                        className="select-field text-xs py-1 w-full bg-white"
                        value={q.difficulty}
                        onChange={(e) => handleUpdateQuestion(idx, 'difficulty', e.target.value)}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Marks</label>
                      <input
                        type="number"
                        min="1"
                        className="input-field text-xs py-1 bg-white"
                        value={q.marks}
                        onChange={(e) => handleUpdateQuestion(idx, 'marks', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessText}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              >
                <span>Process & Preview Questions</span>
                <span>→</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="btn-secondary text-xs py-2 px-4"
              >
                ← Back to Paste Box
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || selectedCount === 0}
                  onClick={handleSave}
                  className="btn-primary text-xs py-2 px-6 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                >
                  {isSubmitting ? (
                    'Saving Questions...'
                  ) : isAssessmentMode ? (
                    `Add ${selectedCount} Questions to Assessment →`
                  ) : (
                    `Save ${selectedCount} Questions to Bank`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
