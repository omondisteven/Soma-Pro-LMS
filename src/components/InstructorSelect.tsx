'use client'

import { useState, useEffect, useRef } from 'react'
import { X, UserPlus, Check, ChevronDown } from 'lucide-react'

interface Instructor {
  id: string
  name: string
  email: string
  avatar?: string
}

interface InstructorSelectProps {
  selectedInstructors: Instructor[]
  onChange: (instructors: Instructor[]) => void
  disabled?: boolean
}

export default function InstructorSelect({ 
  selectedInstructors, 
  onChange, 
  disabled = false 
}: InstructorSelectProps) {
  const [availableTeachers, setAvailableTeachers] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchTeachers = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/users/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAvailableTeachers(data.teachers || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const addInstructor = (instructor: Instructor) => {
    if (!selectedInstructors.find(i => i.id === instructor.id)) {
      onChange([...selectedInstructors, instructor])
    }
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  const removeInstructor = (instructorId: string) => {
    onChange(selectedInstructors.filter(i => i.id !== instructorId))
  }

  const filteredTeachers = availableTeachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (disabled) {
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex flex-wrap gap-2">
          {selectedInstructors.length > 0 ? (
            selectedInstructors.map(instructor => (
              <div key={instructor.id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                {instructor.name}
              </div>
            ))
          ) : (
            <span className="text-gray-500">No instructors assigned</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Selected Instructors */}
      <div className="flex flex-wrap gap-2">
        {selectedInstructors.map(instructor => (
          <div key={instructor.id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
            <span>{instructor.name}</span>
            <button
              type="button"
              onClick={() => removeInstructor(instructor.id)}
              className="hover:text-blue-900"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Instructor Button and Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <UserPlus size={16} />
          Add Instructor
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : filteredTeachers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No teachers found</div>
              ) : (
                filteredTeachers.map(teacher => {
                  const isSelected = selectedInstructors.some(i => i.id === teacher.id)
                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => !isSelected && addInstructor(teacher)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                        isSelected ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={isSelected}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-sm text-gray-500">{teacher.email}</div>
                      </div>
                      {isSelected && <Check size={16} className="text-green-500" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}