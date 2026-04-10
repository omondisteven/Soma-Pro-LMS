'use client'

import { useEffect, useState } from 'react'
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Loader2,
  ChevronDown,
  BarChart3,
  PieChart
} from 'lucide-react'

interface CourseGrade {
  id: string
  courseName: string
  courseCode: string
  instructor: string
  grade: number | null
  letterGrade: string
  credits: number
  status: 'completed' | 'in-progress'
  assignments: AssignmentGrade[]
}

interface AssignmentGrade {
  id: string
  title: string
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
  gradedAt: string | null
}

interface GPAHistory {
  semester: string
  gpa: number
  credits: number
}

export default function GradeReportPage() {
  const [grades, setGrades] = useState<CourseGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSemester, setFilterSemester] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [showChart, setShowChart] = useState(true)
  const [gpaHistory, setGpaHistory] = useState<GPAHistory[]>([])

  useEffect(() => {
    fetchGradeData()
  }, [filterSemester, selectedCourse])

  const fetchGradeData = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/reports/grades?semester=${filterSemester}&course=${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setGrades(data.grades || [])
      setGpaHistory(data.gpaHistory || [])
    } catch (error) {
      console.error('Error fetching grade data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    // Generate CSV
    const headers = ['Course Code', 'Course Name', 'Grade (%)', 'Letter Grade', 'Credits', 'Status', 'GPA Points']
    const rows = grades.map(course => [
      course.courseCode,
      course.courseName,
      course.grade !== null ? course.grade : 'Pending',
      course.letterGrade,
      course.credits,
      course.status === 'completed' ? 'Completed' : 'In Progress',
      calculateGradePoints(course.grade || 0)
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grade_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateGradePoints = (percentage: number): number => {
    if (percentage >= 90) return 4.0
    if (percentage >= 85) return 3.7
    if (percentage >= 80) return 3.3
    if (percentage >= 75) return 3.0
    if (percentage >= 70) return 2.7
    if (percentage >= 65) return 2.3
    if (percentage >= 60) return 2.0
    if (percentage >= 50) return 1.0
    return 0
  }

  const calculateOverallGPA = () => {
    const completedCourses = grades.filter(c => c.status === 'completed' && c.grade !== null)
    if (completedCourses.length === 0) return 0
    const totalPoints = completedCourses.reduce((sum, c) => sum + (calculateGradePoints(c.grade || 0) * c.credits), 0)
    const totalCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0)
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  }

  const calculateTotalCredits = () => {
    return grades.reduce((sum, c) => sum + c.credits, 0)
  }

  const calculateCompletedCredits = () => {
    return grades.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.credits, 0)
  }

  const getGradeDistribution = () => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    grades.forEach(course => {
      if (course.grade !== null) {
        if (course.grade >= 90) distribution.A++
        else if (course.grade >= 80) distribution.B++
        else if (course.grade >= 70) distribution.C++
        else if (course.grade >= 60) distribution.D++
        else distribution.F++
      }
    })
    return distribution
  }

  const gradeDistribution = getGradeDistribution()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const overallGPA = calculateOverallGPA()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-gray-900">Detailed analysis of your academic performance</h3>
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
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm">Overall GPA</p>
          <p className="text-3xl font-bold mt-1">{overallGPA}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm">Completed Credits</p>
          <p className="text-3xl font-bold mt-1">{calculateCompletedCredits()}/{calculateTotalCredits()}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-purple-100 text-sm">Courses Completed</p>
          <p className="text-3xl font-bold mt-1">{grades.filter(c => c.status === 'completed').length}/{grades.length}</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <p className="text-orange-100 text-sm">Average Grade</p>
          <p className="text-3xl font-bold mt-1">
            {grades.filter(c => c.grade !== null).length > 0 
              ? Math.round(grades.filter(c => c.grade !== null).reduce((sum, c) => sum + (c.grade || 0), 0) / grades.filter(c => c.grade !== null).length) 
              : 0}%
          </p>
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
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Semesters</option>
            <option value="2024-1">Fall 2024</option>
            <option value="2024-2">Spring 2024</option>
            <option value="2023-1">Fall 2023</option>
          </select>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Courses</option>
            {grades.map(course => (
              <option key={course.id} value={course.id}>{course.courseName}</option>
            ))}
          </select>
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {showChart ? <BarChart3 size={16} /> : <PieChart size={16} />}
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      {showChart && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          <div className="space-y-3">
            {Object.entries(gradeDistribution).map(([grade, count]) => (
              <div key={grade}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Grade {grade}</span>
                  <span className="text-gray-500">{count} course{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`rounded-full h-2 ${
                      grade === 'A' ? 'bg-green-500' :
                      grade === 'B' ? 'bg-blue-500' :
                      grade === 'C' ? 'bg-yellow-500' :
                      grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(count / grades.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GPA History */}
      {gpaHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GPA History</h3>
          <div className="flex items-end gap-4 h-48">
            {gpaHistory.map((sem, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div
                  className="bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                  style={{ height: `${(sem.gpa / 4) * 100}%`, minHeight: '4px' }}
                />
                <p className="text-xs text-gray-600 mt-2">{sem.semester}</p>
                <p className="text-sm font-semibold text-gray-900">{sem.gpa.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grades Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Instructor</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Grade</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Letter</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Credits</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">GPA Points</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((course) => (
                <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{course.courseName}</p>
                      <p className="text-xs text-gray-500">{course.courseCode}</p>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-gray-600">{course.instructor}</td>
                  <td className="py-3 px-6">
                    {course.grade !== null ? (
                      <span className="font-semibold text-gray-900">{course.grade}%</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    {course.grade !== null ? (
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        course.grade >= 90 ? 'bg-green-100 text-green-700' :
                        course.grade >= 80 ? 'bg-blue-100 text-blue-700' :
                        course.grade >= 70 ? 'bg-yellow-100 text-yellow-700' :
                        course.grade >= 60 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {course.letterGrade}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-gray-600">{course.credits}</td>
                  <td className="py-3 px-6 text-gray-600">
                    {course.grade !== null ? calculateGradePoints(course.grade).toFixed(2) : '—'}
                  </td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1 text-sm ${
                      course.status === 'completed' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {course.status === 'completed' ? '✓ Completed' : 'In Progress'}
                    </span>
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