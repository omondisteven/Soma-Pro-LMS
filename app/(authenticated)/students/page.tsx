// app/(authenticated)/students/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Search, Mail, Loader2, UserCheck, Eye, TrendingUp, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import DataTable from '@/components/ui/DataTable'

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

  // Calculate summary stats
  const totalUniqueStudents = new Set(students.map(s => s.id)).size
  const averageProgress = students.length > 0 
    ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length) 
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600 mt-1">Manage and track student progress across your courses</p>
        </div>
        
        <div className="flex gap-3">
          {/* Course Filter Dropdown */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Summary Stats Cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Enrollments</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users size={28} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Unique Students</p>
                <p className="text-2xl font-bold">{totalUniqueStudents}</p>
              </div>
              <UserCheck size={28} className="text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Active Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen size={28} className="text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg. Progress</p>
                <p className="text-2xl font-bold">{averageProgress}%</p>
              </div>
              <TrendingUp size={28} className="text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {/* Students Data Table */}
      <DataTable
        data={filteredStudents}
        emptyMessage={
          searchTerm || selectedCourse !== 'all' 
            ? 'No students match your filters' 
            : 'No students enrolled in your courses yet'
        }
        columns={[
          {
            key: 'student',
            header: 'Student',
            render: (student: Student) => (
              <div>
                <p className="font-semibold text-gray-900">{student.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Mail size={14} />
                  <span>{student.email}</span>
                </div>
              </div>
            )
          },
          {
            key: 'course',
            header: 'Course',
            render: (student: Student) => (
              <div>
                <p className="font-medium text-gray-900">{student.courseName}</p>
                <p className="text-xs text-gray-500">{student.courseCode}</p>
              </div>
            )
          },
          {
            key: 'progress',
            header: 'Progress',
            render: (student: Student) => (
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2 transition-all"
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{student.progress}%</span>
              </div>
            )
          },
          {
            key: 'enrolledAt',
            header: 'Enrolled Date',
            render: (student: Student) => (
              <span className="text-gray-600">{formatDate(student.enrolledAt)}</span>
            )
          },
          {
            key: 'lastActive',
            header: 'Last Active',
            render: (student: Student) => (
              <span className="text-gray-600">{formatDate(student.lastActive)}</span>
            )
          },
          {
            key: 'grade',
            header: 'Grade',
            render: (student: Student) => {
              if (student.grade !== undefined && student.grade !== null) {
                const grade = student.grade
                const gradeColor = grade >= 70 ? 'bg-green-100 text-green-700' :
                                  grade >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                return (
                  <span className={`px-2 py-1 rounded text-sm font-medium ${gradeColor}`}>
                    {grade}%
                  </span>
                )
              }
              return <span className="text-gray-400">—</span>
            }
          }
        ]}
        actions={[
          {
            label: 'View Student Details',
            icon: <Eye size={14} />,
            onClick: (student: Student) => {
              window.location.href = `/teacher/students/${student.id}?course=${student.courseId}`
            }
          }
        ]}
        itemsPerPage={10}
      />

      {/* Quick Tip for Teachers */}
      {students.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Quick Tip:</strong> Click on any student row to view detailed progress and performance analytics.
          </p>
        </div>
      )}
    </div>
  )
}