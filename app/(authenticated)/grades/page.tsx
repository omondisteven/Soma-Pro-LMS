'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Award, BookOpen, Download, Loader2 } from 'lucide-react'

interface CourseGrade {
  id: string
  courseName: string
  courseCode: string
  instructor: string
  grade: number | null
  letterGrade: string
  credits: number
  status: 'completed' | 'in-progress'
  progress: number
}

interface EnrollmentWithGrades {
  id: string
  course: {
    id: string
    title: string
    shortName: string
    owner: { name: string }
  }
  progress: number
  enrolledAt: string
}

export default function GradesPage() {
  const [grades, setGrades] = useState<CourseGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [overallGPA, setOverallGPA] = useState(0)
  const [completedCredits, setCompletedCredits] = useState(0)
  const [totalCredits, setTotalCredits] = useState(0)

  useEffect(() => {
    fetchGrades()
  }, [])

  const fetchGrades = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/grades/student', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.grades) {
        setGrades(data.grades)
        setOverallGPA(data.overallGPA || 0)
        setCompletedCredits(data.completedCredits || 0)
        setTotalCredits(data.totalCredits || 0)
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A'
    if (percentage >= 85) return 'A-'
    if (percentage >= 80) return 'B+'
    if (percentage >= 75) return 'B'
    if (percentage >= 70) return 'B-'
    if (percentage >= 65) return 'C+'
    if (percentage >= 60) return 'C'
    if (percentage >= 55) return 'C-'
    if (percentage >= 50) return 'D'
    return 'F'
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-700'
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const completedCourses = grades.filter(g => g.status === 'completed')
  const inProgressCourses = grades.filter(g => g.status === 'in-progress')

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Track your academic progress</h2>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />

      {/* GPA Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Overall GPA</p>
              <p className="text-3xl font-bold mt-1">{overallGPA.toFixed(2)}</p>
            </div>
            <TrendingUp size={32} className="text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Completed Courses</p>
              <p className="text-3xl font-bold mt-1">{completedCourses.length}</p>
            </div>
            <Award size={32} className="text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Completed Credits</p>
              <p className="text-3xl font-bold mt-1">{completedCredits}</p>
            </div>
            <BookOpen size={32} className="text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Credits</p>
              <p className="text-3xl font-bold mt-1">{totalCredits}</p>
            </div>
            <BookOpen size={32} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Course Grades</h2>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <Download size={16} />
            Download Report
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Instructor</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Grade</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Letter</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Credits</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Progress</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((course) => (
                <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                      <span className="text-gray-400">Not graded</span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    {course.grade !== null ? (
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(course.grade)}`}>
                        {course.letterGrade}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-gray-600">{course.credits}</td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1 text-sm ${
                      course.status === 'completed' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {course.status === 'completed' ? '✓ Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 rounded-full h-2 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{course.progress}%</span>
                    </div>
                  </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {grades.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No grades yet</h3>
            <p className="text-gray-600">Enroll in courses to see your grades here.</p>
          </div>
        )}
      </div>
    </div>
  )
}