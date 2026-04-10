'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Eye, EyeOff } from 'lucide-react'
import InstructorSelect from './InstructorSelect'

interface Instructor {
  id: string
  name: string
  email: string
  avatar?: string
}

interface CourseModalProps {
  isOpen: boolean
  onClose: () => void
  onCourseCreated: () => void
  editingCourse?: any
  isViewMode?: boolean
}

const categories = [
  'Web Development',
  'Programming',
  'Data Science',
  'Design',
  'Business',
  'Marketing',
  'Language',
  'Mathematics',
  'Science',
  'Humanities'
]

export default function CourseModal({ 
  isOpen, 
  onClose, 
  onCourseCreated, 
  editingCourse, 
  isViewMode = false 
}: CourseModalProps) {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    shortName: '',
    description: '',
    category: '',
    visibility: 'SHOW',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    price: '',  // Add price field
    currency: 'KES'  // Add currency field
  })
  const [selectedInstructors, setSelectedInstructors] = useState<Instructor[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title || '',
        shortName: editingCourse.shortName || '',
        description: editingCourse.description || '',
        category: editingCourse.category || '',
        visibility: editingCourse.visibility || 'SHOW',
        status: editingCourse.status || 'DRAFT',
        startDate: editingCourse.startDate ? new Date(editingCourse.startDate).toISOString().slice(0, 16) : '',
        endDate: editingCourse.endDate ? new Date(editingCourse.endDate).toISOString().slice(0, 16) : '',
        price: editingCourse.price?.toString() || '',
        currency: editingCourse.currency || 'KES'
      })
      // Set selected instructors from editingCourse
      if (editingCourse.instructors) {
        setSelectedInstructors(editingCourse.instructors.map((inv: any) => inv.instructor))
      } else {
        setSelectedInstructors([])
      }
    } else {
      setFormData({
        title: '',
        shortName: '',
        description: '',
        category: '',
        visibility: 'SHOW',
        status: 'DRAFT',
        startDate: '',
        endDate: '',
        price: '',
        currency: 'KES'
      })
      setSelectedInstructors([])
    }
  }, [editingCourse, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (isViewMode) return
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isViewMode) return
    
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          shortName: formData.shortName,
          description: formData.description,
          category: formData.category,
          visibility: formData.visibility,
          status: formData.status,
          startDate: formData.startDate,
          endDate: formData.endDate,
          price: parseFloat(formData.price) || 0,  // Make sure price is included
          currency: formData.currency,            // Make sure currency is included
          instructorIds: selectedInstructors.map(i => i.id)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${editingCourse ? 'update' : 'create'} course`)
      }

      onCourseCreated()
      onClose()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const modalTitle = editingCourse 
    ? (isViewMode ? 'Course Details' : 'Edit Course')
    : 'Create New Course'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{modalTitle}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Course Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Full Name {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                  {formData.title || 'Not specified'}
                </div>
              ) : (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Web Development"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
            </div>

            {/* Course Short Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Short Name {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                  {formData.shortName || 'Not specified'}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleChange}
                    placeholder="e.g., WEB101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Used in URLs and references (no spaces)</p>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {formData.description || 'Not specified'}
                </div>
              ) : (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe what students will learn..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
            </div>

            {/* Course Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Category {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                  {formData.category || 'Not specified'}
                </div>
              ) : (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Course Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Fee {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                  {formData.price ? `${formData.currency} ${parseFloat(formData.price).toLocaleString()}` : 'Free'}
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KES">KES (Kenyan Shilling)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0 for free course"
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              {!isViewMode && (
                <p className="text-xs text-gray-500 mt-1">Set to 0 for a free course. Students must pay this amount to enroll.</p>
              )}
            </div>

            {/* Instructors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Instructors {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              <InstructorSelect
                selectedInstructors={selectedInstructors}
                onChange={setSelectedInstructors}
                disabled={isViewMode}
              />
              {!isViewMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Add multiple instructors to teach this course
                </p>
              )}
            </div>

            {/* Course Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Status {!isViewMode && <span className="text-red-500">*</span>}
              </label>
              {isViewMode ? (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                  {formData.status === 'PUBLISHED' ? (
                    <span className="text-green-600">Published (Visible to students)</span>
                  ) : (
                    <span className="text-yellow-600">Draft (Not visible to students)</span>
                  )}
                </div>
              ) : (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="DRAFT"
                      checked={formData.status === 'DRAFT'}
                      onChange={handleChange}
                      className="text-blue-600"
                    />
                    <span>Draft (Not visible to students)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="status"
                      value="PUBLISHED"
                      checked={formData.status === 'PUBLISHED'}
                      onChange={handleChange}
                      className="text-blue-600"
                    />
                    <span>Published (Visible to students)</span>
                  </label>
                </div>
              )}
              {!isViewMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Draft courses are only visible to teachers. Published courses appear in "Browse Courses" for students.
                </p>
              )}
            </div>

            {/* Course Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Visibility
              </label>
              {isViewMode ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  {formData.visibility === 'SHOW' ? (
                    <>
                      <Eye size={16} className="text-green-600" />
                      <span>Visible to students</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} className="text-red-600" />
                      <span>Hidden from students</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value="SHOW"
                      checked={formData.visibility === 'SHOW'}
                      onChange={handleChange}
                      className="text-blue-600"
                    />
                    <Eye size={16} className="text-green-600" />
                    <span>Show (Visible to students)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value="HIDE"
                      checked={formData.visibility === 'HIDE'}
                      onChange={handleChange}
                      className="text-blue-600"
                    />
                    <EyeOff size={16} className="text-red-600" />
                    <span>Hide (Not visible to students)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Course Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Start Date {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {isViewMode ? (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not set'}
                  </div>
                ) : (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course End Date
                </label>
                {isViewMode ? (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'No end date'}
                  </div>
                ) : (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            {!isViewMode && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (editingCourse ? 'Updating...' : 'Creating...') : (editingCourse ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            )}
            
            {isViewMode && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}