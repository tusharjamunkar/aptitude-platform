import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { CheckCircleIcon, ClockIcon } from '../../components/Icons';

export default function CreateTest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Quantitative & Logical Aptitude',
    topic: 'Comprehensive Assessment',
    description: '',
    duration: 45, // Exactly 45 minutes default
    isMandatory: true,
    warningsAllowed: 1
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/questions');
      const list = res.data || [];
      setQuestions(list);
      // Pre-select all questions if 45 exist
      if (list.length > 0 && selectedQuestions.length === 0) {
        setSelectedQuestions(list.map((q) => q.id));
      }
    } catch (err) {
      console.error('Error fetching questions for test creation:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectQuestion = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map((q) => q.id));
    }
  };

  const totalMarks = questions
    .filter((q) => selectedQuestions.includes(q.id))
    .reduce((acc, q) => acc + (q.marks || 1), 0);

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
      await api.post('/tests', payload);
      toast.success('Assessment created and published successfully!');
      navigate('/teacher');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create assessment');
    } finally {
      setSubmitting(false);
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
            <label className="label-text">Assessment Title</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Previous Year Aptitude Assessment (45 Questions)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Subject Discipline</label>
              <input
                type="text"
                className="input-field"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="label-text">Topic / Syllabus</label>
              <input
                type="text"
                className="input-field"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Description & Instructions</label>
            <textarea
              rows={3}
              className="input-field"
              placeholder="Provide test instructions and proctoring requirements for candidates..."
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
                setStep(2);
              }}
              className="btn-primary text-xs py-2 px-4"
            >
              Continue to Question Selection →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Questions */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-slate-900 text-sm">
                {selectedQuestions.length} of {questions.length} questions selected
              </span>
              <span className="text-slate-500 ml-2">({totalMarks} Total Marks)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All 45'}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isSelected = selectedQuestions.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelectQuestion(q.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Q{idx + 1}</span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {q.topic}
                      </span>
                      {q.sourceExam && (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {q.sourceExam}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">+{q.marks} mark</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 ml-6 line-clamp-2">
                    {q.questionText}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary text-xs py-2 px-4"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedQuestions.length === 0) {
                  toast.error('Please select at least 1 question');
                  return;
                }
                setStep(3);
              }}
              className="btn-primary text-xs py-2 px-4"
            >
              Proceed to Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <div className="card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Review Assessment Configuration</h2>
            <p className="text-xs text-slate-500">Confirm all assessment settings before publishing to student portal</p>
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
                <span className="text-slate-500">Question Count:</span>
                <span className="font-bold text-slate-900">{selectedQuestions.length} Questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maximum Marks:</span>
                <span className="font-bold text-emerald-600">{totalMarks} Marks</span>
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
    </div>
  );
}
