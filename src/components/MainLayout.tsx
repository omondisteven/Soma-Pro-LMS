'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [router])

  // Don't show layout on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register'
  if (isAuthPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  // Get page title based on current path
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname === '/courses') return 'My Courses'
    if (pathname === '/assignments') return 'Assignments'
    if (pathname === '/enroll-students') return 'Enroll Students' 
    if (pathname === '/teacher/grading') return 'Mark Assignments' 
    if (pathname === '/grades') return 'Grades'
    if (pathname === '/students') return 'Students'
    if (pathname === '/profile') return 'Profile'
    if (pathname === '/reports') return 'Reports & Statistics'
    if (pathname === '/reports/assignments') return 'Assignment Report'
    if (pathname === '/reports/grades') return 'Grade Report'
    if (pathname === '/reports/progress') return 'Progress Report'
    if (pathname === '/settings') return 'Settings'
    if (pathname?.startsWith('/courses/')) return 'Browse Courses'
    return 'Cps-LMS'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Always visible */}
      <Sidebar userRole={user.role} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar - Always visible, dynamic based on current page */}
        <Topbar 
          userName={user.name} 
          userAvatar={user.avatar}
          pageTitle={getPageTitle()}
        />
        
        {/* Page Content - Scrollable area */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}