import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher', icon: '📊' },
    { name: 'Question Bank', path: '/teacher/questions', icon: '📝' },
    { name: 'Create Test', path: '/teacher/create-test', icon: '➕' },
    { name: 'Analytics', path: '/teacher/analytics', icon: '📈' },
    { name: 'Milestones', path: '/teacher/milestones', icon: '🏆' },
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student', icon: '🏠' },
    { name: 'Analytics', path: '/student/analytics', icon: '📉' },
    { name: 'Milestones', path: '/student/milestones', icon: '⭐' },
    { name: 'History', path: '/student/history', icon: '📜' },
  ];

  const links = user?.role === 'TEACHER' ? teacherLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-primary-900 to-primary-700 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-primary-600">
          <span className="text-2xl font-bold">Aptitude Pro</span>
        </div>
        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/teacher' || link.path === '/student'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'hover:bg-primary-800 text-primary-100'
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <span>{link.icon}</span>
              <span className="font-medium">{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {user?.name || 'User'} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-danger-600 hover:text-danger-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
