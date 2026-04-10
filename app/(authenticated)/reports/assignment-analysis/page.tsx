'use client'

import { useEffect, useState } from 'react'
import { Download, Filter, FileText, CheckCircle, Clock, AlertCircle, Loader2, BarChart3 } from 'lucide-react'

interface AssignmentStats {
  id: string
  title: string
  courseTitle: string
  dueDate: string
  totalSubmissions: number
  gradedCount: number
  pendingCount: number
  averageScore: number
  highestScore: number
  lowestScore: number
  onTimeRate: number
}

export default function AssignmentAnalysisPage() {
  const [assignments, setAssignments] = useState<AssignmentStats[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentStats[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded'>('all')

  useEffect(() => {
    fetchAssignmentAnalysis()
  }, [selectedCourse])

  useEffect(() => {
    filterAssignments()
  }, [assignments, selectedCourse, statusFilter])

  const fetchAssignmentAnalysis = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/reports/assignment-analysis?course=${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAssignments(data.assignments || [])
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching assignment analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAssignments = () => {
    let filtered = [...assignments]
    
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(a => a.courseTitle === courses.find(c => c.id === selectedCourse)?.title)
    }
    
    if (statusFilter === 'pending') {
      filtered = filtered.filter(a => a.pendingCount > 0)
    } else if (statusFilter === 'graded') {
      filtered = filtered.filter(a => a.gradedCount > 0)
    }
    
    setFilteredAssignments(filtered)
  }

  const downloadReport = () => {
    const headers = ['Assignment', 'Course', 'Due Date', 'Submissions', 'Graded', 'Pending', 'Avg Score %', 'Highest Score', 'Lowest Score', 'On-Time Rate %']
    const rows = filteredAssignments.map(a => [
      a.title,
      a.courseTitle,
      new Date(a.dueDate).toLocaleDateString(),
      a.totalSubmissions,
      a.gradedCount,
      a.pendingCount,
      a.averageScore,
      a.highestScore,
      a.lowestScore,
      a.onTimeRate
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assignment_analysis_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateOverallStats = () => {
    const totalSubmissions = filteredAssignments.reduce((sum, a) => sum + a.totalSubmissions, 0)
    const avgScore = filteredAssignments.reduce((sum, a) => sum + a.averageScore, 0) / (filteredAssignments.length || 1)
    const avgOnTime = filteredAssignments.reduce((sum, a) => sum + a.onTimeRate, 0) / (filteredAssignments.length || 1)
    return { totalSubmissions, avgScore: Math.round(avgScore), avgOnTime: Math.round(avgOnTime) }
  }

  const overallStats = calculateOverallStats()

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
          <h1 className="text-3xl font-bold text-gray-900">Assignment Analysis</h1>
          <p className="text-gray-600 mt-1">Track submission rates, scores, and student performance</p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          Download Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm">Total Assignments</p>
          <p className="text-3xl font-bold mt-1">{filteredAssignments.length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm">Total Submissions</p>
          <p className="text-3xl font-bold mt-1">{overallStats.totalSubmissions}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-purple-100 text-sm">Avg. Score</p>
          <p className="text-3xl font-bold mt-1">{overallStats.avgScore}%</p>
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
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Assignments</option>
            <option value="pending">Pending Grading</option>
            <option value="graded">Graded Only</option>
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
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Submissions</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Avg Score</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Highest</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Lowest</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">On-Time</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium text-gray-900">{assignment.title}</td>
                  <td className="py-3 px-6 text-gray-600">{assignment.courseTitle}</td>
                  <td className="py-3 px-6 text-gray-500">
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900">{assignment.totalSubmissions}</span>
                      <span className="text-xs text-gray-400">total</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-600">{assignment.gradedCount} graded</span>
                      <span className="text-yellow-600">{assignment.pendingCount} pending</span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`font-semibold ${
                      assignment.averageScore >= 80 ? 'text-green-600' :
                      assignment.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {assignment.averageScore}%
                    </span>
                  </td>
                  <td className="py-3 px-6 text-green-600">{assignment.highestScore}%</td>
                  <td className="py-3 px-6 text-red-600">{assignment.lowestScore}%</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 rounded-full h-2" style={{ width: `${assignment.onTimeRate}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{assignment.onTimeRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    {assignment.pendingCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                        <Clock size={14} />
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={14} />
                        Complete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}