// components/Layout/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Settings, User } from 'lucide-react'
import NotificationDropdown from '@/components/NotificationDropdown'

export default function Navbar() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserName(user.name || 'User')
      setUserRole(user.role || 'STUDENT')
    }
  }, [])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 md:px-8 py-3 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">
              Welcome back, {userName || 'User'}!
            </h2>
            {userRole && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Manage your courses and track progress</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            href="/settings"
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </Link>
          
          <NotificationDropdown />
          
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">{userName}</span>
            </button>
            
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                  <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}