'use client'

import { useEffect, useState } from 'react'
import { Search, Mail, MoreVertical, Loader2, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  email: string
  courseId: string
  courseName: string
  courseCode: string
  progress: number
  enrolledAt: string
  lastActive: string
  grade?: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    // Filter students based on search term and selected course
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCourse !== 'all') {
      filtered = filtered.filter(student => student.courseId === selectedCourse)
    }

    setFilteredStudents(filtered)
  }, [searchTerm, selectedCourse, students])

  const fetchStudents = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Fetch all enrollments for courses taught by this teacher
      const res = await fetch('/api/teacher/students', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.students) {
        setStudents(data.students)
        setFilteredStudents(data.students)
      }
      
      if (data.courses) {
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
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
      <div className="bg-gray-200 flex justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-gray-900">Manage and track student progress across your courses</h3>
        </div>
        
        <div className="flex gap-3">
          {/* Course Filter Dropdown */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <UserCheck size={18} />
            Invite Students
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by student name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Student</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Progress</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Enrolled Date</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Last Active</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Grade</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    {searchTerm || selectedCourse !== 'all' 
                      ? 'No students match your filters' 
                      : 'No students enrolled in your courses yet'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={`${student.id}-${student.courseId}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Mail size={14} />
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div>
                        <p className="text-gray-900">{student.courseName}</p>
                        <p className="text-xs text-gray-500">{student.courseCode}</p>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 rounded-full h-2 transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-gray-500">
                      {formatDate(student.enrolledAt)}
                    </td>
                    <td className="py-3 px-6 text-gray-500">
                      {formatDate(student.lastActive)}
                    </td>
                    <td className="py-3 px-6">
                      {student.grade !== undefined ? (
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          (student.grade || 0) >= 70 ? 'bg-green-100 text-green-700' :
                          (student.grade || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {student.grade}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      <Link
                        href={`/teacher/students/${student.id}?course=${student.courseId}`}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Total Students</p>
            <p className="text-2xl font-bold text-blue-700">{students.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Unique Students</p>
            <p className="text-2xl font-bold text-green-700">
              {new Set(students.map(s => s.id)).size}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Active Courses</p>
            <p className="text-2xl font-bold text-purple-700">{courses.length}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600">Avg. Progress</p>
            <p className="text-2xl font-bold text-orange-700">
              {Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}