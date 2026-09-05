import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'TEACHER' ? '/teacher' : '/student'} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'TEACHER' ? '/teacher' : '/student'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'TEACHER' ? '/teacher' : '/student'} />} />
      
      {/* Teacher Routes */}
      <Route path="/teacher" element={<ProtectedRoute role="TEACHER"><Layout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="create-test" element={<CreateTest />} />
        <Route path="tests/:id/results" element={<TestResults />} />
        <Route path="analytics" element={<TeacherAnalytics />} />
        <Route path="milestones" element={<ManageMilestones />} />
      </Route>
      
      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute role="STUDENT"><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="analytics" element={<StudentAnalytics />} />
        <Route path="milestones" element={<StudentMilestones />} />
        <Route path="history" element={<TestHistory />} />
      </Route>
      
      {/* Test Taking - Full screen, no layout */}
      <Route path="/take-test/:testId" element={<ProtectedRoute role="STUDENT"><TakeTest /></ProtectedRoute>} />
      
      <Route path="/" element={<Navigate to={user ? (user.role === 'TEACHER' ? '/teacher' : '/student') : '/login'} />} />
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
