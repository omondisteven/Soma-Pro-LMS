// components/Layout/MobileHeader.tsx
'use client'

import { Menu, X, LogOut, Settings, UserCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/context/SidebarContext'
import NotificationDropdown from '@/components/NotificationDropdown'

export default function MobileHeader() {
  const { isOpen, toggleSidebar } = useSidebar()
  const router = useRouter()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

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

  const userName = user?.name || 'User'
  const userAvatar = user?.avatar
  const userEmail = user?.email
  const userRole = user?.role

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      {/* Left section - Menu button */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Center - App Title */}
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          CPS-SomaPRO
        </h1>
        <p className="text-[10px] text-gray-500">Learning Management System</p>
      </div>

      {/* Right section - Notifications and Profile */}
      <div className="flex items-center gap-2">
        <NotificationDropdown />
        
        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1 focus:outline-none transition-colors"
            aria-label="Profile menu"
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
          
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  {userRole && (
                    <p className="text-xs text-blue-600 mt-1 capitalize">{userRole.toLowerCase()}</p>
                  )}
                </div>
                
                {/* Profile Link */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    router.push('/profile')
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <UserCircle size={16} />
                  Profile
                </button>
                
                {/* Settings Link */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    router.push('/settings')
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>
                
                <hr className="my-1" />
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}