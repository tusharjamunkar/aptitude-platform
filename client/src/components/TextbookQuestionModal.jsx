import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  CameraIcon, 
  SparklesIcon, 
  AlertIcon, 
  CheckCircleIcon, 
  TrashIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  RefreshIcon,
  BookOpenIcon,
  PlusIcon
} from './Icons';
import { processAllTextbookPages, processSingleTextbookPage, preprocessAndAnalyzeImage } from '../utils/textbookOcrEngine';
import { extractQuestionAndOptions } from '../utils/textbookQuestionParser';

const PREDEFINED_TOPICS = [
  'Quantitative Aptitude',
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

export default function TextbookQuestionModal({
  isOpen,
  onClose,
  onQuestionsAdded,
  existingQuestions = [],
  initialTopic = 'Quantitative Aptitude',
  isAssessmentMode = true
}) {
  // Wizard steps: 'upload' | 'processing' | 'review'
  const [step, setStep] = useState('upload');
  
  // Uploaded Pages state: Array of { id, file, dataUrl, pageNumber, pageName, previewUrl }
  const [pages, setPages] = useState([]);
  const [pageStatuses, setPageStatuses] = useState({});
  const [activeEngine, setActiveEngine] = useState('auto'); // 'auto' | 'gemini' | 'tesseract'
  const [serverHasAi, setServerHasAi] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('aptitude_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const [previewingPageImage, setPreviewingPageImage] = useState(null);

  // Common metadata applied to batch
  const [commonMetadata, setCommonMetadata] = useState({
    topic: initialTopic || 'Quantitative Aptitude',
    difficulty: 'MEDIUM',
    marks: 1,
    negativeMarks: 0,
    sourceExam: 'Textbook Capture'
  });

  // Review State: Extracted Questions
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryingIndex, setRetryingIndex] = useState(null);

  // Camera capture modal state
  const [showCameraStream, setShowCameraStream] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const addMoreFileInputRef = useRef(null);
  const addMoreCameraInputRef = useRef(null);

  // Check server AI status on modal open
  useEffect(() => {
    if (isOpen) {
      api.get('/questions/ai-status')
        .then((res) => {
          setServerHasAi(Boolean(res.data?.hasServerAiKey));
          if (res.data?.hasServerAiKey) {
            setActiveEngine('gemini');
          }
        })
        .catch(() => setServerHasAi(false));
    }
  }, [isOpen]);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCameraStream(false);
  };

  // Clean up camera stream on unmount or when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Camera capture helpers
  const startCameraStream = async () => {
    try {
      setShowCameraStream(true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera access is not supported by your browser in this mode. Please upload photos instead.');
        setShowCameraStream(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Unable to access device camera. Please upload an image instead.');
      setShowCameraStream(false);
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const newPageNum = pages.length + 1;
    const newPage = {
      id: 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      dataUrl,
      pageNumber: newPageNum,
      pageName: `Page ${newPageNum} (Camera)`
    };

    setPages((prev) => [...prev, newPage]);
    stopCameraStream();
    toast.success(`Captured Page ${newPageNum}`);
  };

  // Handle file uploads (single or multiple)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPages = [];
    let loadedCount = 0;

    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const pageNum = pages.length + newPages.length + 1;
        newPages.push({
          id: 'page_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
          file,
          dataUrl: loadEvent.target.result,
          pageNumber: pageNum,
          pageName: file.name.length > 20 ? `Page ${pageNum}` : file.name
        });

        loadedCount++;
        if (loadedCount === files.length) {
          setPages((prev) => [...prev, ...newPages]);
          toast.success(`Added ${files.length} textbook page image(s)`);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleDeletePage = (pageId) => {
    setPages((prev) => {
      const filtered = prev.filter((p) => p.id !== pageId);
      return filtered.map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
        pageName: p.pageName.startsWith('Page ') ? `Page ${idx + 1}` : p.pageName
      }));
    });
  };

  // Run OCR Extraction Process
  const handleStartExtraction = async () => {
    if (pages.length === 0) {
      toast.error('Please upload or take at least one textbook page photo');
      return;
    }

    setStep('processing');

    const useAiEngine = activeEngine === 'gemini' || (activeEngine === 'auto' && (serverHasAi || Boolean(geminiApiKey)));

    try {
      const result = await processAllTextbookPages(
        pages,
        {
          useAi: useAiEngine,
          apiKey: geminiApiKey || undefined,
          isTwoColumn,
          defaultTopic: commonMetadata.topic,
          defaultDifficulty: commonMetadata.difficulty,
          onPageStatusUpdate: (statuses) => setPageStatuses(statuses)
        },
        existingQuestions
      );

      if (!result.questions || result.questions.length === 0) {
        toast.error('No questions could be confidently detected. Please check image clarity or retry.');
        setStep('upload');
        return;
      }

      setQuestions(result.questions);
      setStep('review');
      toast.success(`Successfully extracted ${result.questions.length} questions from ${pages.length} page(s)!`);
    } catch (err) {
      console.error('Textbook OCR processing failed:', err);
      toast.error('Extraction encountered an error: ' + (err.message || 'Please check images'));
      setStep('upload');
    }
  };

  // Review screen interactive controls
  const handleSelectAnswer = (qIndex, answerKey) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const target = { ...updated[qIndex], correctAnswer: answerKey };

      // Clear the "Teacher needs to select correct answer" issue if present
      const remainingIssues = (target.issues || []).filter(
        (issue) => !issue.toLowerCase().includes('select correct answer')
      );
      target.issues = remainingIssues;
      target.needsReview = remainingIssues.length > 0;
      updated[qIndex] = target;
      return updated;
    });
  };

  const handleUpdateQuestionField = (qIndex, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const target = { ...updated[qIndex], [field]: value };
      updated[qIndex] = target;
      return updated;
    });
  };

  const handleUpdateOption = (qIndex, optKey, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const target = { ...updated[qIndex] };
      target[`option${optKey}`] = value;
      target.optionsList = ['A', 'B', 'C', 'D'].map((k) => ({
        key: k,
        text: k === optKey ? value : target[`option${k}`] || ''
      }));
      updated[qIndex] = target;
      return updated;
    });
  };

  const handleDeleteQuestion = (qIndex) => {
    setQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== qIndex);
      return updated.map((q, idx) => ({ ...q, displayIndex: idx + 1 }));
    });
    toast.success('Question removed');
  };

  const handleMoveQuestion = (qIndex, direction) => {
    const targetIndex = direction === 'up' ? qIndex - 1 : qIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions((prev) => {
      const updated = [...prev];
      const temp = updated[qIndex];
      updated[qIndex] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated.map((q, idx) => ({ ...q, displayIndex: idx + 1 }));
    });
  };

  const handleToggleSelectQuestion = (qIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], isSelected: !updated[qIndex].isSelected };
      return updated;
    });
  };

  const handleToggleSelectAll = () => {
    const allAreSelected = questions.every((q) => q.isSelected);
    setQuestions((prev) => prev.map((q) => ({ ...q, isSelected: !allAreSelected })));
  };

  const handleDismissDuplicate = (qIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], isDuplicate: false, duplicateReason: null };
      return updated;
    });
    toast.success('Kept duplicate question');
  };

  const handleRemoveAllDuplicates = () => {
    setQuestions((prev) => {
      const nonDups = prev.filter((q) => !q.isDuplicate);
      return nonDups.map((q, idx) => ({ ...q, displayIndex: idx + 1 }));
    });
    toast.success('Removed duplicate questions');
  };

  const handleAutoAssignAnswers = (answerKey = 'A') => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (!q.correctAnswer) {
          const remainingIssues = (q.issues || []).filter(
            (issue) => !issue.toLowerCase().includes('select correct answer')
          );
          return {
            ...q,
            correctAnswer: answerKey,
            issues: remainingIssues,
            needsReview: remainingIssues.length > 0
          };
        }
        return q;
      })
    );
    toast.success(`Assigned Option ${answerKey} to unassigned questions`);
  };

  // Re-separate question prompt and options A, B, C, D for a single question
  const handleSeparateOptionsForQuestion = (qIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const target = { ...updated[qIndex] };
      const combinedText = [
        target.questionText,
        target.optionA ? `(A) ${target.optionA}` : '',
        target.optionB ? `(B) ${target.optionB}` : '',
        target.optionC ? `(C) ${target.optionC}` : '',
        target.optionD ? `(D) ${target.optionD}` : ''
      ].filter(Boolean).join(' ');

      const separated = extractQuestionAndOptions(combinedText);
      if (separated.hasSeparatedOptions) {
        target.questionText = separated.questionText;
        target.optionA = separated.optionA || target.optionA;
        target.optionB = separated.optionB || target.optionB;
        target.optionC = separated.optionC || target.optionC;
        target.optionD = separated.optionD || target.optionD;
        if (!target.correctAnswer && separated.correctAnswer) {
          target.correctAnswer = separated.correctAnswer;
        }
        target.optionsList = [
          { key: 'A', text: target.optionA },
          { key: 'B', text: target.optionB },
          { key: 'C', text: target.optionC },
          { key: 'D', text: target.optionD }
        ];

        const issues = [];
        const hasAll = Boolean(target.optionA && target.optionB && target.optionC && target.optionD);
        if (!hasAll) {
          const count = [target.optionA, target.optionB, target.optionC, target.optionD].filter(Boolean).length;
          issues.push(`Found ${count}/4 options`);
        }
        if (!target.correctAnswer) {
          issues.push('Teacher needs to select correct answer');
        }
        target.issues = issues;
        target.needsReview = issues.length > 0;
        updated[qIndex] = target;
        toast.success(`Separated question and options for Question #${target.displayIndex}`);
      } else {
        toast.error('Could not detect distinct option markers (A, B, C, D) in this text.');
      }
      return updated;
    });
  };

  // Auto-separate options across all questions in the review list
  const handleSeparateAllOptions = () => {
    let modifiedCount = 0;
    setQuestions((prev) =>
      prev.map((target) => {
        const hasMarkersInPrompt = /(?:\([a-eA-E1-4]\)|\[[a-eA-E1-4]\]|\b[a-dA-D]\.|\b[a-dA-D]\))\s+/i.test(target.questionText);
        const missingOptions = !target.optionA || !target.optionB;

        if (hasMarkersInPrompt || missingOptions) {
          const combined = [
            target.questionText,
            target.optionA ? `(A) ${target.optionA}` : '',
            target.optionB ? `(B) ${target.optionB}` : '',
            target.optionC ? `(C) ${target.optionC}` : '',
            target.optionD ? `(D) ${target.optionD}` : ''
          ].filter(Boolean).join(' ');

          const separated = extractQuestionAndOptions(combined);
          if (separated.hasSeparatedOptions) {
            modifiedCount++;
            const optA = separated.optionA || target.optionA;
            const optB = separated.optionB || target.optionB;
            const optC = separated.optionC || target.optionC;
            const optD = separated.optionD || target.optionD;
            const ans = target.correctAnswer || separated.correctAnswer || '';

            const issues = [];
            if (!optA || !optB || !optC || !optD) {
              const count = [optA, optB, optC, optD].filter(Boolean).length;
              issues.push(`Found ${count}/4 options`);
            }
            if (!ans) {
              issues.push('Teacher needs to select correct answer');
            }

            return {
              ...target,
              questionText: separated.questionText,
              optionA: optA,
              optionB: optB,
              optionC: optC,
              optionD: optD,
              optionsList: [
                { key: 'A', text: optA },
                { key: 'B', text: optB },
                { key: 'C', text: optC },
                { key: 'D', text: optD }
              ],
              correctAnswer: ans,
              issues,
              needsReview: issues.length > 0
            };
          }
        }
        return target;
      })
    );
    if (modifiedCount > 0) {
      toast.success(`Cleaned & separated options across ${modifiedCount} question(s)!`);
    } else {
      toast.info('Options are already properly separated across all questions.');
    }
  };

  // Retry extraction on a single question
  const handleRetryQuestionOcr = async (qIndex) => {
    const targetQ = questions[qIndex];
    const relatedPage = pages.find((p) => p.pageNumber === targetQ.pageNumber) || pages[0];
    if (!relatedPage) {
      toast.error('Source page image not available to retry');
      return;
    }

    setRetryingIndex(qIndex);
    try {
      const res = await processSingleTextbookPage(relatedPage, {
        useAi: activeEngine === 'gemini' || (activeEngine === 'auto' && (serverHasAi || Boolean(geminiApiKey))),
        apiKey: geminiApiKey || undefined,
        defaultTopic: commonMetadata.topic,
        defaultDifficulty: commonMetadata.difficulty
      });

      if (res.success && res.questions.length > 0) {
        // Find matching or first question
        const reExtracted = res.questions[0];
        setQuestions((prev) => {
          const updated = [...prev];
          updated[qIndex] = {
            ...updated[qIndex],
            questionText: reExtracted.questionText,
            optionA: reExtracted.optionA,
            optionB: reExtracted.optionB,
            optionC: reExtracted.optionC,
            optionD: reExtracted.optionD,
            confidence: reExtracted.confidence,
            needsReview: reExtracted.needsReview,
            issues: reExtracted.issues
          };
          return updated;
        });
        toast.success(`Re-extracted question from ${relatedPage.pageName}`);
      } else {
        toast.error('Retry could not recognize clearer text. Please edit manually.');
      }
    } catch (err) {
      toast.error('Retry failed: ' + err.message);
    } finally {
      setRetryingIndex(null);
    }
  };

  // Final Action: Save and add questions to assessment
  const handleSaveToAssessment = async () => {
    const selected = questions.filter((q) => q.isSelected);
    if (selected.length === 0) {
      toast.error('Please select at least 1 question to add to the assessment');
      return;
    }

    const unassignedCount = selected.filter((q) => !q.correctAnswer).length;
    if (unassignedCount > 0) {
      const proceed = window.confirm(
        `${unassignedCount} selected question(s) do not have a correct answer marked. Would you like to automatically assign Option 'A' as default and proceed?`
      );
      if (!proceed) return;
      selected.forEach((q) => {
        if (!q.correctAnswer) q.correctAnswer = 'A';
      });
    }

    setIsSubmitting(true);
    try {
      const payload = {
        questions: selected.map((q) => ({
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer || 'A',
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0,
          topic: q.topic || commonMetadata.topic,
          difficulty: q.difficulty || commonMetadata.difficulty,
          sourceExam: q.sourceExam || 'Textbook Capture'
        })),
        skipDuplicates: false,
        commonMetadata
      };

      const res = await api.post('/questions/bulk', payload);
      toast.success(res.data.message || `Added ${res.data.addedCount} questions to assessment!`);

      if (onQuestionsAdded) {
        await onQuestionsAdded(res.data);
      }

      onClose();
    } catch (err) {
      console.error('Failed to add questions to assessment:', err);
      toast.error(err.response?.data?.error || 'Failed to save questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = questions.filter((q) => q.isSelected).length;
  const duplicateCount = questions.filter((q) => q.isDuplicate).length;
  const attentionCount = questions.filter((q) => q.needsReview).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* HEADER BAR */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
              <CameraIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Add Questions from Textbook
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3 text-blue-600" />
                  AI & OCR Powered
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Snap or upload photos of textbook pages • AI reads questions & formulas • You simply pick correct answers
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

        {/* STEP 1: UPLOAD & PHOTO CAPTURE */}
        {step === 'upload' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Top Config Row & AI Mode Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3.5">
              
              {/* Vision AI Precision Banner */}
              <div className="rounded-xl border p-3.5 bg-gradient-to-r from-amber-50/80 via-indigo-50/60 to-blue-50/80 border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0 mt-0.5">✨</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        Google Gemini Multimodal Vision AI
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${geminiApiKey || serverHasAi ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                        {geminiApiKey || serverHasAi ? '✓ Active (99%+ Accuracy)' : 'Key Needed for 99%+ Accuracy'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Flawlessly separates question statements from options (A, B, C, D) and preserves math equations, fractions, and multi-column layouts.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    {geminiApiKey ? '⚙️ Edit Gemini Key' : '🔑 Enter Free API Key'}
                  </button>
                </div>
              </div>

              {/* Gemini Key Input Drawer */}
              {showKeyInput && (
                <div className="p-3.5 bg-white border border-indigo-300 rounded-xl space-y-2 shadow-xs text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Google Gemini API Key (Saved locally in your browser):
                    </span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1"
                    >
                      Get Free Key at Google AI Studio ↗
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
                      className="input-field text-xs py-1.5 bg-slate-50 w-full font-mono"
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        localStorage.setItem('aptitude_gemini_key', e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(false)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}

              {/* 2-Column Textbook Layout Option */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50/80 transition-colors shadow-xs">
                <input
                  type="checkbox"
                  checked={isTwoColumn}
                  onChange={(e) => setIsTwoColumn(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📖 2-Column Textbook Page Layout</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">Recommended for R.S. Aggarwal & Exam Guides</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Automatically slices the page into Left & Right vertical columns before reading, preventing horizontal line mixing across questions and options.
                  </span>
                </div>
              </label>

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/80">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Topic / Subject</label>
                  <select
                    className="select-field text-xs py-1.5 w-full bg-white"
                    value={commonMetadata.topic}
                    onChange={(e) => setCommonMetadata({ ...commonMetadata, topic: e.target.value })}
                  >
                    {PREDEFINED_TOPICS.map((t) => (
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
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Marks per Question</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field text-xs py-1.5 bg-white"
                    value={commonMetadata.marks}
                    onChange={(e) => setCommonMetadata({ ...commonMetadata, marks: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>

            {/* Camera Viewfinder (if camera stream is active) */}
            {showCameraStream ? (
              <div className="card p-4 space-y-3 bg-slate-900 border-slate-700 text-white">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    Live Camera Feed — Position Textbook Page
                  </span>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel Camera
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  {/* Framing Overlay */}
                  <div className="absolute inset-8 border-2 border-dashed border-white/60 pointer-events-none rounded-lg flex items-center justify-center">
                    <span className="text-white/80 bg-black/60 px-3 py-1 rounded text-xs">
                      Align textbook questions inside this box
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={capturePhotoFromCamera}
                    className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md"
                  >
                    <CameraIcon className="w-4 h-4" />
                    <span>Capture Page Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Capture & Upload Trigger Box */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Take Photo with Device Camera */}
                <div className="border-2 border-dashed border-blue-300 hover:border-blue-400 bg-blue-50/40 rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-between shadow-xs">
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md mb-2">
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                      Take Photo with Camera
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mb-3">
                      Snap physical textbook pages using your phone camera or laptop webcam
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-center w-full">
                    {/* Mobile / Tablet Direct Camera */}
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current && nativeCameraInputRef.current.click()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      title="Opens the device camera directly"
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      <span>Phone Camera</span>
                    </button>

                    {/* Desktop / Laptop Live Webcam */}
                    <button
                      type="button"
                      onClick={startCameraStream}
                      className="px-3.5 py-1.5 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      title="Opens live browser webcam stream"
                    >
                      <span>Webcam Stream</span>
                    </button>
                  </div>
                </div>

                {/* 2. Upload from File Manager */}
                <div
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-between shadow-xs group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform mb-2">
                      <BookOpenIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                      Upload from File Manager
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mb-3">
                      Select saved textbook photos, scans, or screenshots from your computer or phone folders
                    </p>
                  </div>

                  <span className="px-4 py-1.5 bg-indigo-600 text-white group-hover:bg-indigo-700 text-xs font-bold rounded-lg shadow-xs transition-colors">
                    📂 Open File Manager →
                  </span>
                </div>
              </div>
            )}

            {/* Uploaded Pages Grid Strip */}
            {pages.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Captured Pages ({pages.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Multiple questions on these pages will be automatically detected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current && nativeCameraInputRef.current.click()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                      title="Snap another photo with your device camera"
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      <span>Snap with Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addMoreFileInputRef.current && addMoreFileInputRef.current.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                      title="Pick more photos from file manager"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>Add from File Manager</span>
                    </button>
                    <input
                      ref={addMoreFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {pages.map((p, pIdx) => (
                    <div
                      key={p.id}
                      className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 group overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white mb-2 relative">
                        <img
                          src={p.dataUrl}
                          alt={p.pageName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Page {p.pageNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate font-semibold text-slate-700 text-[11px]">
                          {p.pageName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(p.id)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50"
                          title="Delete page"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: MULTI-IMAGE PROCESSING & STATUS */}
        {step === 'processing' && (
          <div className="p-8 overflow-y-auto space-y-6 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-1 animate-pulse">
              <SparklesIcon className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Extracting Questions with OCR & AI
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Reading math equations, fractions, options, and isolating individual questions across {pages.length} page(s)...
              </p>
            </div>

            {/* Real-time Per-Page Processing Status Box */}
            <div className="w-full max-w-lg bg-slate-50 rounded-xl border border-slate-200 p-4 text-left space-y-2.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Page Progress & Detection Status:
              </div>

              {pages.map((p) => {
                const s = pageStatuses[p.id] || { status: 'PENDING', statusText: 'Queued...' };
                const isDone = s.status === 'PROCESSED';
                const isProc = s.status === 'PROCESSING';
                const isWarn = s.status === 'WARNING';

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-800">Page {p.pageNumber}:</span>
                      <span className="text-slate-600 text-[11px] truncate max-w-[200px]">
                        {s.statusText || 'Processing...'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDone ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          ✓ {s.detectedCount} Qs
                        </span>
                      ) : isProc ? (
                        <span className="text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          ⟳ Reading...
                        </span>
                      ) : isWarn ? (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          ⚠ Needs Review
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Waiting</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400">
              Please keep this window open while pages are being parsed.
            </p>
          </div>
        )}

        {/* STEP 3: AI QUESTION REVIEW SCREEN */}
        {step === 'review' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Top Status & Summary Banner */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950">
                    AI Question Review — {questions.length} Questions Detected
                  </h3>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Your primary job: <strong>Select the correct answer (A, B, C, D)</strong> for each question below.
                  </p>
                </div>
              </div>

              {/* Action Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                  {selectedCount} / {questions.length} Selected
                </span>

                {attentionCount > 0 && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    ⚠ {attentionCount} need review
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleAutoAssignAnswers('A')}
                  className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                  title="Quickly fill unassigned answers with A"
                >
                  Quick-fill missing as A
                </button>
              </div>
            </div>

            {/* Quick Actions & Duplicate Notice Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={questions.length > 0 && questions.every((q) => q.isSelected)}
                    onChange={handleToggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Select All ({questions.length})</span>
                </label>

                {duplicateCount > 0 && (
                  <button
                    type="button"
                    onClick={handleRemoveAllDuplicates}
                    className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Remove {duplicateCount} Overlapping Duplicate(s)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSeparateAllOptions}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Automatically scan and cleanly separate question prompts from answer options across all questions"
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-Separate Options (All)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add Another Page Photo</span>
                </button>
              </div>
            </div>

            {/* Question Cards List */}
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isSelected = q.isSelected;
                const hasIssues = q.needsReview || !q.correctAnswer;
                const isDuplicate = q.isDuplicate;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-xl border transition-all ${
                      hasIssues
                        ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400/40'
                        : isSelected
                        ? 'border-blue-300 bg-blue-50/10 shadow-xs'
                        : 'border-slate-200 bg-white opacity-70'
                    }`}
                  >
                    {/* Question Header & Order Controls */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="checkbox"
                          checked={Boolean(isSelected)}
                          onChange={() => handleToggleSelectQuestion(idx)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                        />
                        <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          Question {q.displayIndex}
                        </span>

                        {q.pageName && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {q.pageName}
                          </span>
                        )}

                        {/* View Source Page Photo */}
                        <button
                          type="button"
                          onClick={() => {
                            const pageObj = pages.find((p) => p.pageNumber === q.pageNumber);
                            setPreviewingPageImage(q.pageImage || pageObj?.dataUrl || null);
                          }}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors flex items-center gap-1"
                          title="View textbook page photo for this question"
                        >
                          <span>🖼️ View Photo</span>
                        </button>

                        {/* Uncertainty Highlighting */}
                        {hasIssues && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertIcon className="w-3 h-3 text-amber-600" />
                            {q.issues?.length > 0 ? q.issues.join(' • ') : 'Select Correct Answer'}
                          </span>
                        )}

                        {/* Duplicate Alert */}
                        {isDuplicate && (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⚠️ {q.duplicateReason || 'Potential duplicate'}
                            <button
                              type="button"
                              onClick={() => handleDismissDuplicate(idx)}
                              className="ml-1 text-[9px] underline text-rose-900 hover:text-black font-semibold"
                            >
                              Keep Anyway
                            </button>
                          </span>
                        )}

                        {!hasIssues && !isDuplicate && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Verified & Ready
                          </span>
                        )}
                      </div>

                      {/* Header Actions: Separate Options, Reorder, Retry, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSeparateOptionsForQuestion(idx)}
                          className="px-2 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1 border border-indigo-200 transition-colors"
                          title="Click to automatically split options out of question text"
                        >
                          <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Separate Options</span>
                        </button>

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move Question Up"
                        >
                          <ArrowUpIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move Question Down"
                        >
                          <ArrowDownIcon className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={retryingIndex === idx}
                          onClick={() => handleRetryQuestionOcr(idx)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 text-xs font-semibold"
                          title="Re-run OCR for this question"
                        >
                          <RefreshIcon className={`w-3.5 h-3.5 ${retryingIndex === idx ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                          title="Delete Question"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt Editor */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Question Prompt Statement (No Options):
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Problem statement / formula only
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        className="input-field text-xs py-1.5 font-medium bg-white leading-relaxed border-slate-300"
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestionField(idx, 'questionText', e.target.value)}
                      />

                      {/* Smart Detection Alert if prompt contains embedded options */}
                      {((/(?:\([a-eA-E1-4]\)|\[[a-eA-E1-4]\]|\b[a-dA-D]\.|\b[a-dA-D]\))\s+/i.test(q.questionText)) || (!q.optionA && !q.optionB)) && (
                        <div className="mt-1.5 p-2 bg-indigo-50/90 border border-indigo-200 rounded-lg flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-indigo-900">
                            <span className="text-sm">⚡</span>
                            <span className="text-[11px] font-semibold">
                              Answer choices detected inside prompt text
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSeparateOptionsForQuestion(idx)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold transition-all shadow-xs shrink-0 flex items-center gap-1"
                          >
                            <SparklesIcon className="w-3 h-3" />
                            <span>Separate into Options A-D →</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Options Grid (A, B, C, D) with Answer Radio Buttons */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Options & Correct Answer Selection:
                        </label>
                        <span className="text-[11px] text-blue-700 font-semibold">
                          Click option letter or radio to set correct answer
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {['A', 'B', 'C', 'D'].map((optKey) => {
                          const isCorrect = q.correctAnswer === optKey;
                          return (
                            <div
                              key={optKey}
                              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              {/* Radio Button */}
                              <input
                                type="radio"
                                name={`q_ans_${q.id}`}
                                checked={isCorrect}
                                onChange={() => handleSelectAnswer(idx, optKey)}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer ml-1"
                              />

                              {/* Letter Badge */}
                              <button
                                type="button"
                                onClick={() => handleSelectAnswer(idx, optKey)}
                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {optKey}
                              </button>

                              {/* Option Input Field */}
                              <input
                                type="text"
                                className="w-full text-xs py-1 px-1 bg-transparent border-0 focus:outline-none text-slate-800 font-medium"
                                placeholder={`Option ${optKey}`}
                                value={q[`option${optKey}`] || ''}
                                onChange={(e) => handleUpdateOption(idx, optKey, e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Metadata Strip for this question */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Topic</label>
                        <select
                          className="select-field text-xs py-1 w-full bg-white"
                          value={q.topic}
                          onChange={(e) => handleUpdateQuestionField(idx, 'topic', e.target.value)}
                        >
                          {PREDEFINED_TOPICS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Difficulty</label>
                        <select
                          className="select-field text-xs py-1 w-full bg-white"
                          value={q.difficulty}
                          onChange={(e) => handleUpdateQuestionField(idx, 'difficulty', e.target.value)}
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
                          value={q.marks || 1}
                          onChange={(e) => handleUpdateQuestionField(idx, 'marks', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL FOOTER BUTTONS */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          {step === 'upload' ? (
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
                disabled={pages.length === 0}
                onClick={handleStartExtraction}
                className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Extract Questions from {pages.length} Page(s) →</span>
              </button>
            </>
          ) : step === 'processing' ? (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel Extraction
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <span>← Upload More Pages</span>
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
                  onClick={handleSaveToAssessment}
                  className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md font-bold"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Adding to Assessment...'
                      : `Add ${selectedCount} Selected Questions to Assessment →`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Page Image Inspection Lightbox */}
      {previewingPageImage && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl max-w-4xl max-h-[92vh] w-full flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>📖 Textbook Page Reference</span>
                <span className="text-slate-500 font-normal hidden sm:inline">(Refer to this photo to check question statements, answer choices & formulas)</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewingPageImage(null)}
                className="text-slate-500 hover:text-slate-800 font-bold px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors text-xs"
              >
                ✕ Close Preview
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/10">
              <img
                src={previewingPageImage}
                alt="Textbook Page Reference"
                className="max-h-[75vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
