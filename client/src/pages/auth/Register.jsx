import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', formData);
      toast.success('Registration successful! Please login. 🎉');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      toast.error('Registration failed 😢');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-white">
      {/* Left Half - Gradient Banner */}
      <div className="md:w-1/2 bg-gradient-to-br from-purple-800 via-indigo-800 to-blue-900 text-white p-12 flex flex-col justify-center relative overflow-hidden hidden md:flex">
        <div className="absolute top-20 right-20 w-48 h-48 bg-white rounded-full opacity-10 blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500 rounded-full opacity-20 blur-3xl mix-blend-screen"></div>

        <div className="relative z-10 max-w-md mx-auto">
          <h1 className="text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
            Join the Community 🚀
          </h1>
          <p className="text-xl text-blue-100 font-medium mb-12">
            Start your aptitude journey today
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md">
              <div className="text-3xl mb-2">👨🎓</div>
              <div className="text-2xl font-bold">500+</div>
              <div className="text-blue-200 text-sm font-medium">Students</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-2xl font-bold">25+</div>
              <div className="text-blue-200 text-sm font-medium">Topics</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md col-span-2">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-2xl font-bold">Real-time Results</div>
              <div className="text-blue-200 text-sm font-medium">Instant AI feedback</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Half - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 my-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Join us and start learning!</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 border border-red-100">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                className="input-field"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-bold text-slate-700 mb-3">I am a...</label>
              <div className="flex gap-4">
                <div 
                  onClick={() => setFormData({...formData, role: 'student'})}
                  className={`flex-1 cursor-pointer rounded-2xl p-4 border-2 transition-all text-center ${formData.role === 'student' ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-105' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <div className="text-3xl mb-2">👨🎓</div>
                  <div className={`font-bold ${formData.role === 'student' ? 'text-indigo-700' : 'text-gray-600'}`}>Student</div>
                </div>
                <div 
                  onClick={() => setFormData({...formData, role: 'teacher'})}
                  className={`flex-1 cursor-pointer rounded-2xl p-4 border-2 transition-all text-center ${formData.role === 'teacher' ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-105' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <div className="text-3xl mb-2">👩🏫</div>
                  <div className={`font-bold ${formData.role === 'teacher' ? 'text-indigo-700' : 'text-gray-600'}`}>Teacher</div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account ✨'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
              Sign In 🔑
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
