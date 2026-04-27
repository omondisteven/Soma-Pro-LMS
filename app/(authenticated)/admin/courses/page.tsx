'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Users, Plus, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import CourseModal from '@/components/CourseModal'

interface Course {
  id: string
  title: string
  shortName: string
  description: string
  category: string
  price: number
  currency: string
  status: string
  visibility: string
  startDate: string
  endDate: string | null
  owner: { name: string }
  instructors: { instructor: { name: string } }[]
  _count: { enrollments: number; sections: number }
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)
  const [isViewMode, setIsViewMode] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseCreated = () => {
    fetchCourses()
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setIsViewMode(false)
    setIsModalOpen(true)
    setOpenMenuId(null)
  }

  const handleViewDetails = (course: Course) => {
    setEditingCourse(course)
    setIsViewMode(true)
    setIsModalOpen(true)
    setOpenMenuId(null)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete course')
      }

      fetchCourses()
    } catch (error: any) {
      alert(error.message)
    }
    setOpenMenuId(null)
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-gray-600 mt-1">View and manage all courses in the system</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null)
            setIsViewMode(false)
            setIsModalOpen(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Course
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Instructor</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Price</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Students</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
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
                  <td className="py-3 px-6 text-gray-600">
                    {course.instructors.map(i => i.instructor.name).join(', ') || course.owner.name}
                  </td>
                  <td className="py-3 px-6">
                    {course.price > 0 ? `${course.currency} ${course.price}` : 'Free'}
                  </td>
                  <td className="py-3 px-6 text-gray-600">{course._count.enrollments}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === course.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => handleViewDetails(course)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Edit Course
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCourse(null)
        }}
        onCourseCreated={handleCourseCreated}
        editingCourse={editingCourse}
        isViewMode={isViewMode}
      />
    </div>
  )
}