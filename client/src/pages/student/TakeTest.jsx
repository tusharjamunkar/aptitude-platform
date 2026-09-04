import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [testTitle, setTestTitle] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: 'A' | 'B' | 'C' | 'D' }
  const [timeLeft, setTimeLeft] = useState(3600);

  const [showWarning, setShowWarning] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scoreInfo, setScoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize test: start attempt + connect socket
  useEffect(() => {
    let newSocket;
    const initTest = async () => {
      try {
        // Start or resume attempt
        // Backend returns: { attempt: { id, startedAt, test: { duration, title } }, answers: [{ id, question: {...}, selectedAnswer }] }
        const res = await api.post('/attempts', { testId });
        const { attempt, answers: savedAnswers } = res.data;

        // Build question list from nested answers (no correctAnswer exposed)
        const qs = savedAnswers.map(a => ({
          id: a.question.id,
          questionText: a.question.questionText,
          optionA: a.question.optionA,
          optionB: a.question.optionB,
          optionC: a.question.optionC,
          optionD: a.question.optionD,
          marks: a.question.marks,
        }));

        // Pre-fill any previously saved answers
        const preFilled = {};
        savedAnswers.forEach(a => {
          if (a.selectedAnswer) preFilled[a.question.id] = a.selectedAnswer;
        });

        setAttemptId(attempt.id);
        setTestTitle(attempt.test?.title || 'Test');
        setQuestions(qs);
        setAnswers(preFilled);

        // Compute remaining time
        const startedAt = new Date(attempt.startedAt).getTime();
        const durationSec = (attempt.test?.duration || 60) * 60;
        const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
        setTimeLeft(Math.max(0, durationSec - elapsedSec));

        // Connect Socket.io
        newSocket = io(import.meta.env.VITE_API_URL || '', { path: '/socket.io' });
        setSocket(newSocket);
        newSocket.emit('join-attempt', attempt.id);

        newSocket.on('tab-warning', () => setShowWarning(true));
        newSocket.on('disqualified', (data) => {
          toast.error(data.message || 'Disqualified!');
          setScoreInfo({ score: 0, totalMarks: 0, percentage: 0 });
          setIsDisqualified(true);
        });

        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to start test');
        navigate('/student');
      }
    };
    initTest();
    return () => { newSocket?.disconnect(); };
  }, [testId]);

  // Anti-cheat: tab-switch and window blur detection
  useEffect(() => {
    if (!attemptId || !socket || isDisqualified || showResults) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        socket.emit('tab-switch', { attemptId, studentId: user.id });
      }
    };
    const handleBlur = () => {
      socket.emit('tab-switch', { attemptId, studentId: user.id });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attemptId, socket, isDisqualified, showResults, user?.id]);

  // Countdown timer
  useEffect(() => {
    if (loading || isDisqualified || showResults || timeLeft <= 0) return;
    if (timeLeft === 1) {
      handleSubmitTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isDisqualified, showResults]);

  const handleAnswerSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    // Save to backend (fire-and-forget)
    api.put(`/attempts/${attemptId}/answer`, { questionId, selectedAnswer: option }).catch(() => {});
  };

  const handleSubmitTest = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/attempts/${attemptId}/submit`);
      const attempt = res.data;
      const percentage = attempt.totalMarks > 0
        ? Math.round((attempt.score / attempt.totalMarks) * 100)
        : 0;
      setScoreInfo({ score: attempt.score, totalMarks: attempt.totalMarks, percentage });
      setShowResults(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit test');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Preparing your test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl border-4 border-red-500 animate-pulse">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">TAB SWITCHING DETECTED</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              This is your <strong>final warning</strong>. Switching tabs or leaving
              the window again will immediately <strong>disqualify</strong> you from this test.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              I Understand — Continue Test
            </button>
          </div>
        </div>
      )}

      {/* Disqualified Modal */}
      {isDisqualified && (
        <div className="fixed inset-0 z-50 bg-red-900/95 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-3xl font-bold text-red-700 mb-3">DISQUALIFIED</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              You have been disqualified for violating the tab-switching rules.
              This test attempt has been marked as failed.
            </p>
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
              <p className="text-2xl font-bold text-red-600">Score: 0</p>
            </div>
            <button
              onClick={() => navigate('/student')}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Submitted!</h2>
            <p className="text-gray-500 mb-6">Great job completing the test!</p>
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl mb-6">
              <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Your Score</p>
              <p className="text-5xl font-black text-blue-600">
                {scoreInfo?.score}
                <span className="text-xl text-gray-400 font-medium"> / {scoreInfo?.totalMarks}</span>
              </p>
              <p className={`text-2xl font-bold mt-2 ${scoreInfo?.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                {scoreInfo?.percentage}%
              </p>
              <p className={`text-sm mt-1 font-medium ${scoreInfo?.percentage >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                {scoreInfo?.percentage >= 80 ? '🌟 Excellent!' : scoreInfo?.percentage >= 60 ? '✅ Passed' : '❌ Below passing score'}
              </p>
            </div>
            <button
              onClick={() => navigate('/student')}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-white shadow-md h-16 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
        <div>
          <h1 className="text-sm md:text-base font-bold text-gray-800 truncate max-w-xs">{testTitle}</h1>
          <p className="text-xs text-gray-500">{answeredCount}/{questions.length} answered</p>
        </div>
        <div className={`text-lg md:text-xl font-mono font-bold px-4 py-1.5 rounded-lg ${
          timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' :
          timeLeft < 600 ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-800'
        }`}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <button
          onClick={handleSubmitTest}
          disabled={submitting}
          className="bg-green-600 text-white px-4 md:px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Question Navigator (sidebar) */}
        <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 p-4 flex-col shrink-0 overflow-y-auto">
          <h3 className="font-bold text-gray-600 mb-3 text-xs uppercase tracking-widest">Navigator</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = currentQIndex === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`h-9 w-9 rounded-md text-xs font-bold flex items-center justify-center border transition-all ${
                    isCurrent
                      ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50 text-blue-700'
                      : isAnswered
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-auto pt-6 space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-100 border border-green-300 rounded inline-block"></span>Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-white border border-gray-200 rounded inline-block"></span>Not answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-50 border border-blue-400 rounded ring-1 ring-blue-500 inline-block"></span>Current</div>
          </div>
        </aside>

        {/* Main Question Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {currentQ ? (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Question header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-semibold text-gray-700">
                    Question {currentQIndex + 1} <span className="text-gray-400 font-normal">of {questions.length}</span>
                  </span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                {/* Question text */}
                <div className="p-6 md:p-8">
                  <p className="text-lg font-medium text-gray-900 leading-relaxed mb-8 whitespace-pre-wrap">
                    {currentQ.questionText}
                  </p>

                  {/* Options */}
                  <div className="space-y-3">
                    {[
                      { key: 'A', text: currentQ.optionA },
                      { key: 'B', text: currentQ.optionB },
                      { key: 'C', text: currentQ.optionC },
                      { key: 'D', text: currentQ.optionD },
                    ].map(({ key, text }) => {
                      const isSelected = answers[currentQ.id] === key;
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 shadow-sm'
                              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="answer"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(currentQ.id, key)}
                          />
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border-2 shrink-0 ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600'
                          }`}>
                            {key}
                          </span>
                          <span className="text-gray-800 leading-relaxed">{text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQIndex === 0}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-500 hidden md:block">
                    {answeredCount} of {questions.length} answered
                  </span>
                  <button
                    onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQIndex === questions.length - 1}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No questions loaded</div>
          )}
        </main>
      </div>
    </div>
  );
}
