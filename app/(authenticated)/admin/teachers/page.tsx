'use client'

import { useEffect, useState } from 'react'
import { Plus, MoreVertical, Eye, Edit, Trash2, BookOpen, X } from 'lucide-react'
import Link from 'next/link'
import DataTable from '@/components/ui/DataTable'
import router from 'next/router'

interface Teacher {
  id: string
  name: string
  email: string
  coursesTaught: number
  studentsEnrolled: number
  createdAt: string
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTeachers(data.teachers || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    
    try {
      const url = isEditMode && editingTeacher 
        ? `/api/admin/users/${editingTeacher.id}` 
        : '/api/admin/users'
      const method = isEditMode ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          role: 'TEACHER'
        })
      })
      
      if (res.ok) {
        setShowModal(false)
        setFormData({
          name: '',
          email: '',
          password: '',
        })
        fetchTeachers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save teacher')
      }
    } catch (error) {
      console.error('Error saving teacher:', error)
      alert('Failed to save teacher')
    }
  }

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return
    
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/admin/users/${teacherId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        fetchTeachers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete teacher')
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      alert('Failed to delete teacher')
    }
    setOpenMenuId(null)
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: '',
    })
    setIsEditMode(true)
    setShowModal(true)
    setOpenMenuId(null)
  }

  const handleView = (teacher: Teacher) => {
    setViewingTeacher(teacher)
    setShowViewModal(true)
    setOpenMenuId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Teachers</h1>
          <p className="text-gray-600 mt-1">View and manage teacher records</p>
        </div>
        <button
          onClick={() => {
            setIsEditMode(false)
            setEditingTeacher(null)
            setFormData({
              name: '',
              email: '',
              password: '',
            })
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Teacher
        </button>
      </div>

      {/* Teachers Table */}
      <DataTable
        data={teachers}
        columns={[
          { key: 'name', header: 'Name', className: 'font-medium text-gray-900' },
          { key: 'email', header: 'Email' },
          { key: 'coursesTaught', header: 'Courses' },
          { key: 'studentsEnrolled', header: 'Students' },
        ]}
        actions={[
          {
            label: 'View Details',
            icon: <Eye size={14} />,
            onClick: (teacher) => handleView(teacher)
          },
          {
            label: 'Edit Teacher',
            icon: <Edit size={14} />,
            onClick: (teacher) => handleEdit(teacher)
          },
          {
            label: 'Assign Courses',
            icon: <BookOpen size={14} />,
            onClick: (teacher) => router.push(`/admin/assign-course?teacher=${teacher.id}`)
          },
          { divider: true },
          {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            onClick: (teacher) => handleDelete(teacher.id),
            className: 'text-red-600 hover:bg-red-50'
          }
        ]}
      />

      {/* Add/Edit Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isEditMode ? 'Update Teacher' : 'Create Teacher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Teacher Modal */}
      {showViewModal && viewingTeacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowViewModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Teacher Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{viewingTeacher.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{viewingTeacher.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Courses Teaching</label>
                  <p className="text-gray-900">{viewingTeacher.coursesTaught}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Students Enrolled</label>
                  <p className="text-gray-900">{viewingTeacher.studentsEnrolled}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Registered On</label>
                  <p className="text-gray-900">{new Date(viewingTeacher.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}