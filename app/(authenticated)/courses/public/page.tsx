// app\(authenticated)\courses\public\page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'  // Make sure this import is correct
import { BookOpen, Users, Calendar } from 'lucide-react'

interface Course {
  id: string
  title: string
  shortName: string
  description: string
  category: string
  startDate: string
  endDate: string | null
  price: number
  currency: string
  owner: { name: string }
  instructors: { instructor: { name: string } }[]
}

interface Application {
  courseId: string
  status: string
  totalPaid: number
}

export default function PublicCoursesPage() {
  const router = useRouter()  // Initialize router
  const [courses, setCourses] = useState<Course[]>([])
  const [applications, setApplications] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [processingCourse, setProcessingCourse] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchCourses()
    fetchApplications()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses/public')
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const appMap = new Map()
      data.applications?.forEach((app: any) => {
        appMap.set(app.courseId, { status: app.status, totalPaid: app.totalPaid })
      })
      setApplications(appMap)
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const handleApply = (courseId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    // Redirect to checkout page
    router.push(`/checkout?course=${courseId}`)
  }

  const getButtonState = (courseId: string) => {
    const app = applications.get(courseId)
    if (!app) return { text: 'Enroll Now', disabled: false, variant: 'primary' }
    
    if (app.status === 'ENROLLED') return { text: 'Enrolled', disabled: true, variant: 'success' }
    if (app.status === 'PAID' || app.status === 'APPROVED') return { text: 'Enrolled', disabled: true, variant: 'success' }
    if (app.status === 'PENDING' || app.status === 'PARTIAL_PAID') {
      return { text: 'Complete Payment', disabled: false, variant: 'warning' }
    }
    if (app.status === 'DECLINED') return { text: 'Apply Again', disabled: false, variant: 'primary' }
    
    return { text: 'Enroll Now', disabled: false, variant: 'primary' }
  }

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'FREE'
    
    const symbols: { [key: string]: string } = {
      KES: 'KSh',
      USD: '$',
      EUR: '€',
      GBP: '£'
    }
    
    const symbol = symbols[currency] || currency
    return `${symbol} ${price.toLocaleString()}`
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
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
        <p className="text-gray-600 mt-1">Browse and apply for courses that interest you</p>
      </div>

      <hr className="border-t-2 border-gray-200" />
      <br />

      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600">Check back later for new courses</p>
          </div>
        ) : (
          courses.map((course) => {
            const buttonState = getButtonState(course.id)
            const isProcessing = processingCourse === course.id
            const app = applications.get(course.id)
            const remainingAmount = app?.totalPaid ? course.price - app.totalPaid : course.price
            
            return (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {course.shortName}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{course.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>Instructors: {course.instructors.map(i => i.instructor.name).join(', ') || course.owner.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">|</span>
                          <span>Category: {course.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Starts: {new Date(course.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 text-right">
                      {/* Price Display */}
                      <div className="mb-3">
                        {course.price > 0 ? (
                          <>
                            <div className="text-2xl font-bold text-blue-600">
                              {formatPrice(course.price, course.currency)}
                            </div>
                            {app?.totalPaid > 0 && app.totalPaid < course.price && (
                              <div className="text-sm text-orange-600 mt-1">
                                Remaining: {formatPrice(remainingAmount, course.currency)}
                              </div>
                            )}
                            {app?.totalPaid > 0 && app.totalPaid >= course.price && (
                              <div className="text-sm text-green-600 mt-1">
                                Fully Paid
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xl font-bold text-green-600">
                            FREE
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          if (!buttonState.disabled) {
                            handleApply(course.id)
                          }
                        }}
                        disabled={buttonState.disabled || isProcessing}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors w-full ${
                          buttonState.variant === 'success'
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : buttonState.variant === 'warning'
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {isProcessing ? 'Processing...' : buttonState.text}
                      </button>
                      
                      {app?.status === 'PARTIAL_PAID' && (
                        <p className="text-xs text-gray-500 mt-2">
                          Partial payment received. Complete payment to enroll.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}