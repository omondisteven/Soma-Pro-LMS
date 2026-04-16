'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  BookOpen, 
  Users, 
  Calendar, 
  Award, 
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingUp,
  UserCheck,
  FileText,
  PieChart,
  DollarSign,
  CreditCard
} from 'lucide-react'

interface SidebarProps {
  userRole: string
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(true) // Changed to true so reports are visible by default

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <aside className="w-56 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-xl z-20">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Cps-LMS
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Learning Management System</p>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Dashboard - First item */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-md transition-all text-sm ${
            pathname === '/dashboard'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Home size={18} />
          <span className="font-normal">Dashboard</span>
        </Link>

        {/* Collapsible Courses Section */}
        <div className="mt-1">
          <button
            onClick={() => setIsCoursesOpen(!isCoursesOpen)}
            className="w-full flex items-center justify-between px-4 py-1.5 mx-2 rounded-md transition-all text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={18} />
              <span className="font-medium">Courses</span>
            </div>
            {isCoursesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {isCoursesOpen && (
            <div className="ml-7 mt-0.5 space-y-0.5">
              <Link
                href="/courses"
                className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                  pathname === '/courses'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="font-normal">My Courses</span>
              </Link>
              
              {userRole === 'STUDENT' && (
                <Link
                  href="/courses/public"
                  className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                    pathname === '/courses/public'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="font-normal">Browse Courses</span>
                </Link>
              )}
              
              {userRole === 'TEACHER' && (
                <Link
                  href="/enroll-students"
                  className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                    pathname === '/enroll-students'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="font-normal">Enroll Students</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Other Menu Items */}
        <div className="mt-2 space-y-0.5">
          {/* Assignments - only for students */}
          {userRole === 'STUDENT' && (
            <Link
              href="/assignments"
              className={`flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-md transition-all text-sm ${
                pathname === '/assignments'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Calendar size={18} />
              <span className="font-normal">Assignments</span>
            </Link>
          )}
          
          {/* Grades - only for students */}
          {userRole === 'STUDENT' && (
            <Link
              href="/grades"
              className={`flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-md transition-all text-sm ${
                pathname === '/grades'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Award size={18} />
              <span className="font-normal">Grades</span>
            </Link>
          )}
          
          {/* Grading - only for teachers */}
          {userRole === 'TEACHER' && (
            <Link
              href="/teacher/grading"
              className={`flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-md transition-all text-sm ${
                pathname === '/teacher/grading'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Award size={18} />
              <span className="font-normal">Grading</span>
            </Link>
          )}
          
          {/* Students - only for teachers */}
          {userRole === 'TEACHER' && (
            <Link
              href="/students"
              className={`flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-md transition-all text-sm ${
                pathname === '/students'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Users size={18} />
              <span className="font-normal">Students</span>
            </Link>
          )}

          {/* Collapsible Reports Section - for both students and teachers */}
          <div className="mt-1">
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className="w-full flex items-center justify-between px-4 py-1.5 mx-2 rounded-md transition-all text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 size={18} />
                <span className="font-medium">Reports</span>
              </div>
              {isReportsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {isReportsOpen && (
              <div className="ml-7 mt-0.5 space-y-0.5">
                {/* Student Reports */}
                {userRole === 'STUDENT' && (
                  <>
                    <Link
                      href="/reports/progress"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/progress'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <TrendingUp size={16} />
                      <span className="font-normal">Progress Report</span>
                    </Link>
                    <Link
                      href="/reports/grades"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/grades'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Award size={16} />
                      <span className="font-normal">Grade Report</span>
                    </Link>
                    <Link
                      href="/reports/assignments"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/assignments'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <FileText size={16} />
                      <span className="font-normal">Assignment Report</span>
                    </Link>
                  </>
                )}
                
                {/* Teacher Reports */}
                {userRole === 'TEACHER' && (
                  <>
                    <Link
                      href="/reports/course-analytics"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/course-analytics'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <TrendingUp size={16} />
                      <span className="font-normal">Course Analytics</span>
                    </Link>
                    <Link
                      href="/reports/student-performance"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/student-performance'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <UserCheck size={16} />
                      <span className="font-normal">Student Performance</span>
                    </Link>
                    <Link
                      href="/reports/assignment-analysis"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/assignment-analysis'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <FileText size={16} />
                      <span className="font-normal">Assignment Analysis</span>
                    </Link>
                    <Link
                      href="/reports/grade-distribution"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/grade-distribution'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <PieChart size={16} />
                      <span className="font-normal">Grade Distribution</span>
                    </Link>
                  </>
                )}
                
                {/* Financial Reports - For Admin/Teachers */}
                {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
                  <>
                    <div className="border-t border-gray-700 my-1 mx-2"></div>
                    <Link
                      href="/reports/finance"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/reports/finance'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <DollarSign size={16} />
                      <span className="font-normal">Financial Reports</span>
                    </Link>
                    <Link
                      href="/admin/finance"
                      className={`flex items-center gap-2.5 px-4 py-1.5 rounded-md transition-all text-sm ${
                        pathname === '/admin/finance'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <CreditCard size={16} />
                      <span className="font-normal">Payment History</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-md transition-all text-sm ${
              pathname === '/settings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Settings size={18} />
            <span className="font-normal">Settings</span>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-1.5 mx-2 rounded-md transition-all text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full"
        >
          <LogOut size={18} />
          <span className="font-normal">Logout</span>
        </button>
      </div>
    </aside>
  )
}