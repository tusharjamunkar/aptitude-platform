import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ClockIcon, ShieldCheckIcon, AlertIcon, CheckCircleIcon } from '../../components/Icons';

export default function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isRetakeRequested = searchParams.get('mode') === 'retest' || searchParams.get('retest') === 'true';

  const [attemptId, setAttemptId] = useState(null);
  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60); // default in seconds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Errors and Not Found states
  const [isTestNotFound, setIsTestNotFound] = useState(false);
  const [testError, setTestError] = useState(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  // Refs for tracking submission and proctoring
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const hasSubmittedRef = useRef(false);

  // Initialize test attempt (handles both initial start and F5 refresh resume)
  useEffect(() => {
    let socket;
    const init = async () => {
      try {
        setLoading(true);
        setIsTestNotFound(false);
        setTestError(null);

        const res = await api.post('/attempts', { 
          testId, 
          isRetake: isRetakeRequested 
        });
        const { attempt, answers: initialAnswers, isAlreadyCompleted } = res.data;

        // Clean query string from URL once loaded so subsequent F5 refreshes resume cleanly
        if (isRetakeRequested && !isAlreadyCompleted) {
          navigate(`/take-test/${testId}`, { replace: true });
        }

        // If the student already completed this test earlier and refreshed
        if (isAlreadyCompleted || attempt.status === 'COMPLETED') {
          hasSubmittedRef.current = true;
          isSubmittingRef.current = true;
          setAttemptId(attempt.id);
          setTestTitle(attempt.test?.title || 'Aptitude Assessment');
          setScoreResult({
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            status: attempt.status
          });
          setShowResults(true);
          setLoading(false);
          return;
        }

        // If the attempt was previously disqualified
        if (attempt.status === 'DISQUALIFIED') {
          setAttemptId(attempt.id);
          setTestTitle(attempt.test?.title || 'Aptitude Assessment');
          setIsDisqualified(true);
          setLoading(false);
          return;
        }

        setAttemptId(attempt.id);
        setTestTitle(attempt.test?.title || 'Aptitude Assessment');

        // Map questions
        const mappedQuestions = initialAnswers.map((a) => ({
          id: a.question.id,
          questionText: a.question.questionText,
          optionA: a.question.optionA,
          optionB: a.question.optionB,
          optionC: a.question.optionC,
          optionD: a.question.optionD,
          marks: a.question.marks,
          negativeMarks: a.question.negativeMarks || 0,
          topic: a.question.topic,
          sourceExam: a.question.sourceExam
        }));
        setQuestions(mappedQuestions);

        // Preload existing answers saved in DB, merged with local attempt-specific buffer for zero data loss
        const answerMap = {};
        initialAnswers.forEach((a) => {
          if (a.selectedAnswer) answerMap[a.question.id] = a.selectedAnswer;
        });

        // If local storage has any buffered answers for this specific attempt & user, merge them
        if (user?.id) {
          try {
            const cachedRaw = sessionStorage.getItem(`attempt_${attempt.id}_answers_${user.id}`);
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw);
              if (cached && typeof cached === 'object') {
                Object.assign(answerMap, cached);
              }
            }
          } catch (e) {}
        }
        setAnswers(answerMap);

        // Restore active question index from sessionStorage if available
        const savedQIndex = sessionStorage.getItem(`attempt_${attempt.id}_qIndex`);
        if (savedQIndex !== null && !isNaN(parseInt(savedQIndex, 10))) {
          const parsed = parseInt(savedQIndex, 10);
          if (parsed >= 0 && parsed < mappedQuestions.length) {
            setCurrentQIndex(parsed);
          }
        }

        // Calculate timer: remaining = durationSec - elapsedSec
        const durationMin = attempt.test?.duration || 45;
        const durationSec = durationMin * 60;
        const startedAtMs = new Date(attempt.startedAt).getTime();
        const elapsedSec = Math.floor((Date.now() - startedAtMs) / 1000);
        const remaining = Math.max(0, durationSec - elapsedSec);
        setTimeLeft(remaining);

        // If time already expired while student was away, trigger auto-submit
        if (remaining <= 0) {
          setTimeLeft(0);
          handleAutoSubmit(attempt.id);
          return;
        }

        // Connect Socket.io for proctoring
        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
        socket = io(socketUrl, { path: '/socket.io' });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-attempt', attempt.id);
        });

        socket.on('tab-warning', () => {
          if (!isSubmittingRef.current && !hasSubmittedRef.current) {
            setShowWarning(true);
          }
        });

        socket.on('disqualified', () => {
          if (!isSubmittingRef.current && !hasSubmittedRef.current) {
            setIsDisqualified(true);
          }
        });
      } catch (err) {
        console.error('Failed to initialize attempt:', err);
        const status = err.response?.status;
        const errMsg = err.response?.data?.error;

        if (status === 404) {
          setIsTestNotFound(true);
        } else if (status === 403) {
          setTestError(errMsg || 'You do not have access to this assessment.');
        } else {
          setTestError(errMsg || 'Failed to load assessment. Please check your network connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [testId]);

  // Persist current question index in sessionStorage
  useEffect(() => {
    if (attemptId && currentQIndex >= 0) {
      sessionStorage.setItem(`attempt_${attemptId}_qIndex`, currentQIndex.toString());
    }
  }, [currentQIndex, attemptId]);

  // Ref to track any pending unsaved answers for unload flushing
  const pendingAnswerRef = useRef(null);
  const isUnloadingRef = useRef(false);

  // Suppress false positive proctoring violations during page reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
      // If there's an in-flight answer selection during reload, flush it via fetch keepalive
      if (pendingAnswerRef.current && attemptId) {
        const { questionId, selectedAnswer } = pendingAnswerRef.current;
        const apiUrl = import.meta.env.VITE_API_URL 
          ? `${import.meta.env.VITE_API_URL}/api/attempts/${attemptId}/answer`
          : `/api/attempts/${attemptId}/answer`;
        const token = localStorage.getItem('token');
        try {
          fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ questionId, selectedAnswer }),
            keepalive: true
          });
        } catch (e) {
          // ignore keepalive network error on unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [attemptId]);

  // Tab switch & visibility change detector
  // IMPORTANT: Will NOT trigger when submitting, submitted, unloading/refreshing, or in result view
  useEffect(() => {
    if (!attemptId || isDisqualified || showResults) return;

    const handleTabViolation = () => {
      if (isSubmittingRef.current || hasSubmittedRef.current || isUnloadingRef.current || isDisqualified || showResults) {
        return;
      }
      if (document.hidden && socketRef.current) {
        socketRef.current.emit('tab-switch', { attemptId, studentId: user?.id });
      }
    };

    const handleWindowBlur = () => {
      if (isSubmittingRef.current || hasSubmittedRef.current || isUnloadingRef.current || isDisqualified || showResults) {
        return;
      }
      if (socketRef.current) {
        socketRef.current.emit('tab-switch', { attemptId, studentId: user?.id });
      }
    };

    document.addEventListener('visibilitychange', handleTabViolation);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleTabViolation);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attemptId, isDisqualified, showResults, user]);

  // Countdown timer with auto-submit on expiration
  useEffect(() => {
    if (loading || isDisqualified || showResults || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit(attemptId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isDisqualified, showResults, attemptId]);

  const handleSelectAnswer = async (questionId, option) => {
    if (isDisqualified || submitting || isSubmittingRef.current) return;

    // 1. Optimistically update React state
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: option };
      // 2. Persist synchronously in attempt-specific sessionStorage
      if (attemptId && user?.id) {
        try {
          sessionStorage.setItem(`attempt_${attemptId}_answers_${user.id}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    // Track pending save for reload safety
    pendingAnswerRef.current = { questionId, selectedAnswer: option };

    // 3. Persist to backend database via REST API
    try {
      await api.put(`/attempts/${attemptId}/answer`, {
        questionId,
        selectedAnswer: option
      });
      if (pendingAnswerRef.current?.questionId === questionId) {
        pendingAnswerRef.current = null;
      }
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleClearAnswer = async (questionId) => {
    if (isDisqualified || submitting || isSubmittingRef.current) return;

    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      if (attemptId && user?.id) {
        try {
          sessionStorage.setItem(`attempt_${attemptId}_answers_${user.id}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    pendingAnswerRef.current = { questionId, selectedAnswer: null };

    try {
      await api.put(`/attempts/${attemptId}/answer`, {
        questionId,
        selectedAnswer: null
      });
      if (pendingAnswerRef.current?.questionId === questionId) {
        pendingAnswerRef.current = null;
      }
    } catch (err) {
      console.error('Failed to clear answer:', err);
    }
  };

  const handleAutoSubmit = async (activeAttemptId) => {
    toast.error('Allotted test time has elapsed! Submitting assessment...');
    await executeSubmission(activeAttemptId || attemptId);
  };

  const executeSubmission = async (targetAttemptId) => {
    const aid = targetAttemptId || attemptId;
    if (isSubmittingRef.current || hasSubmittedRef.current || !aid) return;

    // Set submission guard flags immediately to block tab-switch listeners
    isSubmittingRef.current = true;
    setSubmitting(true);
    setShowConfirmModal(false);

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Leave proctoring room
    if (socketRef.current) {
      try {
        socketRef.current.emit('leave-attempt', aid);
      } catch (e) {}
    }

    try {
      const res = await api.post(`/attempts/${aid}/submit`);
      hasSubmittedRef.current = true;
      setScoreResult(res.data);
      setShowResults(true);
      toast.success('Assessment submitted successfully!');
      if (aid) {
        sessionStorage.removeItem(`attempt_${aid}_qIndex`);
        if (user?.id) sessionStorage.removeItem(`attempt_${aid}_answers_${user.id}`);
      }
    } catch (err) {
      // Allow retry only if network error occurred
      isSubmittingRef.current = false;
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRetest = async () => {
    try {
      setLoading(true);
      setShowResults(false);
      setScoreResult(null);
      hasSubmittedRef.current = false;
      isSubmittingRef.current = false;
      setAnswers({});
      setCurrentQIndex(0);

      const res = await api.post('/attempts/retest', { testId });
      const { attempt: newAttempt, answers: newAnswers } = res.data;

      setAttemptId(newAttempt.id);
      setTestTitle(newAttempt.test?.title || 'Aptitude Assessment');
      sessionStorage.removeItem(`attempt_${newAttempt.id}_qIndex`);
      if (user?.id) sessionStorage.removeItem(`attempt_${newAttempt.id}_answers_${user.id}`);

      const mappedQuestions = newAnswers.map((a) => ({
        id: a.question.id,
        questionText: a.question.questionText,
        optionA: a.question.optionA,
        optionB: a.question.optionB,
        optionC: a.question.optionC,
        optionD: a.question.optionD,
        marks: a.question.marks,
        negativeMarks: a.question.negativeMarks || 0,
        topic: a.question.topic,
        sourceExam: a.question.sourceExam
      }));
      setQuestions(mappedQuestions);

      const durationMin = newAttempt.test?.duration || 45;
      setTimeLeft(durationMin * 60);

      if (socketRef.current) {
        socketRef.current.emit('join-attempt', newAttempt.id);
      }

      toast.success(`Starting Attempt #${newAttempt.attemptNumber || 2}!`);
    } catch (err) {
      console.error('Failed to start retest:', err);
      toast.error(err.response?.data?.error || 'Failed to start new attempt.');
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  // Format time remaining
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-sm">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-700">Setting up proctored test environment...</p>
          <p className="text-xs text-slate-500 mt-1">Verifying attempt session and restoring answers</p>
        </div>
      </div>
    );
  }

  // 2. Legitimate 404 - Test Not Found View
  if (isTestNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Assessment Not Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            The assessment ID <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">{testId}</code> does not exist or has been removed by the instructor. Please verify the URL or select an active assessment from your dashboard.
          </p>
          <button
            onClick={() => navigate('/student')}
            className="btn-primary w-full py-2.5 text-xs font-semibold"
          >
            Back to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 3. Error / Access Denied State (403 or server error)
  if (testError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Assessment Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            {testError}
          </p>
          <button
            onClick={() => navigate('/student')}
            className="btn-primary w-full py-2.5 text-xs font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* Test Room Sticky Topbar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 font-bold text-sm">
            {currentQIndex + 1}
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
              {testTitle}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Anti-Cheat Active</span>
              </span>
              <span>•</span>
              <span>{answeredCount} of {questions.length} Answered</span>
            </div>
          </div>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm transition-colors ${
              timeLeft < 300
                ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                : timeLeft < 600
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
            className="btn-primary text-xs py-2 px-4"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Question & Options Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full">
            {currentQ && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                {/* Question Metadata Header */}
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Question {currentQIndex + 1} of {questions.length}
                    </span>
                    {currentQ.topic && (
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                        {currentQ.topic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentQ.sourceExam && (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {currentQ.sourceExam}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-500">
                      +{currentQ.marks} mark{currentQ.marks > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-base md:text-lg font-medium text-slate-900 leading-relaxed mb-6">
                  {currentQ.questionText}
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const optText = currentQ[`option${opt}`];
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id, opt)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {opt}
                        </div>
                        <div className="flex-1 pt-0.5 leading-normal">{optText}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls Footer */}
          <div className="max-w-3xl mx-auto w-full pt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="btn-secondary text-xs py-2 px-4"
            >
              ← Previous
            </button>

            {answers[currentQ?.id] && (
              <button
                onClick={() => handleClearAnswer(currentQ.id)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
              >
                Clear Selection
              </button>
            )}

            <button
              onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQIndex === questions.length - 1}
              className="btn-secondary text-xs py-2 px-4"
            >
              Next →
            </button>
          </div>
        </main>

        {/* Right Question Matrix Navigator Sidebar */}
        <aside className="w-full md:w-72 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-5 flex flex-col justify-between shrink-0">
          <div>
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Question Palette
              </h3>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-200"></span>
                  <span>Pending</span>
                </div>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 md:max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentQIndex === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all border ${
                      isCurrent
                        ? 'border-blue-600 ring-2 ring-blue-600/30 font-extrabold'
                        : 'border-transparent'
                    } ${
                      isAnswered
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500">
              <p className="font-semibold text-slate-700">Exam Integrity Notice</p>
              <p className="mt-1 leading-normal">
                Do not switch browser tabs or minimize window during the examination.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* In-App Confirmation Modal (Replaces window.confirm) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Please confirm that you want to finish and submit your test.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-left">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Answered</span>
                <span className="text-base font-bold text-emerald-600">{answeredCount} questions</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Unanswered</span>
                <span className="text-base font-bold text-amber-600">{unansweredCount} questions</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-6">
              Once submitted, your answers are finalized and cannot be modified.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Review Answers
              </button>
              <button
                onClick={() => executeSubmission(attemptId)}
                disabled={submitting}
                className="btn-primary flex-1 py-2.5 text-xs font-semibold"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-xl border border-amber-200 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tab Switch Detected</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              You navigated away from the assessment window. This is your <strong>first and final warning</strong>. If you switch tabs or leave this window again, you will be automatically disqualified with zero marks.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="btn-primary w-full py-2.5 text-xs"
            >
              I Understand, Resume Test
            </button>
          </div>
        </div>
      )}

      {/* Disqualified Modal */}
      {isDisqualified && (
        <div className="fixed inset-0 bg-slate-900/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-red-200 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Disqualified from Assessment</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Multiple tab-switching violations were detected. As per institutional examination integrity policy, your assessment has been terminated.
            </p>
            <button
              onClick={() => navigate('/student')}
              className="btn-secondary w-full py-2.5 text-xs"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && scoreResult && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Assessment Completed!</h3>
            <p className="text-xs text-slate-500 mb-6">Your answers have been evaluated</p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Final Score:</span>
                <span className="font-bold text-slate-900">{scoreResult.score} / {scoreResult.totalMarks}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Percentage:</span>
                <span className="font-bold text-blue-600">
                  {scoreResult.totalMarks > 0
                    ? Math.round((scoreResult.score / scoreResult.totalMarks) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Status:</span>
                <span className="font-semibold text-emerald-600">Submitted</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleStartRetest}
                className="btn-primary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>🔄 Retake Assessment</span>
              </button>
              <button
                onClick={() => navigate('/student/analytics')}
                className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
              >
                Performance Analysis
              </button>
              <button
                onClick={() => navigate('/student')}
                className="btn-secondary py-2.5 px-3 text-xs font-semibold"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
