import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon, ShieldCheckIcon, CheckCircleIcon } from '../../components/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      login(response.data.token, response.data.user);
      toast.success(`Welcome back, ${response.data.user.name}!`);
      
      if (response.data.user.role?.toUpperCase() === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Invalid credentials. Please verify your email and password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Branding Side (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">AptitudeTest Pro</h1>
            <p className="text-xs text-slate-400 font-medium">Institution Assessment Platform</p>
          </div>
        </div>

        <div className="max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Secure Campus Assessment Suite</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Master Campus Placements & Competitive Exams
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-8">
            Access previous-year question assessments with active proctoring, topic mastery analytics, and curated learning recommendations.
          </p>

          <div className="space-y-3.5 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>45 Authentic Previous-Year Questions (TCS, Infosys, Wipro, GATE)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-Time Tab Switch & Anti-Cheating Protection</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant Weak-Area Analysis & Verified Video Solutions</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          © {new Date().getFullYear()} AptitudeTest Pro. Designed for Academic & Placement Excellence.
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="lg:hidden inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white mb-3 shadow">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">Enter your institutional credentials to continue</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2.5">
              <span className="font-bold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Institutional Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
              </div>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Signing in...</span>
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New student or faculty member?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials Info for Testing */}
          <div className="mt-6 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800 block mb-1">Faculty Account Credentials:</span>
            <div className="font-mono text-slate-700 space-y-0.5">
              <div>Email: <span className="text-blue-700 font-semibold">teacher@aptitude.com</span></div>
              <div>Password: <span className="text-blue-700 font-semibold">Teacher@12345</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
