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
    <header className="bg-maroon-800 border-b border-maroon-700 h-16 flex items-center justify-between px-3 md:px-8 sticky top-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className={`${isSearchOpen ? 'hidden sm:block' : 'block'}`}>
          <h1 className="text-lg md:text-2xl font-semibold text-yellow-400 line-clamp-1">
            {pageTitle || 'Dashboard'}
          </h1>
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className={`${isSearchOpen ? 'absolute left-0 right-0 top-0 h-16 px-4 bg-maroon-800 border-b border-maroon-700 flex items-center z-40' : 'hidden md:block relative'}`}>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400/60" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border border-maroon-600 bg-maroon-700/50 text-yellow-100 placeholder-yellow-400/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
              autoFocus={isSearchOpen}
            />
          </div>
          <button 
            className="ml-3 p-2 text-yellow-400 md:hidden hover:text-yellow-300"
            onClick={() => setIsSearchOpen(false)}
          >
            ✕
          </button>
        </div>
        
        <button 
          className="md:hidden p-2 hover:bg-maroon-700 rounded-lg text-yellow-400"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search size={20} />
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
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-maroon-900 font-medium text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-yellow-200">{userName}</span>
            <ChevronDown size={14} className="hidden md:block text-yellow-400/60" />
          </button>
          
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-maroon-800 rounded-lg shadow-lg border border-maroon-700 py-1 z-20">
                <a href="/profile" className="block px-4 py-2 text-sm text-yellow-200 hover:bg-maroon-700 hover:text-yellow-100">Profile</a>
                <a href="/settings" className="block px-4 py-2 text-sm text-yellow-200 hover:bg-maroon-700 hover:text-yellow-100">Settings</a>
                <hr className="my-1 border-maroon-700" />
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-maroon-700 hover:text-red-300"
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