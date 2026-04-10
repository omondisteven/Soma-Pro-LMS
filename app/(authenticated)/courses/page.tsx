// app\(authenticated)\courses\page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Plus, Settings, Edit, Trash2, Eye } from 'lucide-react'
import CourseModal from '@/components/CourseModal'
import CourseActionMenu from '@/components/CourseActionMenu'
import ViewToggle, { ViewMode } from '@/components/ViewToggle'
import CourseListView from '@/components/CourseListView'

interface Instructor {
  id: string
  name: string
  email: string
}

interface CourseInstructor {
  instructor: Instructor
}

interface Course {
  id: string
  title: string
  shortName: string
  description: string
  imageUrl: string | null
  category: string
  visibility: string
  startDate: string
  endDate: string | null
  status: string
  owner?: { name: string }
  instructors?: CourseInstructor[]
  teacher?: { name: string }
  _count: { enrollments: number; sections: number }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isViewMode, setIsViewMode] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

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
  }

  const handleViewDetails = (course: Course) => {
    setEditingCourse(course)
    setIsViewMode(true)
    setIsModalOpen(true)
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
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
    setViewingCourse(null)
    setIsViewMode(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Helper function to get instructor names
  const getInstructorNames = (course: Course) => {
    if (course.instructors && course.instructors.length > 0) {
      return course.instructors.map((inv: any) => inv.instructor?.name || inv.instructor).join(', ')
    }
    if (course.owner?.name) {
      return course.owner.name
    }
    if (course.teacher?.name) {
      return course.teacher.name
    }
    return 'No instructor assigned'
  }

  // Check if user is a teacher (can manage courses)
  const isTeacher = user?.role === 'TEACHER'

  return (
    <>
      <div className="bg-gray-200 flex justify-between items-center mb-8">
        <div>
          {/* <h1 className="text-3xl font-bold text-gray-900">
            {isTeacher ? 'My Courses' : 'My Courses'}
          </h1> */}
          <h1 className="text-2xl font-bold text-gray-900">
            {isTeacher 
              ? 'Manage your courses, create content, and track student progress'
              : 'Access and continue your learning journey'}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          
          {/* Create Course button only for teachers */}
          {isTeacher && (
            <button
              onClick={() => {
                setEditingCourse(null)
                setViewingCourse(null)
                setIsViewMode(false)
                setIsModalOpen(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Create Course
            </button>
          )}
        </div>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />
      
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600">
            {isTeacher 
              ? 'Click the "Create Course" button to create your first course'
              : 'Enroll in a course to begin learning'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ========== GRID VIEW ========== */
        /* Manage Content is INSIDE the three-dot menu */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Course Image/Header */}
              <Link href={isTeacher ? `/teacher/courses/${course.id}/manage` : `/courses/${course.id}`}>
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center cursor-pointer">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="text-white" size={48} />
                  )}
                  {course.status === 'DRAFT' && isTeacher && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Draft
                    </span>
                  )}
                  {course.visibility === 'HIDE' && (
                    <span className="absolute top-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                      Hidden
                    </span>
                  )}
                </div>
              </Link>
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <Link href={isTeacher ? `/teacher/courses/${course.id}/manage` : `/courses/${course.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  
                  {/* Grid View: Three-dot menu WITH Manage Content option */}
                  {isTeacher && (
                    <CourseActionMenu
                      courseId={course.id}
                      courseTitle={course.title}
                      onEdit={() => handleEditCourse(course)}
                      onDelete={() => handleDeleteCourse(course.id)}
                      onViewDetails={() => handleViewDetails(course)}
                      showManageContent={true}
                    />
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Instructors:</span>{' '}
                  {getInstructorNames(course)}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{course._count.enrollments} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>{course._count.sections} sections</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Category: {course.category}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Starts: {new Date(course.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========== LIST VIEW ========== */
        /* Manage Content is a SEPARATE button (handled by CourseListView) */
        <CourseListView
          courses={courses}
          userRole={user?.role}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
          onViewDetails={handleViewDetails}
        />
      )}

      <CourseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCourseCreated={handleCourseCreated}
        editingCourse={editingCourse}
        isViewMode={isViewMode}
      />
    </>
  )
}