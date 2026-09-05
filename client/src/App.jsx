import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionBank from './pages/teacher/QuestionBank';
import CreateTest from './pages/teacher/CreateTest';
import TestResults from './pages/teacher/TestResults';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';
import ManageMilestones from './pages/teacher/ManageMilestones';
import StudentDashboard from './pages/student/StudentDashboard';
import TakeTest from './pages/student/TakeTest';
import StudentAnalytics from './pages/student/StudentAnalytics';
import StudentMilestones from './pages/student/StudentMilestones';
import TestHistory from './pages/student/TestHistory';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-600 tracking-wide">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role?.toUpperCase();
  const targetRole = role?.toUpperCase();

  if (targetRole && userRole !== targetRole) {
    return <Navigate to={userRole === 'TEACHER' ? '/teacher' : '/student'} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-600 tracking-wide">Checking authentication...</p>
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to={userRole === 'TEACHER' ? '/teacher' : '/student'} replace />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to={userRole === 'TEACHER' ? '/teacher' : '/student'} replace />}
      />

      {/* Teacher Routes - Supports /teacher, /teacher/dashboard, /teacher/tests, etc. */}
      <Route path="/teacher" element={<ProtectedRoute role="TEACHER"><Layout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="profile" element={<TeacherDashboard />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="create-test" element={<CreateTest />} />
        <Route path="tests" element={<TeacherDashboard />} />
        <Route path="tests/:id" element={<TestResults />} />
        <Route path="tests/:id/results" element={<TestResults />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="students" element={<TeacherAnalytics />} />
        <Route path="results" element={<TeacherAnalytics />} />
        <Route path="milestones" element={<ManageMilestones />} />
      </Route>

      {/* Student Routes - Supports /student, /student/dashboard, /student/tests, etc. */}
      <Route path="/student" element={<ProtectedRoute role="STUDENT"><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentDashboard />} />
        <Route path="tests" element={<StudentDashboard />} />
        <Route path="test" element={<StudentDashboard />} />
        <Route path="analytics" element={<StudentAnalytics />} />
        <Route path="milestones" element={<StudentMilestones />} />
        <Route path="history" element={<TestHistory />} />
        <Route path="results" element={<TestHistory />} />
      </Route>

      {/* Test Taking Experience - Supports both /take-test/:testId and /student/test/:testId */}
      <Route
        path="/take-test/:testId"
        element={<ProtectedRoute role="STUDENT"><TakeTest /></ProtectedRoute>}
      />
      <Route
        path="/student/test/:testId"
        element={<ProtectedRoute role="STUDENT"><TakeTest /></ProtectedRoute>}
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={user ? (userRole === 'TEACHER' ? '/teacher' : '/student') : '/login'} replace />}
      />

      {/* Catch-all 404 for genuinely nonexistent application routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
