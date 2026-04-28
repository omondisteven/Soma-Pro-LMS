
// app\(authenticated)\dashboard\page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Award, Clock, TrendingUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalTeachers?: number
  totalEnrollments?: number
  averageGrade: number
  completionRate: number
  pendingAssignments: number
  gradedAssignments: number
  revenue?: number
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

  if (userRole === 'ADMIN') {
    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      if (!amount) return 'KES 0'
      return `KES ${Math.round(amount).toLocaleString()}`
    }

    const adminStatsCards = [
      { 
        title: 'Total Courses', 
        value: stats.totalCourses, 
        icon: BookOpen, 
        gradient: 'from-blue-500 to-blue-600',
        bgGradient: 'from-blue-50 to-blue-100',
        iconBg: 'bg-blue-500',
        iconColor: 'text-white',
        borderColor: 'border-blue-200'
      },
      { 
        title: 'Total Students', 
        value: stats.totalStudents, 
        icon: Users, 
        gradient: 'from-green-500 to-green-600',
        bgGradient: 'from-green-50 to-green-100',
        iconBg: 'bg-green-500',
        iconColor: 'text-white',
        borderColor: 'border-green-200'
      },
      { 
        title: 'Total Teachers', 
        value: stats.totalTeachers || 0, 
        icon: Users, 
        gradient: 'from-purple-500 to-purple-600',
        bgGradient: 'from-purple-50 to-purple-100',
        iconBg: 'bg-purple-500',
        iconColor: 'text-white',
        borderColor: 'border-purple-200'
      },
      { 
        title: 'Total Revenue', 
        value: stats.revenue ? formatCurrency(stats.revenue) : 'KES 0', 
        icon: TrendingUp, 
        gradient: 'from-orange-500 to-orange-600',
        bgGradient: 'from-orange-50 to-orange-100',
        iconBg: 'bg-orange-500',
        iconColor: 'text-white',
        borderColor: 'border-orange-200'
      },
    ]

    // Additional metrics for admin
    const additionalMetrics = [
      { 
        label: 'Active Enrollments', 
        value: stats.totalEnrollments?.toLocaleString() || 0, 
        change: '+12%', 
        changeType: 'positive',
        icon: TrendingUp,
        color: 'text-green-600'
      },
      { 
        label: 'Completion Rate', 
        value: `${Math.round(stats.completionRate || 0)}%`, 
        change: '+5%', 
        changeType: 'positive',
        icon: Award,
        color: 'text-blue-600'
      },
      { 
        label: 'Pending Applications', 
        value: stats.pendingAssignments?.toLocaleString() || 0, 
        change: '-3%', 
        changeType: 'negative',
        icon: Clock,
        color: 'text-orange-600'
      },
      { 
        label: 'Avg. Grade', 
        value: `${Math.round(stats.averageGrade || 0)}%`, 
        change: '+2%', 
        changeType: 'positive',
        icon: Award,
        color: 'text-purple-600'
      },
    ]

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-100 opacity-90">System-wide overview and analytics</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 rounded-full p-3">
                <TrendingUp size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStatsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl border ${stat.borderColor} p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.iconBg} p-3 rounded-xl shadow-lg`}>
                    <Icon size={24} className={stat.iconColor} />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
                </div>
                <h3 className="text-gray-600 font-medium text-sm">{stat.title}</h3>
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full w-2/3`} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {additionalMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  </div>
                  <div className={`${metric.color} bg-gray-50 p-2 rounded-lg`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-medium ${metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
                <p className="text-sm text-gray-500 mt-1">Monthly revenue trend</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue || 0)}</p>
                  <p className="text-sm text-green-600">Total Revenue</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">This month</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency((stats.revenue || 0) / 12)}
                  </p>
                </div>
              </div>
              {/* Simple progress bar for visual */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Revenue Target</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full h-2" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link 
                href="/courses" 
                className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="bg-blue-500 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Manage Courses</span>
              </Link>
              <Link 
                href="/admin/teachers" 
                className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="bg-green-500 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <Users size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Manage Teachers</span>
              </Link>
              <Link 
                href="/admin/students" 
                className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="bg-purple-500 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <Users size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Manage Students</span>
              </Link>
              <Link 
                href="/admin/finance" 
                className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="bg-orange-500 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Financial Reports</span>
              </Link>
            </div>
          </div>
        </div>

        {/* System Insights Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Insights</h2>
            <p className="text-sm text-gray-500 mt-1">Key metrics and performance indicators</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Users size={24} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-500">Total Enrollments</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingAssignments?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-500">Pending Applications</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Award size={24} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageGrade || 0)}%</p>
                <p className="text-sm text-gray-500">Average Grade</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                  <CheckCircle size={24} className="text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.gradedAssignments?.toLocaleString() || 0}</p>
                <p className="text-sm text-gray-500">Graded Submissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        {recentCourses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
              <p className="text-sm text-gray-500 mt-1">Latest courses added to the platform</p>
            </div>
            <div className="divide-y divide-gray-100">
              {recentCourses.slice(0, 3).map((course) => (
                <div key={course.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Instructor: {course.instructor}</p>
                    </div>
                    <Link 
                      href={`/courses/${course.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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