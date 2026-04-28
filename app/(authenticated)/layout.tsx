'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Layout/Sidebar'
import Topbar from '@/components/Layout/Topbar'
import MobileHeader from '@/components/Layout/MobileHeader'
import { useSidebar } from '@/context/SidebarContext'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { isMobile } = useSidebar()

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

  const getPageTitle = () => {
    const path = pathname || ''
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/courses') return 'My Courses'
    if (path === '/courses/public') return 'Browse Courses'
    if (path === '/assignments') return 'Assignments'
    if (path === '/grades') return 'Grades'
    if (path === '/students') return 'Students'
    if (path === '/enroll-students') return 'Enroll Students'
    if (path === '/teacher/grading') return 'Grading'
    if (path === '/profile') return 'Profile'
    if (path === '/settings') return 'Settings'
    if (path?.startsWith('/courses/')) return 'Course Details'
    if (path?.startsWith('/teacher/courses/')) return 'Manage Course'
    if (path?.startsWith('/teacher/students/')) return 'Student Details'
    if (path?.startsWith('/reports')) return 'Reports'
    return 'CPS-SomaPRO'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - fixed on desktop */}
      <Sidebar userRole={user.role} />
      
      {/* Main Content Area - with margin on desktop to account for sidebar */}
      <div className="lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile Header - visible on mobile only (reads user data from localStorage internally) */}
        <div className="lg:hidden">
          <MobileHeader />
        </div>
        
        {/* Desktop Topbar - hidden on mobile */}
        <div className="hidden lg:block">
          <Topbar 
            userName={user.name} 
            userAvatar={user.avatar}
            pageTitle={getPageTitle()}
          />
        </div>
        
        {/* Page Content */}
        <main className={`flex-1 ${isMobile ? 'mt-14' : ''}`}>
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}