'use client'

import { useState } from 'react'
import { MoreVertical, Eye, Edit, Trash2, Copy, Archive, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CourseActionMenuProps {
  courseId: string
  courseTitle: string
  onEdit: () => void
  onDelete: () => void
  onViewDetails: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  showManageContent?: boolean  // New prop to conditionally show Manage Content
}

export default function CourseActionMenu({
  courseId,
  courseTitle,
  onEdit,
  onDelete,
  onViewDetails,
  onDuplicate,
  onArchive,
  showManageContent = true
}: CourseActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const handleManageContent = () => {
    router.push(`/teacher/courses/${courseId}/manage`)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => handleAction(onViewDetails)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Eye size={16} />
              View Details
            </button>
            
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Edit size={16} />
              Edit Course
            </button>
            
            {/* Manage Content Option - for teachers */}
            {showManageContent && (
              <button
                onClick={handleManageContent}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Settings size={16} />
                Manage Content
              </button>
            )}
            
            {onDuplicate && (
              <button
                onClick={() => handleAction(onDuplicate)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Copy size={16} />
                Duplicate
              </button>
            )}
            
            {onArchive && (
              <button
                onClick={() => handleAction(onArchive)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Archive size={16} />
                Archive
              </button>
            )}
            
            <hr className="my-1" />
            
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Course
            </button>
          </div>
        </>
      )}
    </div>
  )
}