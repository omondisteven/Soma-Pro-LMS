'use client'

import { useState, useEffect } from 'react'
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
  CreditCard,
  X
} from 'lucide-react'

interface SidebarProps {
  userRole: string
  isMobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ userRole, isMobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(true)

  useEffect(() => {
    // Close sidebar on route change on mobile
    if (window.innerWidth < 1024) {
      onClose()
    }
  }, [pathname, onClose])

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

  const menuItemClass = (isActive: boolean) => `
    flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-all text-sm
    ${isActive 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }
  `

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Cps-LMS
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Learning Management System</p>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-700 rounded-lg text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          onClick={onClose}
          className={menuItemClass(pathname === '/dashboard')}
        >
          <Home size={18} />
          <span className="font-normal">Dashboard</span>
        </Link>

        {/* Collapsible Courses Section */}
        <div className="mt-1">
          <button
            onClick={() => setIsCoursesOpen(!isCoursesOpen)}
            className="w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={18} />
              <span className="font-medium">Courses</span>
            </div>
            {isCoursesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {isCoursesOpen && (
            <div className="ml-6 mt-0.5 space-y-0.5">
              <Link
                href="/courses"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
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
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
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
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
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
          {userRole === 'STUDENT' && (
            <Link
              href="/assignments"
              onClick={onClose}
              className={menuItemClass(pathname === '/assignments')}
            >
              <Calendar size={18} />
              <span className="font-normal">Assignments</span>
            </Link>
          )}
          
          {userRole === 'STUDENT' && (
            <Link
              href="/grades"
              onClick={onClose}
              className={menuItemClass(pathname === '/grades')}
            >
              <Award size={18} />
              <span className="font-normal">Grades</span>
            </Link>
          )}
          
          {userRole === 'TEACHER' && (
            <Link
              href="/teacher/grading"
              onClick={onClose}
              className={menuItemClass(pathname === '/teacher/grading')}
            >
              <Award size={18} />
              <span className="font-normal">Grading</span>
            </Link>
          )}
          
          {userRole === 'TEACHER' && (
            <Link
              href="/students"
              onClick={onClose}
              className={menuItemClass(pathname === '/students')}
            >
              <Users size={18} />
              <span className="font-normal">Students</span>
            </Link>
          )}

          {/* Reports Section */}
          <div className="mt-1">
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 size={18} />
                <span className="font-medium">Reports</span>
              </div>
              {isReportsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {isReportsOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {userRole === 'STUDENT' && (
                  <>
                    <Link href="/reports/progress" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <TrendingUp size={16} />
                      <span className="font-normal">Progress Report</span>
                    </Link>
                    <Link href="/reports/grades" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <Award size={16} />
                      <span className="font-normal">Grade Report</span>
                    </Link>
                    <Link href="/reports/assignments" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <FileText size={16} />
                      <span className="font-normal">Assignment Report</span>
                    </Link>
                  </>
                )}
                
                {userRole === 'TEACHER' && (
                  <>
                    <Link href="/reports/course-analytics" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <TrendingUp size={16} />
                      <span className="font-normal">Course Analytics</span>
                    </Link>
                    <Link href="/reports/student-performance" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <UserCheck size={16} />
                      <span className="font-normal">Student Performance</span>
                    </Link>
                    <Link href="/reports/assignment-analysis" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <FileText size={16} />
                      <span className="font-normal">Assignment Analysis</span>
                    </Link>
                    <Link href="/reports/grade-distribution" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <PieChart size={16} />
                      <span className="font-normal">Grade Distribution</span>
                    </Link>
                    <Link href="/reports/finance" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                      <DollarSign size={16} />
                      <span className="font-normal">Financial Reports</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          
          <Link
            href="/settings"
            onClick={onClose}
            className={menuItemClass(pathname === '/settings')}
          >
            <Settings size={18} />
            <span className="font-normal">Settings</span>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-all text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full"
        >
          <LogOut size={18} />
          <span className="font-normal">Logout</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar - always visible on lg screens */}
      <aside className="hidden lg:block w-56 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-xl z-20 fixed h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar - overlay */}
      <div 
        className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden`}
      >
        <div className="relative w-64 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-xl">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}