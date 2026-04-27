'use client'

import { useEffect, useState } from 'react'
import { Check, X, BookOpen, User, Trash2 } from 'lucide-react'

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
  const [teacherMap, setTeacherMap] = useState<Map<string, Teacher>>(new Map())

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
      
      // Create teacher map for quick lookup
      const map = new Map()
      teachersData.teachers?.forEach((t: Teacher) => {
        map.set(t.id, t)
      })
      setTeacherMap(map)
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
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
        fetchData() // Refresh the list
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to assign course' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign course' })
    }
  }

  const handleRemove = async (courseId: string, teacherId: string) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/admin/courses/assign?courseId=${courseId}&teacherId=${teacherId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Course assignment removed!' })
        fetchData()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to remove assignment' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove assignment' })
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

      <div className="grid md:grid-cols-2 gap-8">
        {/* Assignment Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Assignment</h2>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Assignments</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {courses.map((course) => (
              course.currentTeachers.map((teacher) => {
                const teacherInfo = teacherMap.get(teacher.id)
                if (!teacherInfo) return null
                return (
                  <div key={`${course.id}-${teacher.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-500" />
                        <span className="font-medium text-gray-900">{course.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{teacherInfo.name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(course.id, teacher.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              })
            ))}
            {courses.every(c => c.currentTeachers.length === 0) && (
              <p className="text-gray-500 text-center py-8">No assignments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}