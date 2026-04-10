'use client'

import { useEffect, useState } from 'react'
import { Download, Filter, Search, Users, Award, TrendingUp, Loader2, Eye } from 'lucide-react'
import Link from 'next/link'

interface StudentPerformance {
  id: string
  name: string
  email: string
  courseId: string
  courseTitle: string
  progress: number
  grade: number | null
  assignmentsCompleted: number
  totalAssignments: number
  quizzesTaken: number
  avgQuizScore: number
  lastActive: string
}

export default function StudentPerformancePage() {
  const [students, setStudents] = useState<StudentPerformance[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentPerformance[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'grade'>('name')

  useEffect(() => {
    fetchStudentPerformance()
  }, [selectedCourse])

  useEffect(() => {
    filterAndSortStudents()
  }, [students, searchTerm, selectedCourse, sortBy])

  const fetchStudentPerformance = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/reports/student-performance?course=${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStudents(data.students || [])
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching student performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortStudents = () => {
    let filtered = [...students]
    
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(s => s.courseId === selectedCourse)
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'progress') return b.progress - a.progress
      return (b.grade || 0) - (a.grade || 0)
    })
    
    setFilteredStudents(filtered)
  }

  const downloadReport = () => {
    const headers = ['Student Name', 'Email', 'Course', 'Progress %', 'Grade %', 'Assignments Completed', 'Quizzes Taken', 'Avg Quiz Score %', 'Last Active']
    const rows = filteredStudents.map(s => [
      s.name,
      s.email,
      s.courseTitle,
      s.progress,
      s.grade !== null ? s.grade : 'N/A',
      `${s.assignmentsCompleted}/${s.totalAssignments}`,
      s.quizzesTaken,
      s.avgQuizScore,
      new Date(s.lastActive).toLocaleDateString()
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student_performance_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculateAverages = () => {
    const avgProgress = filteredStudents.reduce((sum, s) => sum + s.progress, 0) / (filteredStudents.length || 1)
    const avgGrade = filteredStudents.filter(s => s.grade !== null).reduce((sum, s) => sum + (s.grade || 0), 0) / (filteredStudents.filter(s => s.grade !== null).length || 1)
    return { avgProgress: Math.round(avgProgress), avgGrade: Math.round(avgGrade) }
  }

  const averages = calculateAverages()

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
          <h1 className="text-3xl font-bold text-gray-900">Student Performance</h1>
          <p className="text-gray-600 mt-1">Track individual student progress and grades</p>
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
          <p className="text-blue-100 text-sm">Total Students</p>
          <p className="text-3xl font-bold mt-1">{filteredStudents.length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm">Avg. Progress</p>
          <p className="text-3xl font-bold mt-1">{averages.avgProgress}%</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-purple-100 text-sm">Avg. Grade</p>
          <p className="text-3xl font-bold mt-1">{averages.avgGrade}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="progress">Sort by Progress</option>
            <option value="grade">Sort by Grade</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Student</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Progress</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Grade</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Assignments</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Quizzes</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Last Active</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={`${student.id}-${student.courseId}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-gray-600">{student.courseTitle}</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 rounded-full h-2" style={{ width: `${student.progress}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    {student.grade !== null ? (
                      <span className={`font-semibold ${
                        student.grade >= 80 ? 'text-green-600' :
                        student.grade >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.grade}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {student.assignmentsCompleted}/{student.totalAssignments}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {student.quizzesTaken} ({student.avgQuizScore}%)
                  </td>
                  <td className="py-3 px-6 text-gray-500">
                    {new Date(student.lastActive).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <Link
                      href={`/teacher/students/${student.id}?course=${student.courseId}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye size={18} />
                    </Link>
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