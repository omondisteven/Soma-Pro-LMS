// app\(authenticated)\courses\page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Plus } from 'lucide-react'
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
  applicationStatus?: string
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

  const isTeacher = user?.role === 'TEACHER'
  const isStudent = user?.role === 'STUDENT'

  // ✅ SAME LOGIC AS PUBLIC PAGE
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
      <div className="bg-gray-200 flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isTeacher
            ? 'Manage your courses'
            : 'My Courses'}
        </h1>

        <div className="flex gap-4">
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />

          {isTeacher && (
            <button
              onClick={() => {
                setEditingCourse(null)
                setIsModalOpen(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2"
            >
              <Plus size={20} />
              Create Course
            </button>
          )}
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center p-12">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <p>No courses yet</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const button = getButtonState(course)

            return (
              <div key={course.id} className="bg-white rounded-xl border p-5">
                <Link href={`/courses/${course.id}`}>
                  <h3 className="font-semibold text-lg">{course.title}</h3>
                </Link>

                <p className="text-sm text-gray-600 mb-3">
                  {course.description}
                </p>

                {/* ✅ STUDENT ACTION BUTTON */}
                {isStudent && (
                  <button
                    onClick={() => {
                      if (!button.disabled) {
                        window.location.href = `/checkout?course=${course.id}`
                      }
                    }}
                    className={`w-full mt-2 px-4 py-2 rounded ${
                      button.variant === 'success'
                        ? 'bg-green-100 text-green-700'
                        : button.variant === 'warning'
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {button.text}
                  </button>
                )}

                {/* TEACHER MENU */}
                {isTeacher && (
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