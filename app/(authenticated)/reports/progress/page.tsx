'use client'

import { useEffect, useState } from 'react'
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Loader2
} from 'lucide-react'

interface CourseProgress {
  id: string
  title: string
  progress: number
  completedLessons: number
  totalLessons: number
  timeSpent: number
  startedAt: string
  lastActivity: string
}

export default function ProgressReportPage() {
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')

  useEffect(() => {
    fetchProgressData()
  }, [filterDate, selectedCourse])

  const fetchProgressData = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/reports/progress?dateRange=${filterDate}&course=${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    // Generate CSV
    const headers = ['Course Title', 'Progress %', 'Completed Lessons', 'Total Lessons', 'Time Spent (min)', 'Started At', 'Last Activity']
    const rows = courses.map(course => [
      course.title,
      course.progress,
      course.completedLessons,
      course.totalLessons,
      course.timeSpent,
      new Date(course.startedAt).toLocaleDateString(),
      new Date(course.lastActivity).toLocaleDateString()
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `progress_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateOverallProgress = () => {
    if (courses.length === 0) return 0
    const total = courses.reduce((sum, c) => sum + c.progress, 0)
    return Math.round(total / courses.length)
  }

  const calculateTotalTimeSpent = () => {
    return courses.reduce((sum, c) => sum + c.timeSpent, 0)
  }

  const calculateCompletedCourses = () => {
    return courses.filter(c => c.progress === 100).length
  }

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
          <h3 className="font-bold text-gray-900">Track your course completion progress</h3>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{calculateOverallProgress()}%</p>
            </div>
            <TrendingUp className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed Courses</p>
              <p className="text-2xl font-bold text-gray-900">{calculateCompletedCourses()}/{courses.length}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, c) => sum + c.totalLessons, 0)}
              </p>
            </div>
            <BookOpen className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900">{calculateTotalTimeSpent()} min</p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
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
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
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
        </div>
      </div>

      {/* Progress Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Progress</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Completed</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Time Spent</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Started</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium text-gray-900">{course.title}</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 rounded-full h-2 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{course.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {course.completedLessons}/{course.totalLessons}
                  </td>
                  <td className="py-3 px-6 text-gray-600">{course.timeSpent} min</td>
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(course.startedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(course.lastActivity).toLocaleDateString()}
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