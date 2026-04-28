// src/components/Layout/Sidebar.tsx
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
  X,
  Shield,
  GraduationCap
} from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'

interface SidebarProps {
  userRole: string
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  // Track which section is expanded - only one at a time
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
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

  // Check if any subitem in a section is active
  const isSectionActive = (sectionPaths: string[]) => {
    return sectionPaths.some(path => pathname?.startsWith(path))
  }

  const menuItemClass = (isActive: boolean) => `
    flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-all text-sm
    ${isActive 
      ? 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-400' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }
  `

  const subMenuItemClass = (isActive: boolean) => `
    flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm
    ${isActive 
      ? 'bg-blue-500/15 text-blue-300 border-l-2 border-blue-400' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }
  `

  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar()
    }
  }

  // Handle section expansion - closes other sections
  const handleSectionToggle = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const isTeacher = userRole === 'TEACHER'
  const isStudent = userRole === 'STUDENT'

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
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
      
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 min-h-0">
        {/* Dashboard - Everyone */}
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          className={menuItemClass(pathname === '/dashboard')}
        >
          <Home size={18} />
          <span className="font-normal">Dashboard</span>
        </Link>

        {/* Admin Section */}
        {isAdmin && (
          <>
            {/* Manage Courses - Direct link */}
            <Link
              href="/courses"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/courses' || pathname?.startsWith('/courses/'))}
            >
              <BookOpen size={18} />
              <span className="font-normal">Manage Courses</span>
            </Link>

            {/* Teachers Collapsible Section */}
            <div className="mt-1">
              <button
                onClick={() => handleSectionToggle('teachers')}
                className={`w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm ${
                  isSectionActive(['/admin/teachers', '/admin/assign-course'])
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users size={18} />
                  <span className="font-medium">Teachers</span>
                </div>
                {expandedSection === 'teachers' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {expandedSection === 'teachers' && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  <Link
                    href="/admin/teachers"
                    onClick={handleLinkClick}
                    className={subMenuItemClass(pathname === '/admin/teachers')}
                  >
                    <span className="font-normal">Manage Teachers</span>
                  </Link>
                  <Link
                    href="/admin/assign-course"
                    onClick={handleLinkClick}
                    className={subMenuItemClass(pathname === '/admin/assign-course')}
                  >
                    <span className="font-normal">Assign Courses</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Students Collapsible Section */}
            <div className="mt-1">
              <button
                onClick={() => handleSectionToggle('students')}
                className={`w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm ${
                  isSectionActive(['/admin/students', '/admin/enroll-students'])
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={18} />
                  <span className="font-medium">Students</span>
                </div>
                {expandedSection === 'students' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {expandedSection === 'students' && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  <Link
                    href="/admin/students"
                    onClick={handleLinkClick}
                    className={subMenuItemClass(pathname === '/admin/students')}
                  >
                    <span className="font-normal">Manage Students</span>
                  </Link>
                  <Link
                    href="/admin/enroll-students"
                    onClick={handleLinkClick}
                    className={subMenuItemClass(pathname === '/admin/enroll-students')}
                  >
                    <span className="font-normal">Enroll Students</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* User Management - MANAGER only (simplified) */}
        {isManager && (
          <Link
            href="/admin/users"
            onClick={handleLinkClick}
            className={menuItemClass(pathname === '/admin/users')}
          >
            <Shield size={18} />
            <span className="font-normal">User Management</span>
          </Link>
        )}

        {/* Courses Section - For Students only */}
        {isStudent && (
          <div className="mt-1">
            <button
              onClick={() => handleSectionToggle('courses')}
              className={`w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm ${
                isSectionActive(['/courses', '/courses/public'])
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={18} />
                <span className="font-medium">Courses</span>
              </div>
              {expandedSection === 'courses' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {expandedSection === 'courses' && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                <Link
                  href="/courses"
                  onClick={handleLinkClick}
                  className={subMenuItemClass(pathname === '/courses')}
                >
                  <span className="font-normal">My Courses</span>
                </Link>
                <Link
                  href="/courses/public"
                  onClick={handleLinkClick}
                  className={subMenuItemClass(pathname === '/courses/public')}
                >
                  <span className="font-normal">Browse Courses</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Courses Section - For Teachers only */}
        {isTeacher && (
          <div className="mt-2">
            <button
              onClick={() => handleSectionToggle('courseManagement')}
              className={`w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm ${
                expandedSection === 'courseManagement'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={18} />
                <span className="font-medium">Course Management</span>
              </div>
              {expandedSection === 'courseManagement' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {expandedSection === 'courseManagement' && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                <Link
                  href="/courses"
                  onClick={handleLinkClick}
                  className={subMenuItemClass(pathname === '/courses')}
                >
                  <span className="font-normal">Manage My Courses</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Courses Section - For Teachers only */}
        {isTeacher && (
          <div className="mt-2">
            <button
              onClick={() => handleSectionToggle('courseManagement')}
              className={`w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm ${
                expandedSection === 'courseManagement'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={18} />
                <span className="font-medium">Course Management</span>
              </div>
              {expandedSection === 'courseManagement' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {expandedSection === 'courseManagement' && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                <Link
                  href="/courses"
                  onClick={handleLinkClick}
                  className={subMenuItemClass(pathname === '/courses')}
                >
                  <span className="font-normal">My Courses</span>
                </Link>
                <Link
                  href="/courses?action=create"
                  onClick={handleLinkClick}
                  className={subMenuItemClass(pathname?.includes('create'))}
                >
                  <span className="font-normal">Create Course</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Reports Section - For Admin, Teachers, and Students */}
        {(isAdmin || isTeacher || isStudent) && (
          <div className="mt-2">
            <button
              onClick={() => handleSectionToggle('reports')}
              className={`w-full flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all text-sm ${
                isSectionActive([
                  '/reports/course-analytics',
                  '/reports/student-performance',
                  '/reports/assignment-analysis',
                  '/reports/grade-distribution',
                  '/admin/finance',
                  '/reports/progress',
                  '/reports/grades',
                  '/reports/assignments'
                ])
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 size={18} />
                <span className="font-medium">Reports</span>
              </div>
              {expandedSection === 'reports' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {expandedSection === 'reports' && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {/* Teacher Reports - For Admin and Teachers */}
                {(isAdmin || isTeacher) && (
                  <>
                    <Link href="/reports/course-analytics" onClick={handleLinkClick} className={subMenuItemClass(pathname === '/reports/course-analytics')}>
                      <TrendingUp size={16} />
                      <span className="font-normal">Course Analytics</span>
                    </Link>
                    <Link href="/reports/student-performance" onClick={handleLinkClick} className={subMenuItemClass(pathname === '/reports/student-performance')}>
                      <UserCheck size={16} />
                      <span className="font-normal">Student Performance</span>
                    </Link>
                    <Link href="/reports/assignment-analysis" onClick={handleLinkClick} className={subMenuItemClass(pathname === '/reports/assignment-analysis')}>
                      <FileText size={16} />
                      <span className="font-normal">Assignment Analysis</span>
                    </Link>                                   
                    <Link href="/reports/grade-distribution" onClick={handleLinkClick} className={subMenuItemClass(pathname === '/reports/grade-distribution')}>
                      <PieChart size={16} />
                      <span className="font-normal">Grade Distribution</span>
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-700 my-2"></div>
                        <p className="text-xs text-gray-400 px-3 mt-2">Admin Reports</p>

                        <Link
                          href="/admin/finance"
                          onClick={handleLinkClick}
                          className={subMenuItemClass(pathname === '/admin/finance')}
                        >
                          <DollarSign size={16} />
                          <span>Financial Reports</span>
                        </Link>
                      </>
                    )}
                  </>
                )}     
                {/* Student Reports - For Admin and Students */}
                {(isAdmin || isStudent) && (
                  <>
                    {(isAdmin && isTeacher) && (
                      <div className="border-t border-gray-700 my-1"></div>
                    )}
                    <Link href="/reports/progress" onClick={handleLinkClick} className={subMenuItemClass(pathname === '/reports/progress')}>
                      <TrendingUp size={16} />
                      <span className="font-normal">Progress Report</span>
                    </Link>
                    <Link href="/reports/grades" onClick={handleLinkClick} className={subMenuItemClass(pathname === '/reports/grades')}>
                      <Award size={16} />
                      <span className="font-normal">Grade Report</span>
                    </Link>
                    <Link href="/reports/assignments" onClick={handleLinkClick} className={subMenuItemClass(pathname === '/reports/assignments')}>
                      <FileText size={16} />
                      <span className="font-normal">Assignment Report</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Other Menu Items for non-Admin */}
        {!isAdmin && (
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
        )}

        {/* Settings for Admin */}
        {isAdmin && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <Link
              href="/settings"
              onClick={handleLinkClick}
              className={menuItemClass(pathname === '/settings')}
            >
              <Settings size={18} />
              <span className="font-normal">Settings</span>
            </Link>
          </div>
        )}
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
        
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {sidebarContent}
        </div>
      </>
    )
  }

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-full w-56 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex-col shadow-xl z-20">
      {sidebarContent}
    </aside>
  )
}