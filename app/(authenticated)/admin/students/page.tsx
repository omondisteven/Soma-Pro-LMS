// app/(authenticated)/admin/students/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Plus, MoreVertical, Eye, Edit, Trash2, GraduationCap, X } from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  highSchoolCompleted: boolean
  qualification: string | null
  qualificationDiscipline: string | null
  enrolledCourses: number
  createdAt: string
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    highSchoolCompleted: false,
    qualification: '',
    qualificationDiscipline: '',
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    
    try {
      const url = isEditMode && editingStudent 
        ? `/api/admin/users/${editingStudent.id}` 
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
          role: 'STUDENT'
        })
      })
      
      if (res.ok) {
        setShowModal(false)
        setFormData({
          name: '',
          email: '',
          password: '',
          highSchoolCompleted: false,
          qualification: '',
          qualificationDiscipline: '',
        })
        fetchStudents()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save student')
      }
    } catch (error) {
      console.error('Error saving student:', error)
      alert('Failed to save student')
    }
  }

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/admin/users/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        fetchStudents()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
    }
    setOpenMenuId(null)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      email: student.email,
      password: '',
      highSchoolCompleted: student.highSchoolCompleted,
      qualification: student.qualification || '',
      qualificationDiscipline: student.qualificationDiscipline || '',
    })
    setIsEditMode(true)
    setShowModal(true)
    setOpenMenuId(null)
  }

  const handleView = (student: Student) => {
    setViewingStudent(student)
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
          <p className="text-gray-600 mt-1">View and manage student records</p>
        </div>
        <button
          onClick={() => {
            setIsEditMode(false)
            setEditingStudent(null)
            setFormData({
              name: '',
              email: '',
              password: '',
              highSchoolCompleted: false,
              qualification: '',
              qualificationDiscipline: '',
            })
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Student
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Education</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Courses</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium text-gray-900">{student.name}</td>
                  <td className="py-3 px-6 text-gray-600">{student.email}</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-1">
                      <GraduationCap size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {student.qualification ? `${student.qualification} - ${student.qualificationDiscipline}` : 'Not specified'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-gray-600">{student.enrolledCourses}</td>
                  <td className="py-3 px-6 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === student.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => handleView(student)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Edit Student
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{isEditMode ? 'Edit Student' : 'Add New Student'}</h2>
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
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.highSchoolCompleted}
                      onChange={(e) => setFormData({ ...formData, highSchoolCompleted: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">High School Completed</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select qualification</option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="BACHELORS">Bachelor's Degree</option>
                    <option value="MASTERS">Master's Degree</option>
                    <option value="DOCTORATE">Doctorate</option>
                    <option value="CERTIFICATE">Certificate</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                  <input
                    type="text"
                    value={formData.qualificationDiscipline}
                    onChange={(e) => setFormData({ ...formData, qualificationDiscipline: e.target.value })}
                    placeholder="e.g., Computer Science"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
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
                    {isEditMode ? 'Update Student' : 'Create Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && viewingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowViewModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Student Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{viewingStudent.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{viewingStudent.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">High School Completed</label>
                  <p className="text-gray-900">{viewingStudent.highSchoolCompleted ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Qualification</label>
                  <p className="text-gray-900">{viewingStudent.qualification || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Discipline</label>
                  <p className="text-gray-900">{viewingStudent.qualificationDiscipline || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Enrolled Courses</label>
                  <p className="text-gray-900">{viewingStudent.enrolledCourses}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Registered On</label>
                  <p className="text-gray-900">{new Date(viewingStudent.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}