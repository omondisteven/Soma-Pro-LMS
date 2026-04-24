'use client'

import { Menu, X } from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'

export default function MobileHeader() {
  const { isOpen, toggleSidebar } = useSidebar()

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-gray-800">SomaPRO</h1>
      </div>
      <div className="w-10" />
    </div>
  )
}