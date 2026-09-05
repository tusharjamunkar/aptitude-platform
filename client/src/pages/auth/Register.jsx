import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { AcademicCapIcon, CheckCircleIcon } from '../../components/Icons';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    studyYear: '1st Year',
    department: 'Computer Science & Engineering',
    rollNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const studyYearOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
  ];

  const departmentOptions = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence & Data Science',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      return 'Full Name must be at least 2 characters long.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Please provide a valid email address.';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    if (formData.role === 'STUDENT') {
      if (!formData.studyYear) {
        return 'Please select your Study Year.';
      }
      if (!formData.department) {
        return 'Please select your Department.';
      }
      if (!formData.rollNumber.trim() || formData.rollNumber.trim().length < 3) {
        return 'Please enter a valid University Roll Number (at least 3 characters).';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        studyYear: formData.role === 'STUDENT' ? formData.studyYear : null,
        department: formData.role === 'STUDENT' ? formData.department : null,
        rollNumber: formData.role === 'STUDENT' ? formData.rollNumber.trim().toUpperCase() : null
      };

      const res = await api.post('/auth/register', payload);
      login(res.data.token, res.data.user);
      toast.success('Registration successful! Welcome to the platform.');
      
      if (res.data.user.role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Branding Side (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">AptitudeTest Pro</h1>
            <p className="text-xs text-slate-400 font-medium">Campus Placement Preparation</p>
          </div>
        </div>

        <div className="max-w-sm my-auto">
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Student & Faculty Registration
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-8">
            Create your account to access curated 45-minute assessments, practice with real previous-year exams, and track topic-wise proficiency.
          </p>

          <div className="space-y-3.5 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full departmental tracking for academic cohorts</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Standard 45-minute timed test conditions</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Detailed performance radar & YouTube lecture suggestions</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Secure Institutional Assessment System
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8 my-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-xs text-slate-500 mt-1">Please enter your academic details accurately</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2.5">
              <span className="font-bold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Switcher */}
            <div>
              <label className="label-text">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                    formData.role === 'STUDENT'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'TEACHER' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                    formData.role === 'TEACHER'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Faculty / Teacher Account
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="label-text">Full Name</label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="label-text">Institutional Email</label>
              <input
                type="email"
                name="email"
                required
                className="input-field"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            {/* Student Specific Fields: Study Year, Department, Roll Number */}
            {formData.role === 'STUDENT' && (
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Academic Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="label-text">Study Year</label>
                    <select
                      name="studyYear"
                      value={formData.studyYear}
                      onChange={handleChange}
                      className="select-field"
                    >
                      {studyYearOptions.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label-text">Roll Number</label>
                    <input
                      type="text"
                      name="rollNumber"
                      required
                      className="input-field uppercase font-mono"
                      placeholder="e.g. 21CS045"
                      value={formData.rollNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text">Department / Discipline</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="select-field"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="label-text">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="input-field"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label-text">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="input-field"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Creating Account...</span>
                </span>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
