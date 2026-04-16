'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobileDevice = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
      if (isMobileDevice) {
        setIsMobileMenuOpen(false)
      }
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

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

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [pathname, isMobile])

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
    return 'SomaPRO'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        userRole={user.role} 
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Topbar 
          userName={user.name} 
          userAvatar={user.avatar}
          pageTitle={getPageTitle()}
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}