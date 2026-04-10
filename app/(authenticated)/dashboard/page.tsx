'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Award, Clock, TrendingUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  averageGrade: number
  completionRate: number
  pendingAssignments: number
  gradedAssignments: number
}

interface RecentCourse {
  id: string
  title: string
  progress: number
  instructor: string
  lastActivity: string
}

interface PendingSubmission {
  id: string
  assignmentTitle: string
  studentName: string
  submittedAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    averageGrade: 0,
    completionRate: 0,
    pendingAssignments: 0,
    gradedAssignments: 0
  })
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      setUserRole(parsed.role)
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      
      const data = await res.json()
      
      setStats(data.stats || {
        totalCourses: 0,
        totalStudents: 0,
        averageGrade: 0,
        completionRate: 0,
        pendingAssignments: 0,
        gradedAssignments: 0
      })
      setRecentCourses(data.recentCourses || [])
      setPendingSubmissions(data.pendingSubmissions || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 80) return 'text-green-600'
    if (grade >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Student Dashboard
  if (userRole === 'STUDENT') {
    const studentStatsCards = [
      { title: 'Enrolled Courses', value: stats.totalCourses, icon: BookOpen, color: 'bg-blue-500' },
      { title: 'Average Grade', value: `${stats.averageGrade}%`, icon: Award, color: 'bg-purple-500' },
      { title: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'bg-green-500' },
      { title: 'Pending Assignments', value: stats.pendingAssignments, icon: Clock, color: 'bg-orange-500' },
    ]

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-600 mt-1">Continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {studentStatsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Courses</h2>
            {recentCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No courses yet. Enroll in a course to get started!</p>
            ) : (
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <Link href={`/courses/${course.id}`} key={course.id}>
                    <div className="border-b border-gray-100 pb-4 last:border-0 hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-500">Instructor: {course.instructor}</p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 rounded-full h-2 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Last activity: {new Date(course.lastActivity).toLocaleDateString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Assignments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Assignments</h2>
            {stats.pendingAssignments === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                <p className="text-gray-500">All caught up! No pending assignments.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-gray-900">{submission.assignmentTitle}</p>
                      <p className="text-sm text-gray-500">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending Review</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Teacher Dashboard
  const teacherStatsCards = [
    { title: 'My Courses', value: stats.totalCourses, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Enrolled Students', value: stats.totalStudents, icon: Users, color: 'bg-green-500' },
    { title: 'Avg. Course Grade', value: `${stats.averageGrade}%`, icon: Award, color: 'bg-purple-500' },
    { title: 'Pending Grading', value: stats.pendingAssignments, icon: Clock, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your courses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {teacherStatsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Courses</h2>
            <Link href="/courses" className="text-sm text-blue-600 hover:text-blue-700">View all →</Link>
          </div>
          {recentCourses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No courses yet. Create your first course!</p>
          ) : (
            <div className="space-y-4">
              {recentCourses.map((course) => (
                <Link href={`/teacher/courses/${course.id}/manage`} key={course.id}>
                  <div className="border-b border-gray-100 pb-4 last:border-0 hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.instructor}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">{course.progress}% completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2 transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Grading */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Pending Grading</h2>
            <Link href="/teacher/grading" className="text-sm text-blue-600 hover:text-blue-700">Go to Grading →</Link>
          </div>
          {stats.pendingAssignments === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
              <p className="text-gray-500">All caught up! No pending submissions to grade.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map((submission) => (
                <Link href="/teacher/grading" key={submission.id}>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">{submission.assignmentTitle}</p>
                      <p className="text-sm text-gray-500">Student: {submission.studentName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending</span>
                      <p className="text-xs text-gray-400 mt-1">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/courses" className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <BookOpen className="mx-auto text-blue-600 mb-2" size={24} />
            <p className="text-sm font-medium text-blue-600">Manage Courses</p>
          </Link>
          <Link href="/teacher/grading" className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Award className="mx-auto text-green-600 mb-2" size={24} />
            <p className="text-sm font-medium text-green-600">Grade Submissions</p>
          </Link>
          <Link href="/students" className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="mx-auto text-purple-600 mb-2" size={24} />
            <p className="text-sm font-medium text-purple-600">View Students</p>
          </Link>
          <Link href="/enroll-students" className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Users className="mx-auto text-orange-600 mb-2" size={24} />
            <p className="text-sm font-medium text-orange-600">Enroll Students</p>
          </Link>
        </div>
      </div>
    </div>
  )
}