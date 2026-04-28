// app/(authenticated)/courses/[id]/manage/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Video,
  FileText,
  Award,
  ClipboardList,
  MoveUp,
  MoveDown
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  type: string
  duration: number
  order: number
  isMandatory: boolean
}

interface Section {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string
  sections: Section[]
}

export default function ManageCoursePage() {
  const params = useParams()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCourse(data.course)
      // Auto-expand all sections
      if (data.course?.sections) {
        setExpandedSections(new Set(data.course.sections.map((s: Section) => s.id)))
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleAddSection = () => {
    setEditingSection(null)
    setShowSectionModal(true)
  }

  const handleEditSection = (section: Section) => {
    setEditingSection(section)
    setShowSectionModal(true)
  }

  const handleAddLesson = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    setEditingLesson(null)
    setShowLessonModal(true)
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setShowLessonModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return <div>Course not found</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Course</h1>
          <p className="text-gray-600 mt-1">{course.title}</p>
        </div>
        <button
          onClick={handleAddSection}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Section
        </button>
      </div>

      {/* Course Content Builder */}
      <div className="space-y-4">
        {course.sections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first section</p>
            <button
              onClick={handleAddSection}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Section
            </button>
          </div>
        ) : (
          course.sections.map((section, sectionIndex) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center gap-2 hover:text-blue-600"
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                    {section.description && (
                      <span className="text-sm text-gray-500">- {section.description}</span>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSection(section)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleAddLesson(section.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Lesson
                    </button>
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              {expandedSections.has(section.id) && (
                <div className="divide-y divide-gray-100">
                  {section.lessons.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No lessons yet. Click "Add Lesson" to get started.
                    </div>
                  ) : (
                    section.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {lesson.type === 'VIDEO' && <Video size={20} className="text-blue-500" />}
                          {lesson.type === 'TEXT' && <FileText size={20} className="text-green-500" />}
                          {lesson.type === 'QUIZ' && <Award size={20} className="text-purple-500" />}
                          {lesson.type === 'ASSIGNMENT' && <ClipboardList size={20} className="text-orange-500" />}
                          <div>
                            <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{lesson.duration || 5} min</span>
                              <span>•</span>
                              <span>{lesson.isMandatory ? 'Mandatory' : 'Optional'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditLesson(lesson)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Section Modal */}
      <SectionModal
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        onSave={() => {
          setShowSectionModal(false)
          fetchCourse()
        }}
        courseId={courseId}
        editingSection={editingSection}
      />

      {/* Lesson Modal */}
      <LessonModal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSave={() => {
          setShowLessonModal(false)
          fetchCourse()
        }}
        courseId={courseId}
        sectionId={selectedSectionId}
        editingLesson={editingLesson}
      />
    </div>
  )
}

// Section Modal Component
function SectionModal({ isOpen, onClose, onSave, courseId, editingSection }: any) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (editingSection) {
      setTitle(editingSection.title)
      setDescription(editingSection.description || '')
    } else {
      setTitle('')
      setDescription('')
    }
  }, [editingSection, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem('token')

    try {
      const url = editingSection 
        ? `/api/courses/${courseId}/sections/${editingSection.id}`
        : `/api/courses/${courseId}/sections`
      const method = editingSection ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save section')
      }
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Failed to save section')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingSection ? 'Edit Section' : 'Add Section'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Lesson Modal Component
function LessonModal({ isOpen, onClose, onSave, courseId, sectionId, editingLesson }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TEXT',
    content: '',
    videoUrl: '',
    duration: 10,
    isMandatory: true
  })

  useEffect(() => {
    if (editingLesson) {
      setFormData({
        title: editingLesson.title || '',
        description: editingLesson.description || '',
        type: editingLesson.type || 'TEXT',
        content: editingLesson.content || '',
        videoUrl: editingLesson.videoUrl || '',
        duration: editingLesson.duration || 10,
        isMandatory: editingLesson.isMandatory ?? true
      })
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'TEXT',
        content: '',
        videoUrl: '',
        duration: 10,
        isMandatory: true
      })
    }
  }, [editingLesson, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const token = localStorage.getItem('token')

    try {
      const url = editingLesson 
        ? `/api/courses/${courseId}/sections/${sectionId}/lessons/${editingLesson.id}`
        : `/api/courses/${courseId}/sections/${sectionId}/lessons`
      const method = editingLesson ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        onSave()
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save lesson')
      }
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Failed to save lesson')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lesson Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Lesson Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TEXT">Text Content</option>
                <option value="VIDEO">Video</option>
                <option value="QUIZ">Quiz</option>
                <option value="ASSIGNMENT">Assignment</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Content (for TEXT type) */}
            {formData.type === 'TEXT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (HTML supported)
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="<h1>Welcome!</h1><p>Your content here...</p>"
                />
              </div>
            )}

            {/* Video URL (for VIDEO type) */}
            {formData.type === 'VIDEO' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Supports MP4, YouTube embed, Vimeo</p>
              </div>
            )}

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min={1}
                max={300}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Mandatory */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isMandatory}
                  onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Mandatory lesson (students must complete)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {loading ? 'Saving...' : 'Save Lesson'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}