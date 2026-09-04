import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const teacherLinks = [
    { to: '/teacher', icon: '🏠', label: 'Dashboard' },
    { to: '/teacher/questions', icon: '📝', label: 'Question Bank' },
    { to: '/teacher/create-test', icon: '➕', label: 'Create Test' },
    { to: '/teacher/analytics', icon: '📊', label: 'Analytics' },
    { to: '/teacher/milestones', icon: '🏆', label: 'Milestones' },
  ];

  const studentLinks = [
    { to: '/student', icon: '🏠', label: 'Dashboard' },
    { to: '/student/analytics', icon: '📊', label: 'My Analytics' },
    { to: '/student/milestones', icon: '🏆', label: 'Milestones' },
    { to: '/student/history', icon: '📋', label: 'Test History' },
  ];

  const links = user?.role?.toUpperCase() === 'TEACHER' ? teacherLinks : studentLinks;
  
  // Format breadcrumb based on path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pageTitle = pathParts.length > 1 
    ? pathParts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Dashboard';

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3">
          <span className="text-3xl">🎓</span>
          <span className="text-xl font-bold text-white tracking-wide">AptitudeTest Pro</span>
        </div>
        
        <div className="mx-6 h-px bg-slate-800 mb-6"></div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
              end={link.to === '/teacher' || link.to === '/student'}
            >
              <span className="text-xl">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-3 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl shadow-inner">
                👤
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-white font-bold truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 w-full h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white shadow-sm border-b border-slate-100 flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
              <span className="hidden md:inline">Home</span>
              <span className="hidden md:inline">/</span>
              <span className="text-slate-800 font-bold">{pageTitle}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
