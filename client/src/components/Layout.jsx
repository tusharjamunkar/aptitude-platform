import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DashboardIcon,
  BookOpenIcon,
  PlusIcon,
  ChartIcon,
  TrophyIcon,
  HistoryIcon,
  AcademicCapIcon,
  LogoutIcon,
  UserIcon
} from './Icons';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTeacher = user?.role?.toUpperCase() === 'TEACHER';

  const teacherLinks = [
    { to: '/teacher', icon: <DashboardIcon />, label: 'Dashboard' },
    { to: '/teacher/questions', icon: <BookOpenIcon />, label: 'Question Bank' },
    { to: '/teacher/create-test', icon: <PlusIcon />, label: 'Create Assessment' },
    { to: '/teacher/analytics', icon: <ChartIcon />, label: 'Class Analytics' },
    { to: '/teacher/milestones', icon: <TrophyIcon />, label: 'Milestones' },
  ];

  const studentLinks = [
    { to: '/student', icon: <DashboardIcon />, label: 'Dashboard' },
    { to: '/student/analytics', icon: <ChartIcon />, label: 'My Performance' },
    { to: '/student/milestones', icon: <TrophyIcon />, label: 'Milestones' },
    { to: '/student/history', icon: <HistoryIcon />, label: 'Test History' },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  // Format breadcrumb based on path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pageTitle = pathParts.length > 1
    ? pathParts[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Overview';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col border-r border-slate-800 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <AcademicCapIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight block leading-tight">
              AptitudeTest Pro
            </span>
            <span className="text-[11px] font-medium text-slate-400 block tracking-wide uppercase">
              {isTeacher ? 'Faculty Portal' : 'Student Portal'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              end={link.to === '/teacher' || link.to === '/student'}
            >
              <span className="opacity-90">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-sm font-semibold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {user?.role}
                  </span>
                  {user?.rollNumber && (
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {user.rollNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {user?.department && (
              <p className="text-[11px] text-slate-400 truncate mb-2.5 px-0.5">
                {user.department} {user.studyYear ? `• ${user.studyYear}` : ''}
              </p>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-red-500/15 hover:text-red-300 text-slate-300 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <LogoutIcon className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 w-full h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>{isTeacher ? 'Instructor Portal' : 'Student Portal'}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">System Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
