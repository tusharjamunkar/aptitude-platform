import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function CreateTest() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '', subject: 'Aptitude', topic: '', description: '',
    duration: 60, scheduledAt: '', deadline: '', isMandatory: false,
    warningsAllowed: 1, milestoneId: '', questions: []
  });
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && availableQuestions.length === 0) {
      api.get('/questions').then(res => setAvailableQuestions(res.data)).catch(() => {});
    }
  }, [step]);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const toggleQuestion = (id) => {
    setFormData(prev => {
      const q = prev.questions;
      if (q.includes(id)) return { ...prev, questions: q.filter(qid => qid !== id) };
      return { ...prev, questions: [...q, id] };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/tests', formData);
      toast.success('Test created successfully!');
      navigate('/teacher');
    } catch (err) {
      toast.error('Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = formData.questions.reduce((sum, id) => {
    const q = availableQuestions.find(aq => aq._id === id);
    return sum + (q ? q.marks : 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Test</h1>
        <div className="flex space-x-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium">Test Title</label><input type="text" name="title" required className="input-field mt-1" value={formData.title} onChange={handleInputChange}/></div>
              <div><label className="block text-sm font-medium">Topic</label><input type="text" name="topic" required className="input-field mt-1" value={formData.topic} onChange={handleInputChange}/></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium">Description</label><textarea name="description" className="input-field mt-1" rows="2" value={formData.description} onChange={handleInputChange}/></div>
              <div><label className="block text-sm font-medium">Duration (minutes)</label><input type="number" name="duration" min="1" required className="input-field mt-1" value={formData.duration} onChange={handleInputChange}/></div>
              <div><label className="block text-sm font-medium">Warnings Allowed</label>
                <select name="warningsAllowed" className="input-field mt-1" value={formData.warningsAllowed} onChange={handleInputChange}>
                  <option value={0}>0 (Strict)</option>
                  <option value={1}>1 (Lenient)</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium">Scheduled At</label><input type="datetime-local" name="scheduledAt" className="input-field mt-1" value={formData.scheduledAt} onChange={handleInputChange}/></div>
              <div><label className="block text-sm font-medium">Deadline</label><input type="datetime-local" name="deadline" className="input-field mt-1" value={formData.deadline} onChange={handleInputChange}/></div>
              <div className="md:col-span-2 flex items-center mt-2">
                <input type="checkbox" name="isMandatory" id="isMandatory" className="h-4 w-4 text-primary-600 border-gray-300 rounded" checked={formData.isMandatory} onChange={handleInputChange}/>
                <label htmlFor="isMandatory" className="ml-2 block text-sm text-gray-900">This is a mandatory test</label>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setStep(2)} disabled={!formData.title} className="btn-primary">Next: Add Questions</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select Questions</h2>
              <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                Selected: {formData.questions.length} | Total Marks: {totalMarks}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {availableQuestions.map(q => (
                <div key={q._id} className="p-3 border-b border-gray-200 flex items-start hover:bg-gray-50">
                  <input type="checkbox" className="mt-1 h-4 w-4 text-primary-600 rounded" checked={formData.questions.includes(q._id)} onChange={() => toggleQuestion(q._id)} />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                    <div className="flex space-x-3 mt-1 text-xs text-gray-500">
                      <span>Topic: {q.topic}</span>
                      <span>Marks: {q.marks}</span>
                      <span className={`px-1.5 rounded ${q.difficulty === 'Easy' ? 'bg-green-100' : q.difficulty === 'Hard' ? 'bg-red-100' : 'bg-yellow-100'}`}>{q.difficulty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button onClick={() => setStep(3)} disabled={formData.questions.length === 0} className="btn-primary">Next: Review</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Review Test Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Topic:</strong> {formData.topic}</p>
              <p><strong>Duration:</strong> {formData.duration} minutes</p>
              <p><strong>Warnings Allowed:</strong> {formData.warningsAllowed}</p>
              <p><strong>Mandatory:</strong> {formData.isMandatory ? 'Yes' : 'No'}</p>
              <p><strong>Total Questions:</strong> {formData.questions.length}</p>
              <p><strong>Total Marks:</strong> {totalMarks}</p>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Confirm & Create Test'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
