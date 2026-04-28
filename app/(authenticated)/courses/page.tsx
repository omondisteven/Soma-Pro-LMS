// app/(authenticated)/courses/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Plus, Settings, Edit, PlayCircle, CheckCircle, Clock } from 'lucide-react'
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
  applicationStatus?: string | null
  totalPaid?: number
  price?: number
  currency?: string
  _count: { enrollments: number; sections: number }
}

interface Application {
  courseId: string
  status: string
  totalPaid: number
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [applications, setApplications] = useState<Map<string, Application>>(new Map())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isViewMode, setIsViewMode] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))

    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Fetch courses
      const courseRes = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const courseData = await courseRes.json()

      // Fetch applications (only for students)
      let appMap = new Map<string, Application>()

      if (JSON.parse(localStorage.getItem('user') || '{}')?.role === 'STUDENT') {
        const appRes = await fetch('/api/applications', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const appData = await appRes.json()

        appData.applications?.forEach((app: Application) => {
          appMap.set(app.courseId, app)
        })

        setApplications(appMap)
      }

      // Merge applications into courses
      const mergedCourses = (courseData.courses || []).map((course: Course) => {
        const app = appMap.get(course.id)
        return {
          ...course,
          applicationStatus: app?.status,
          totalPaid: app?.totalPaid || 0
        }
      })

      setCourses(mergedCourses)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseCreated = () => fetchData()

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
    if (!confirm('Are you sure you want to delete this course?')) return

    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Delete failed')

      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCourse(null)
    setIsViewMode(false)
  }

  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'
  const isStudent = user?.role === 'STUDENT'

  // Button state for student enrollment
  const getButtonState = (course: Course) => {
    const status = course.applicationStatus

    if (!status) return { text: 'Enroll Now', disabled: false, variant: 'primary' }

    switch (status) {
      case 'APPROVED':
        return { text: 'Enrolled', disabled: true, variant: 'success' }

      case 'PAID':
        return { text: 'Awaiting Approval', disabled: true, variant: 'success' }

      case 'PENDING':
      case 'PARTIAL_PAID':
        return { text: 'Complete Payment', disabled: false, variant: 'warning' }

      case 'DECLINED':
        return { text: 'Apply Again', disabled: false, variant: 'primary' }

      default:
        return { text: 'Enroll Now', disabled: false, variant: 'primary' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Course Management' : isTeacher ? 'Manage Your Courses' : 'My Courses'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Create, edit, and manage all courses in the system' : 
              isTeacher ? 'Create and manage your course content' : 
              'Continue your learning journey'}
          </p>
        </div>

        <div className="flex gap-4">
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />

          {(isAdmin || isTeacher) && (
            <button
              onClick={() => {
                setEditingCourse(null)
                setIsModalOpen(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              Create Course
            </button>
          )}
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No courses yet</p>
          {(isAdmin || isTeacher) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Your First Course
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const button = getButtonState(course)
            const isEnrolled = course.applicationStatus === 'APPROVED'

            return (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Course Image Placeholder */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                  {isEnrolled && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                      <CheckCircle size={12} />
                      Enrolled
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  {/* Course Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                        {course.title}
                      </h3>
                      {course.shortName && (
                        <p className="text-xs text-gray-500 mt-1">{course.shortName}</p>
                      )}
                    </div>
                    
                    {/* Action Menu for Admin/Teacher */}
                    {(isAdmin || isTeacher) && (
                      <CourseActionMenu
                        courseId={course.id}
                        courseTitle={course.title}
                        onEdit={() => handleEditCourse(course)}
                        onDelete={() => handleDeleteCourse(course.id)}
                        onViewDetails={() => handleViewDetails(course)}
                        showManageContent
                      />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {course._count?.sections || 0} sections
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {course._count?.enrollments || 0} students
                    </span>
                  </div>

                  {/* Student Section */}
                  {isStudent && (
                    <div className="space-y-2">
                      {/* Price if applicable */}
                      {course.price && course.price > 0 && !isEnrolled && (
                        <div className="text-sm font-semibold text-gray-900">
                          {course.currency} {course.price}
                        </div>
                      )}
                      
                      {/* Action Button */}
                      {isEnrolled ? (
                        <Link
                          href={`/courses/${course.id}`}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <PlayCircle size={18} />
                          Start Learning
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            if (!button.disabled) {
                              window.location.href = `/checkout?course=${course.id}`
                            }
                          }}
                          className={`w-full px-4 py-2 rounded-lg transition-colors ${
                            button.variant === 'success'
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : button.variant === 'warning'
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          disabled={button.disabled}
                        >
                          {button.text}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Admin/Teacher Management Link */}
                  {(isAdmin || isTeacher) && (
                    <Link
                      href={`/courses/${course.id}/manage`}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Settings size={14} />
                      Manage Course Content
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
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