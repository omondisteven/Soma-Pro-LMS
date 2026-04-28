// src/components/ui/DataTable.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T = any> {
  key: string
  header: string
  render?: (item: T, index?: number) => React.ReactNode
  className?: string
  width?: string
}

export interface Action {
  label: string
  icon?: React.ReactNode
  onClick: (item: any) => void
  className?: string
}

export interface ActionDivider {
  divider: true
}

export type MenuItem = Action | ActionDivider

interface DataTableProps {
  data: any[]
  columns: Column[]
  actions?: MenuItem[]
  onRowClick?: (item: any) => void
  isLoading?: boolean
  emptyMessage?: string
  itemsPerPage?: number
}

export default function DataTable({
  data,
  columns,
  actions = [],
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  itemsPerPage = 10
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; right: string }>({ right: '0' })

  // Pagination
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Check if click was on any action button
        let clickedOnButton = false
        buttonRefs.current.forEach((button) => {
          if (button.contains(event.target as Node)) {
            clickedOnButton = true
          }
        })
        if (!clickedOnButton) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate menu position
  const getMenuPosition = (buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const menuHeight = actions.length * 40 + 16 // Approximate menu height
    
    if (spaceBelow < menuHeight) {
      // Show menu above the button
      return {
        top: undefined,
        bottom: window.innerHeight - rect.top + window.scrollY,
        right: 0
      }
    } else {
      // Show menu below the button
      return {
        top: rect.bottom + window.scrollY,
        bottom: undefined,
        right: 0
      }
    }
  }

  const handleMenuClick = (itemId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const button = event.currentTarget
    const position = getMenuPosition(button)
    setMenuPosition({ ...position, right: '0' })
    setOpenMenuId(openMenuId === itemId ? null : itemId)
  }

  // Helper to check if a menu item is an action
  const isAction = (item: MenuItem): item is Action => {
    return 'label' in item && 'onClick' in item
  }

  // Helper to check if a menu item is a divider
  const isDivider = (item: MenuItem): item is ActionDivider => {
    return 'divider' in item && item.divider === true
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="text-center py-12">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentData.map((item, index) => (
              <tr
                key={item.id || index}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`py-4 px-6 text-sm ${column.className || 'text-gray-900'}`}
                  >
                    {column.render ? column.render(item, index) : item[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="py-4 px-6 relative">
                    <button
                      ref={(el) => {
                        if (el) buttonRefs.current.set(item.id || index.toString(), el)
                      }}
                      onClick={(e) => handleMenuClick(item.id || index.toString(), e)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {openMenuId === (item.id || index.toString()) && (
                      <div
                        ref={menuRef}
                        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
                        style={{
                          top: menuPosition.top !== undefined ? `${menuPosition.top}px` : 'auto',
                          bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : 'auto',
                          right: `${menuPosition.right}px`
                        }}
                      >
                        {actions.map((menuItem, idx) => {
                          if (isDivider(menuItem)) {
                            return <hr key={idx} className="my-1" />
                          }
                          if (isAction(menuItem)) {
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  menuItem.onClick(item)
                                  setOpenMenuId(null)
                                }}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${menuItem.className || 'text-gray-700 hover:bg-gray-100'}`}
                              >
                                {menuItem.icon}
                                {menuItem.label}
                              </button>
                            )
                          }
                          return null
                        })}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}