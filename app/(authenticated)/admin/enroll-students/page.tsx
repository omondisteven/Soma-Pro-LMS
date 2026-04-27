'use client'

import { useEffect, useState } from 'react'
import { Check, X, UserPlus, Users, BookOpen } from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
}

interface Course {
  id: string
  title: string
  shortName: string
}

export default function AdminEnrollStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/students/list', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/courses/list', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      const studentsData = await studentsRes.json()
      const coursesData = await coursesRes.json()
      
      setStudents(studentsData.students || [])
      setCourses(coursesData.courses || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!selectedStudent || !selectedCourse) {
      setMessage({ type: 'error', text: 'Please select both a student and a course' })
      return
    }

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          courseId: selectedCourse
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Student enrolled successfully!' })
        setSelectedStudent('')
        setSelectedCourse('')
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to enroll student' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to enroll student' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enroll Students</h1>
        <p className="text-gray-600 mt-1">Directly enroll students into courses</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.shortName})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleEnroll}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enroll Student
          </button>
        </div>
      </div>
    </div>
  )
}