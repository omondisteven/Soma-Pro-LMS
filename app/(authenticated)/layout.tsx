'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Layout/Sidebar'
import Navbar from '@/components/Layout/Navbar'
import MobileHeader from '@/components/Layout/MobileHeader'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('STUDENT')

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      router.push(`/login?from=${pathname}`)
      return
    }

    // Get user role from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserRole(user.role || 'STUDENT')
    }
    
    setIsLoading(false)
  }, [router, pathname])

  // Don't show layout on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register'
  if (isAuthPage) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - visible on mobile only */}
        <MobileHeader />
        
        {/* Desktop Navbar - hidden on mobile */}
        <div className="hidden lg:block">
          <Navbar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}