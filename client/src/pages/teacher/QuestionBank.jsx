import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TOPICS = [
  'Number System', 'Percentages', 'Profit and Loss', 'Simple Interest', 'Compound Interest', 
  'Time and Work', 'Time Speed Distance', 'Ratio and Proportion', 'Averages', 'Ages', 
  'Probability', 'Permutations and Combinations', 'Data Interpretation', 'Logical Reasoning', 
  'Verbal Ability', 'Coding Decoding', 'Blood Relations', 'Syllogisms', 'Directions', 
  'Clocks', 'Calendars', 'Mixtures and Alligation', 'Pipes and Cisterns', 'Trains', 'Boats and Streams'
];

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A', marks: 1, topic: TOPICS[0], difficulty: 'Easy', negativeMarks: 0
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions').catch(() => ({ data: [] }));
      setQuestions(res.data);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/questions', formData);
      toast.success('Question added successfully');
      setIsModalOpen(false);
      fetchQuestions();
      setFormData({
        questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
        correctAnswer: 'A', marks: 1, topic: TOPICS[0], difficulty: 'Easy', negativeMarks: 0
      });
    } catch (err) {
      toast.error('Failed to add question');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">Add Question</button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map((q) => (
                <tr key={q._id}>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">{q.questionText}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{q.topic}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      q.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
                      q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{q.marks}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                    <button className="text-danger-600 hover:text-danger-900">Delete</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No questions found. Add some to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Question Text</label>
                <textarea name="questionText" required rows="3" className="input-field mt-1" value={formData.questionText} onChange={handleInputChange}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Option A</label><input type="text" name="optionA" required className="input-field mt-1" value={formData.optionA} onChange={handleInputChange}/></div>
                <div><label className="block text-sm font-medium">Option B</label><input type="text" name="optionB" required className="input-field mt-1" value={formData.optionB} onChange={handleInputChange}/></div>
                <div><label className="block text-sm font-medium">Option C</label><input type="text" name="optionC" required className="input-field mt-1" value={formData.optionC} onChange={handleInputChange}/></div>
                <div><label className="block text-sm font-medium">Option D</label><input type="text" name="optionD" required className="input-field mt-1" value={formData.optionD} onChange={handleInputChange}/></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Correct Answer</label>
                  <select name="correctAnswer" className="input-field mt-1" value={formData.correctAnswer} onChange={handleInputChange}>
                    {['A', 'B', 'C', 'D'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Topic</label>
                  <select name="topic" className="input-field mt-1" value={formData.topic} onChange={handleInputChange}>
                    {TOPICS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Difficulty</label>
                  <select name="difficulty" className="input-field mt-1" value={formData.difficulty} onChange={handleInputChange}>
                    <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Marks</label>
                  <input type="number" name="marks" required min="1" className="input-field mt-1" value={formData.marks} onChange={handleInputChange}/>
                </div>
                <div>
                  <label className="block text-sm font-medium">Negative Marks</label>
                  <input type="number" name="negativeMarks" required min="0" step="0.25" className="input-field mt-1" value={formData.negativeMarks} onChange={handleInputChange}/>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
