import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import {
  UserGroupIcon,
  UserIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  FilterIcon,
  SearchIcon,
  RefreshIcon
} from '../../components/Icons';

export default function AllStudents() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [yearFilter, setYearFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Predefined Standard Options
  const standardYears = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
  ];

  const standardBranches = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence & Data Science',
    'Other'
  ];

  const [dynamicYears, setDynamicYears] = useState([]);
  const [dynamicBranches, setDynamicBranches] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/analytics/teacher/students');
      const data = res.data || {};
      setStudents(data.students || []);

      if (data.availableYears && Array.isArray(data.availableYears)) {
        setDynamicYears(data.availableYears);
      }
      if (data.availableBranches && Array.isArray(data.availableBranches)) {
        setDynamicBranches(data.availableBranches);
      }
    } catch (err) {
      console.error('Failed to load students directory:', err);
      setError('Unable to load student directory. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Merge standard options with any dynamically found values in the database
  const yearOptions = useMemo(() => {
    const set = new Set([...standardYears, ...dynamicYears]);
    return Array.from(set).filter(Boolean).sort();
  }, [dynamicYears]);

  const branchOptions = useMemo(() => {
    const set = new Set([...standardBranches, ...dynamicBranches]);
    return Array.from(set).filter(Boolean).sort();
  }, [dynamicBranches]);

  // Combined Filtering Logic (Year AND Branch AND SearchTerm)
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Year Filter
      if (yearFilter !== 'All') {
        const studentYear = (student.studyYear || '').trim().toLowerCase();
        const selectedYear = yearFilter.trim().toLowerCase();
        if (studentYear !== selectedYear) return false;
      }

      // 2. Branch Filter
      if (branchFilter !== 'All') {
        const studentBranch = (student.department || '').trim().toLowerCase();
        const selectedBranch = branchFilter.trim().toLowerCase();
        if (studentBranch !== selectedBranch) return false;
      }

      // 3. Search Term (Name, Roll Number, Email)
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const nameMatch = (student.name || '').toLowerCase().includes(query);
        const rollMatch = (student.rollNumber || '').toLowerCase().includes(query);
        const emailMatch = (student.email || '').toLowerCase().includes(query);
        if (!nameMatch && !rollMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [students, yearFilter, branchFilter, searchTerm]);

  // Reset all filters
  const handleResetFilters = () => {
    setYearFilter('All');
    setBranchFilter('All');
    setSearchTerm('');
  };

  const isFiltered = yearFilter !== 'All' || branchFilter !== 'All' || searchTerm.trim() !== '';

  // Calculate cohort summary stats
  const totalStudentsCount = students.length;
  const uniqueBranchesCount = new Set(students.map((s) => s.department).filter(Boolean)).size;
  const uniqueYearsCount = new Set(students.map((s) => s.studyYear).filter(Boolean)).size;
  const totalAssessmentsTaken = students.reduce((acc, s) => acc + (s.totalAttempts || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
              <UserGroupIcon className="w-3.5 h-3.5" />
              <span>Institutional Student Directory</span>
            </span>
            <span className="text-xs font-medium text-slate-500">
              • Academic Records
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            All Students
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive roster of student candidates enrolled across academic years and engineering branches
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchStudents}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Refresh student list"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/teacher/analytics')}
            className="btn-primary text-xs py-2 px-3.5"
          >
            Class Analytics →
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled"
          value={totalStudentsCount}
          icon={<UserGroupIcon />}
          subtitle="Registered student profiles"
          variant="primary"
        />
        <StatCard
          title="Academic Years"
          value={uniqueYearsCount || 4}
          icon={<AcademicCapIcon />}
          subtitle="Cohort batches represented"
          variant="purple"
        />
        <StatCard
          title="Branches & Streams"
          value={uniqueBranchesCount || 1}
          icon={<BookOpenIcon />}
          subtitle="Academic disciplines"
          variant="warning"
        />
        <StatCard
          title="Assessments Taken"
          value={totalAssessmentsTaken}
          icon={<CheckCircleIcon />}
          subtitle="Total candidate attempts"
          variant="success"
        />
      </div>

      {/* Filter and Search Toolbar */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="input-field text-xs py-2.5 pl-9 w-full"
            placeholder="Search by student name, roll number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 min-w-[150px]">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="select-field text-xs py-2.5 bg-white font-medium text-slate-700"
              aria-label="Filter by Academic Year"
            >
              <option value="All">All Years</option>
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 min-w-[220px]">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="select-field text-xs py-2.5 bg-white font-medium text-slate-700"
              aria-label="Filter by Branch"
            >
              <option value="All">All Branches</option>
              {branchOptions.map((br) => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Action */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
              title="Clear all filters"
            >
              <span>✕ Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Indicators */}
      {isFiltered && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <FilterIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Filters:</span>
          </span>
          {yearFilter !== 'All' && (
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              Year: <strong>{yearFilter}</strong>
              <button
                onClick={() => setYearFilter('All')}
                className="hover:text-blue-900 font-bold ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          {branchFilter !== 'All' && (
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              Branch: <strong>{branchFilter}</strong>
              <button
                onClick={() => setBranchFilter('All')}
                className="hover:text-indigo-900 font-bold ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          {searchTerm.trim() && (
            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              Search: <strong>"{searchTerm}"</strong>
              <button
                onClick={() => setSearchTerm('')}
                className="hover:text-slate-900 font-bold ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          <span className="text-slate-400">
            • Showing {filteredStudents.length} of {totalStudentsCount} students
          </span>
        </div>
      )}

      {/* Main Student Directory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Student Roster</h2>
            <p className="text-xs text-slate-500">
              {filteredStudents.length} candidate{filteredStudents.length === 1 ? '' : 's'} matching current criteria
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {filteredStudents.length} Total
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-700">Loading student directory...</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Fetching academic year and branch rosters</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-xs font-semibold text-red-600 mb-3">{error}</p>
            <button onClick={fetchStudents} className="btn-secondary text-xs py-2 px-3.5">
              Retry
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No students found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              {isFiltered
                ? 'No students match your selected Year and Branch filter criteria. Try adjusting or clearing your filters.'
                : 'There are currently no registered student accounts in the platform.'}
            </p>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Branch / Department</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Tests Taken</th>
                  <th className="py-3 px-4">Avg Accuracy</th>
                  <th className="py-3 px-4">Joined On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((student, idx) => {
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Index */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Name with Avatar Pill */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-200">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-400 md:hidden font-mono">
                              {student.rollNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {student.rollNumber && student.rollNumber !== 'N/A' ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200/80">
                            {student.rollNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Year Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                          {student.studyYear || 'Unspecified'}
                        </span>
                      </td>

                      {/* Department / Branch */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-medium">
                          {student.department || 'General Engineering'}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <a
                          href={`mailto:${student.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <span>{student.email}</span>
                        </a>
                      </td>

                      {/* Tests Taken */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">
                          {student.completedTests || student.totalAttempts || 0}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1">tests</span>
                      </td>

                      {/* Average Accuracy */}
                      <td className="py-3.5 px-4">
                        {student.averageScore !== null ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              student.averageScore >= 75
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : student.averageScore >= 50
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {student.averageScore}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No tests yet</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
