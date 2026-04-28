// components/Layout/Topbar.tsx
'use client'

import { Bell, Search, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NotificationDropdown from '@/components/NotificationDropdown'

interface TopbarProps {
  userName: string
  userAvatar?: string
  pageTitle?: string
}

export default function Topbar({ userName, userAvatar, pageTitle }: TopbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()

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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-3 md:px-8 sticky top-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className={`${isSearchOpen ? 'hidden sm:block' : 'block'}`}>
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900 line-clamp-1">
            {pageTitle || 'Dashboard'}
          </h1>
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className={`${isSearchOpen ? 'absolute left-0 right-0 top-0 h-16 px-4 bg-white border-b border-gray-200 flex items-center z-40' : 'hidden md:block relative'}`}>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus={isSearchOpen}
            />
          </div>
          <button 
            className="ml-3 p-2 text-gray-500 md:hidden"
            onClick={() => setIsSearchOpen(false)}
          >
            ✕
          </button>
        </div>
        
        <button 
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search size={20} className="text-gray-600" />
        </button>
        
        <NotificationDropdown />
        
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 focus:outline-none"
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-gray-700">{userName}</span>
            <ChevronDown size={14} className="hidden md:block text-gray-500" />
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
    </header>
  )
}