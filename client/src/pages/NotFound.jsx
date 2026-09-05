import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpenIcon } from '../components/Icons';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'TEACHER') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
          <BookOpenIcon className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          404 Error
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The requested page or examination resource does not exist, has been archived, or the URL might be mistyped.
        </p>

        <div className="space-y-2.5">
          <button
            onClick={handleReturn}
            className="btn-primary w-full py-2.5 text-xs font-semibold shadow-xs"
          >
            {user ? (user.role === 'TEACHER' ? 'Return to Teacher Dashboard' : 'Return to Student Dashboard') : 'Go to Login'}
          </button>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary w-full py-2 text-xs font-semibold"
          >
            ← Go Back to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
}
