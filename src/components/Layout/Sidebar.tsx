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
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingUp,
  UserCheck,
  FileText,
  PieChart,
  DollarSign,
  CreditCard,
  X,
  Shield
} from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'

interface SidebarProps {
  userRole: string
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { isOpen, closeSidebar } = useSidebar()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar()
    }
  }

  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const isTeacher = userRole === 'TEACHER'
  const isStudent = userRole === 'STUDENT'

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              SomaPRO
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Learning Management System</p>
          </div>
          {isMobile && (
            <button 
              onClick={closeSidebar}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Dashboard - Everyone */}
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          className={menuItemClass(pathname === '/dashboard')}
        >
          <Home size={18} />
          <span className="font-normal">Dashboard</span>
        </Link>

        {/* User Management - ADMIN and MANAGER only */}
        {isAdmin && (
          <>
            <Link
              href="/admin/students"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/admin/students')}
            >
              <Users size={18} />
              <span className="font-normal">Students</span>
            </Link>
            <Link
              href="/admin/teachers"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/admin/teachers')}
            >
              <Users size={18} />
              <span className="font-normal">Teachers</span>
            </Link>
            <Link
              href="/admin/assign-course"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/admin/assign-course')}
            >
              <BookOpen size={18} />
              <span className="font-normal">Assign Course</span>
            </Link>
          </>
        )}

        {/* Courses Section - Everyone */}
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
              {/* My Courses - Everyone */}
              <Link
                href="/courses"
                onClick={handleLinkClick}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                  pathname === '/courses'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="font-normal">My Courses</span>
              </Link>
              
              {/* Browse Courses - Only Students */}
              {isStudent && (
                <Link
                  href="/courses/public"
                  onClick={handleLinkClick}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
                    pathname === '/courses/public'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="font-normal">Browse Courses</span>
                </Link>
              )}
              
              {/* Enroll Students - Only Teachers */}
              {isTeacher && (
                <Link
                  href="/enroll-students"
                  onClick={handleLinkClick}
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
          {/* Assignments - Only Students */}
          {isStudent && (
            <Link
              href="/assignments"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/assignments')}
            >
              <Calendar size={18} />
              <span className="font-normal">Assignments</span>
            </Link>
          )}
          
          {/* Grades - Only Students */}
          {isStudent && (
            <Link
              href="/grades"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/grades')}
            >
              <Award size={18} />
              <span className="font-normal">Grades</span>
            </Link>
          )}
          
          {/* Grading - Only Teachers */}
          {isTeacher && (
            <Link
              href="/teacher/grading"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/teacher/grading')}
            >
              <Award size={18} />
              <span className="font-normal">Grading</span>
            </Link>
          )}
          
          {/* Students Management - Only Teachers */}
          {isTeacher && (
            <Link
              href="/students"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/students')}
            >
              <Users size={18} />
              <span className="font-normal">Students</span>
            </Link>
          )}

          {/* Reports Section - For Teachers and Students */}
          {(isTeacher || isStudent) && (
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
                  {isTeacher && (
                    <>
                      <Link href="/reports/course-analytics" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <TrendingUp size={16} />
                        <span className="font-normal">Course Analytics</span>
                      </Link>
                      <Link href="/reports/student-performance" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <UserCheck size={16} />
                        <span className="font-normal">Student Performance</span>
                      </Link>
                      <Link href="/reports/assignment-analysis" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <FileText size={16} />
                        <span className="font-normal">Assignment Analysis</span>
                      </Link>
                      <Link href="/reports/grade-distribution" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <PieChart size={16} />
                        <span className="font-normal">Grade Distribution</span>
                      </Link>
                      <Link href="/reports/finance" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <DollarSign size={16} />
                        <span className="font-normal">Financial Reports</span>
                      </Link>
                    </>
                  )}
                  
                  {isStudent && (
                    <>
                      <Link href="/reports/progress" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <TrendingUp size={16} />
                        <span className="font-normal">Progress Report</span>
                      </Link>
                      <Link href="/reports/grades" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <Award size={16} />
                        <span className="font-normal">Grade Report</span>
                      </Link>
                      <Link href="/reports/assignments" onClick={handleLinkClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        <FileText size={16} />
                        <span className="font-normal">Assignment Report</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Settings - Everyone */}
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={menuItemClass(pathname === '/settings')}
          >
            <Settings size={18} />
            <span className="font-normal">Settings</span>
          </Link>
        </div>
      </nav>
    </>
  )

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={closeSidebar}
          />
        )}
        
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {sidebarContent}
        </div>
      </>
    )
  }

  return (
    <aside className="hidden lg:block fixed top-0 left-0 h-full w-56 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-xl z-20">
      {sidebarContent}
    </aside>
  )
}