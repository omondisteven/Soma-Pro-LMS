'use client'

import { useEffect, useState } from 'react'
import { 
  Download, 
  Filter, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  FileText
} from 'lucide-react'

interface AssignmentSubmission {
  id: string
  title: string
  courseName: string
  dueDate: string
  submittedAt: string | null
  status: 'pending' | 'submitted' | 'graded'
  score: number | null
  maxScore: number
  feedback: string | null
  submittedOnTime: boolean
}

export default function AssignmentReportPage() {
  const [assignments, setAssignments] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCourse, setFilterCourse] = useState('all')
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSubmission | null>(null)

  useEffect(() => {
    fetchAssignmentData()
  }, [filterStatus, filterCourse])

  const fetchAssignmentData = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/reports/assignments?status=${filterStatus}&course=${filterCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch (error) {
      console.error('Error fetching assignment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    const headers = ['Assignment', 'Course', 'Due Date', 'Status', 'Score', 'Max Score', 'Percentage', 'Submitted On Time', 'Submission Date']
    const rows = assignments.map(a => [
      a.title,
      a.courseName,
      new Date(a.dueDate).toLocaleDateString(),
      a.status,
      a.score !== null ? a.score : 'Pending',
      a.maxScore,
      a.score !== null ? `${Math.round((a.score / a.maxScore) * 100)}%` : 'N/A',
      a.submittedOnTime ? 'Yes' : 'No',
      a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'Not submitted'
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assignment_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateStats = () => {
    const total = assignments.length
    const submitted = assignments.filter(a => a.status !== 'pending').length
    const graded = assignments.filter(a => a.status === 'graded').length
    const pending = assignments.filter(a => a.status === 'pending').length
    const onTime = assignments.filter(a => a.submittedOnTime).length
    const averageScore = assignments.filter(a => a.score !== null).reduce((sum, a) => sum + (a.score || 0), 0) / (assignments.filter(a => a.score !== null).length || 1)
    
    return { total, submitted, graded, pending, onTime, averageScore: Math.round(averageScore) }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-gray-900">Track your assignment submissions and performance</h3>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          Download Report
        </button>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-gray-500 text-sm">Total Assignments</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4">
          <p className="text-green-600 text-sm">Submitted</p>
          <p className="text-2xl font-bold text-green-700">{stats.submitted}</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-4">
          <p className="text-blue-600 text-sm">Graded</p>
          <p className="text-2xl font-bold text-blue-700">{stats.graded}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4">
          <p className="text-yellow-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-purple-50 rounded-xl shadow-sm border border-purple-200 p-4">
          <p className="text-purple-600 text-sm">Avg. Score</p>
          <p className="text-2xl font-bold text-purple-700">{stats.averageScore}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
          </select>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {[...new Set(assignments.map(a => a.courseName))].map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Assignment</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Due Date</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Score</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">On Time</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium text-gray-900">{assignment.title}</td>
                  <td className="py-3 px-6 text-gray-600">{assignment.courseName}</td>
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'graded' ? 'bg-green-100 text-green-700' :
                      assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {assignment.status === 'graded' && <CheckCircle size={12} />}
                      {assignment.status === 'submitted' && <Clock size={12} />}
                      {assignment.status === 'pending' && <AlertCircle size={12} />}
                      {assignment.status === 'graded' ? 'Graded' : assignment.status === 'submitted' ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    {assignment.score !== null ? (
                      <span className="font-semibold text-gray-900">
                        {assignment.score}/{assignment.maxScore}
                        <span className="text-sm text-gray-500 ml-1">
                          ({Math.round((assignment.score / assignment.maxScore) * 100)}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    {assignment.submittedAt ? (
                      <span className={assignment.submittedOnTime ? 'text-green-600' : 'text-red-600'}>
                        {assignment.submittedOnTime ? 'Yes' : 'No'}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    {assignment.status !== 'pending' && (
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedAssignment(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assignment Details</h2>
                <button onClick={() => setSelectedAssignment(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedAssignment.title}</h3>
                  <p className="text-gray-500">{selectedAssignment.courseName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{new Date(selectedAssignment.dueDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted On</p>
                    <p className="font-medium">
                      {selectedAssignment.submittedAt ? new Date(selectedAssignment.submittedAt).toLocaleString() : 'Not submitted'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="font-medium">
                      {selectedAssignment.score !== null 
                        ? `${selectedAssignment.score}/${selectedAssignment.maxScore} (${Math.round((selectedAssignment.score / selectedAssignment.maxScore) * 100)}%)`
                        : 'Pending grading'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted On Time</p>
                    <p className="font-medium">{selectedAssignment.submittedOnTime ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                {selectedAssignment.feedback && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Instructor Feedback</p>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-gray-700">{selectedAssignment.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}