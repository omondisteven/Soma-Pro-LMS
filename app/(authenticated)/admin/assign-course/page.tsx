'use client'

import { useEffect, useState } from 'react'
import { Check, X, BookOpen, User } from 'lucide-react'

interface Teacher {
  id: string
  name: string
  email: string
}

interface Course {
  id: string
  title: string
  shortName: string
  currentTeachers: { id: string }[]
}

export default function AssignCoursePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    try {
      const [teachersRes, coursesRes] = await Promise.all([
        fetch('/api/admin/teachers/list', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/courses/list', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      const teachersData = await teachersRes.json()
      const coursesData = await coursesRes.json()
      
      setTeachers(teachersData.teachers || [])
      setCourses(coursesData.courses || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedCourse) {
      setMessage({ type: 'error', text: 'Please select both a teacher and a course' })
      return
    }

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/courses/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          courseId: selectedCourse
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Course assigned successfully!' })
        setSelectedTeacher('')
        setSelectedCourse('')
        fetchData()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to assign course' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign course' })
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
        <h1 className="text-3xl font-bold text-gray-900">Assign Course to Teacher</h1>
        <p className="text-gray-600 mt-1">Assign courses to teachers for instruction</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a teacher...</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
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
            onClick={handleAssign}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Assign Course
          </button>
        </div>
      </div>

      {/* Current Assignments */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Course Assignments</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Teacher</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                course.currentTeachers.map((teacher) => {
                  const teacherInfo = teachers.find(t => t.id === teacher.id)
                  return (
                    <tr key={`${course.id}-${teacher.id}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6 font-medium text-gray-900">{teacherInfo?.name}</td>
                      <td className="py-3 px-6 text-gray-600">{course.title}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                       </td>
                      <td className="py-3 px-6">
                        <button className="text-red-600 hover:text-red-700">
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}