'use client'

import { useEffect, useState } from 'react'
import { 
  Download, 
  Filter, 
  TrendingUp, 
  Users, 
  Award, 
  Clock,
  BookOpen,
  Loader2,
  ChevronDown,
  BarChart3,
  Activity
} from 'lucide-react'

interface CourseAnalytics {
  id: string
  title: string
  shortName: string
  enrollments: number
  completionRate: number
  averageGrade: number
  totalLessons: number
  avgTimeSpent: number
  activeStudents: number
  droppedStudents: number
  weeklyActivity: { week: string; activity: number }[]
}

export default function CourseAnalyticsPage() {
  const [courses, setCourses] = useState<CourseAnalytics[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'semester' | 'year'>('month')
  const [loading, setLoading] = useState(true)
  const [showChart, setShowChart] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedCourse, dateRange])

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/reports/course-analytics?course=${selectedCourse}&range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching course analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    const headers = ['Course Title', 'Enrollments', 'Completion Rate %', 'Average Grade %', 'Total Lessons', 'Avg Time Spent (min)', 'Active Students', 'Dropped Students']
    const rows = courses.map(course => [
      course.title,
      course.enrollments,
      course.completionRate,
      course.averageGrade,
      course.totalLessons,
      course.avgTimeSpent,
      course.activeStudents,
      course.droppedStudents
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `course_analytics_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateTotals = () => {
    const totalEnrollments = courses.reduce((sum, c) => sum + c.enrollments, 0)
    const avgCompletion = courses.reduce((sum, c) => sum + c.completionRate, 0) / (courses.length || 1)
    const avgGrade = courses.reduce((sum, c) => sum + c.averageGrade, 0) / (courses.length || 1)
    return { totalEnrollments, avgCompletion: Math.round(avgCompletion), avgGrade: Math.round(avgGrade) }
  }

  const totals = calculateTotals()

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
          <h1 className="text-3xl font-bold text-gray-900">Course Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance metrics across your courses</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm">Total Enrollments</p>
          <p className="text-3xl font-bold mt-1">{totals.totalEnrollments}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm">Avg. Completion Rate</p>
          <p className="text-3xl font-bold mt-1">{totals.avgCompletion}%</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-purple-100 text-sm">Avg. Course Grade</p>
          <p className="text-3xl font-bold mt-1">{totals.avgGrade}%</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <p className="text-orange-100 text-sm">Active Courses</p>
          <p className="text-3xl font-bold mt-1">{courses.length}</p>
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
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="semester">This Semester</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Enrollments</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Completion</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Avg. Grade</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Lessons</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Time Spent</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Active</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Dropped</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-xs text-gray-500">{course.shortName}</p>
                    </div>
                  </td>
                  <td className="py-3 px-6 font-semibold text-gray-900">{course.enrollments}</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 rounded-full h-2" style={{ width: `${course.completionRate}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{course.completionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`font-semibold ${
                      course.averageGrade >= 80 ? 'text-green-600' :
                      course.averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {course.averageGrade}%
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-600">{course.totalLessons}</td>
                  <td className="py-3 px-6 text-gray-600">{course.avgTimeSpent} min</td>
                  <td className="py-3 px-6 text-green-600">{course.activeStudents}</td>
                  <td className="py-3 px-6 text-red-600">{course.droppedStudents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}