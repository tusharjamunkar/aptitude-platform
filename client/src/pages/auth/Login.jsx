import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      toast.success('Logged in successfully! 🎉');
      if (response.data.user.role?.toUpperCase() === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      toast.error('Login failed 😢');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-white">
      {/* Left Half - Gradient Banner */}
      <div className="md:w-1/2 bg-gradient-to-br from-indigo-800 via-purple-800 to-slate-900 text-white p-12 flex flex-col justify-center relative overflow-hidden hidden md:flex">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl mix-blend-screen"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl mix-blend-screen"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-purple-500 rounded-full opacity-20 blur-2xl mix-blend-screen"></div>

        <div className="relative z-10 max-w-md mx-auto">
          <div className="text-6xl mb-6">🎓</div>
          <h1 className="text-4xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
            AptitudeTest Pro
          </h1>
          <p className="text-xl text-indigo-100 font-medium mb-12">
            Master aptitude. Ace every exam.
          </p>
          <ul className="space-y-6 text-indigo-50/90 font-medium text-lg">
            <li className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-2xl">✅</span> 500+ students supported
            </li>
            <li className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-2xl">🛡️</span> Anti-cheat protection
            </li>
            <li className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <span className="text-2xl">📊</span> AI-powered analytics
            </li>
          </ul>
        </div>
      </div>

      {/* Right Half - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome back 👋</h2>
            <p className="text-slate-500 font-medium">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 border border-red-100">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span>✉️</span> Email Address
              </label>
              <input
                type="email"
                required
                className="input-field shadow-sm hover:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <span>🔒</span> Password
              </label>
              <input
                type="password"
                required
                className="input-field shadow-sm hover:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-600 font-medium cursor-pointer">
                <input type="checkbox" className="mr-2 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                Remember me
              </label>
              <a href="#" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign In 🚀'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
              Register here ✨
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
