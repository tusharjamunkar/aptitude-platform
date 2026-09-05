import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { CheckCircleIcon, UserIcon, TrophyIcon, AlertIcon } from '../../components/Icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function TestResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [resAttempts, resTests] = await Promise.all([
        api.get(`/tests/${id}/results`),
        api.get('/tests')
      ]);

      const attemptList = resAttempts.data || [];
      setResults(attemptList);

      const currentTest = (resTests.data || []).find((t) => t.id === id);
      setTestInfo(currentTest || { title: 'Assessment Results' });
    } catch (err) {
      console.error('Error fetching test results:', err);
      toast.error('Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  // Helper to compile clean row data for export
  const prepareExportData = () => {
    return results.map((att, idx) => {
      const student = att.student || {};
      const answers = att.answers || [];
      const totalQuestions = answers.length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const wrongAnswers = answers.filter(a => a.selectedAnswer && !a.isCorrect).length;
      const percentage = att.totalMarks > 0 ? ((att.score / att.totalMarks) * 100).toFixed(1) : '0.0';
      const testDate = att.submittedAt 
        ? new Date(att.submittedAt).toLocaleString() 
        : new Date(att.startedAt).toLocaleString();

      return {
        'Rank': idx + 1,
        'Student Name': student.name || 'N/A',
        'Email': student.email || 'N/A',
        'Roll Number': student.rollNumber || 'N/A',
        'Study Year': student.studyYear || 'N/A',
        'Department': student.department || 'N/A',
        'Test Name': testInfo?.title || att.test?.title || 'Assessment',
        'Attempt': `Attempt ${att.attemptNumber || 1}`,
        'Test Date/Time': testDate,
        'Total Questions': totalQuestions,
        'Correct Answers': correctAnswers,
        'Wrong Answers': wrongAnswers,
        'Marks Obtained': att.score,
        'Total Marks': att.totalMarks,
        'Percentage (%)': `${percentage}%`,
        'Tab Switch Violations': att.tabSwitchCount || 0,
        'Result / Status': att.status || 'COMPLETED'
      };
    });
  };

  // 1. Export CSV
  const exportCSV = () => {
    try {
      if (results.length === 0) {
        toast.error('No student attempts to export');
        return;
      }
      const data = prepareExportData();
      const headers = Object.keys(data[0]);
      
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const val = row[header] !== undefined ? String(row[header]) : '';
            // Escape quotes and commas
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = (testInfo?.title || 'Assessment').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.href = url;
      link.setAttribute('download', `${safeTitle}_results.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV results exported successfully!');
    } catch (e) {
      console.error('CSV Export Error:', e);
      toast.error('Failed to export CSV');
    }
  };

  // 2. Export Excel (XLSX)
  const exportExcel = () => {
    try {
      if (results.length === 0) {
        toast.error('No student attempts to export');
        return;
      }
      const data = prepareExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Results');
      
      const safeTitle = (testInfo?.title || 'Assessment').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      XLSX.writeFile(workbook, `${safeTitle}_results.xlsx`);
      toast.success('Excel results exported successfully!');
    } catch (e) {
      console.error('Excel Export Error:', e);
      toast.error('Failed to export Excel');
    }
  };

  // 3. Export PDF
  const exportPDF = () => {
    try {
      if (results.length === 0) {
        toast.error('No student attempts to export');
        return;
      }
      const doc = new jsPDF('landscape');
      
      // Header Section
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(testInfo?.title || 'Official Student Examination Results', 14, 18);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const generatedAt = new Date().toLocaleString();
      doc.text(`Subject: ${testInfo?.subject || 'Aptitude'} | Duration: ${testInfo?.duration || 45} Minutes | Export Date: ${generatedAt}`, 14, 25);
      doc.text(`Total Submissions: ${results.length} attempts recorded | Evaluated by Faculty Department`, 14, 30);

      // Table columns & rows
      const tableHeaders = [
        ['#', 'Student Name', 'Roll No', 'Year & Dept', 'Att.', 'Correct', 'Score', '%', 'Violations', 'Status']
      ];

      const tableData = results.map((att, i) => {
        const student = att.student || {};
        const answers = att.answers || [];
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const totalQ = answers.length || 1;
        const pct = att.totalMarks > 0 ? Math.round((att.score / att.totalMarks) * 100) : 0;

        return [
          i + 1,
          student.name || 'Candidate',
          student.rollNumber || 'N/A',
          `${student.studyYear || ''} ${student.department || ''}`.trim() || 'Engineering',
          `#${att.attemptNumber || 1}`,
          `${correctAnswers}/${totalQ}`,
          `${att.score}/${att.totalMarks}`,
          `${pct}%`,
          att.tabSwitchCount || 0,
          att.status || 'COMPLETED'
        ];
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 35,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [37, 99, 235], // blue-600
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 60 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 16 },
          8: { cellWidth: 20 },
          9: { cellWidth: 26 }
        }
      });

      const safeTitle = (testInfo?.title || 'Assessment').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`${safeTitle}_results.pdf`);
      toast.success('PDF report exported successfully!');
    } catch (e) {
      console.error('PDF Export Error:', e);
      toast.error('Failed to export PDF');
    }
  };

  const totalCandidates = results.length;
  const completedAttempts = results.filter((r) => r.status === 'COMPLETED');
  const avgScore = completedAttempts.length > 0
    ? Math.round(
        completedAttempts.reduce(
          (acc, r) => acc + (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0),
          0
        ) / completedAttempts.length
      )
    : 0;

  const highestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((r) => r.score))
    : 0;

  const disqualifiedCount = results.filter((r) => r.status === 'DISQUALIFIED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <button
            onClick={() => navigate('/teacher')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 mb-1.5 flex items-center gap-1"
          >
            ← Back to Teacher Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {testInfo?.title || 'Assessment Results'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort score records, multiple attempt logs, and export reporting
          </p>
        </div>

        {/* Export Result Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs"
            title="Download CSV spreadsheet"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>

          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-xs"
            title="Download Excel spreadsheet"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Excel
          </button>

          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-xs"
            title="Download Printable PDF"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24-1.03-.48-2.874-.48-4.329 0-3.168 2.377-5.5 5.76-5.5s5.76 2.332 5.76 5.5c0 1.455-.24 3.299-.48 4.329m-10.56 0A7.502 7.502 0 0012 21a7.502 7.502 0 005.28-7.171m-10.56 0c.34-.148.694-.28 1.06-.395m8.44.395c-.366-.115-.72-.247-1.06-.395" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Cohort Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={totalCandidates}
          icon={<UserIcon />}
          subtitle="All student submissions"
          variant="primary"
        />
        <StatCard
          title="Cohort Average"
          value={`${avgScore}%`}
          icon={<CheckCircleIcon />}
          subtitle="Completed exam average"
          variant="success"
        />
        <StatCard
          title="Highest Score"
          value={highestScore}
          icon={<TrophyIcon />}
          subtitle="Top mark attained"
          variant="warning"
        />
        <StatCard
          title="Disqualified"
          value={disqualifiedCount}
          icon={<AlertIcon />}
          subtitle="Tab-switching violations"
          variant="danger"
        />
      </div>

      {/* Student Submissions Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Student Examination & Attempt Ledger</h2>
            <p className="text-xs text-slate-500">Every student attempt is preserved and visible with academic profiles</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {results.length} Attempt Records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading student scores...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No candidates have submitted this assessment yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Attempt</th>
                  <th className="py-3 px-4">Department & Year</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {results.map((att, idx) => {
                  const pct = att.totalMarks > 0 ? Math.round((att.score / att.totalMarks) * 100) : 0;
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{att.student?.name || 'Candidate'}</div>
                        <div className="text-[11px] font-normal text-slate-400">{att.student?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {att.student?.rollNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Attempt {att.attemptNumber || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {att.student?.department || 'Engineering'} {att.student?.studyYear ? `(${att.student.studyYear})` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {att.score} / {att.totalMarks}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${pct >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${att.tabSwitchCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {att.tabSwitchCount} tab switch{att.tabSwitchCount !== 1 ? 'es' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            att.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
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
