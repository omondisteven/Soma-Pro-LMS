'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Users, Settings } from 'lucide-react'

interface Course {
  id: string
  title: string
  shortName: string
  description: string
  status: string
  visibility: string
  _count: {
    sections: number
    enrollments: number
  }
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      // Filter only courses where user is teacher/owner
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your courses, sections, and lessons</p>
        </div>
        <Link
          href="/courses"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Create New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-4">Create your first course to start building content</p>
          <Link
            href="/courses"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Create Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.shortName}</p>
                  </div>
                  {course.status === 'DRAFT' && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Draft</span>
                  )}
                  {course.status === 'PUBLISHED' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Published</span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} />
                    <span>{course._count.sections} sections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{course._count.enrollments} students</span>
                  </div>
                </div>
                
                <Link
                  href={`/teacher/courses/${course.id}/manage`}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Settings size={16} />
                  Manage Course Content
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}