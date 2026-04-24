'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, UserPlus, Shield, Users, GraduationCap, X, Save } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  highSchoolCompleted?: boolean
  qualification?: string
  qualificationDiscipline?: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STUDENT',
    highSchoolCompleted: false,
    qualification: '',
    qualificationDiscipline: '',
  })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserRole(user.role)
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setShowModal(false)
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'STUDENT',
          highSchoolCompleted: false,
          qualification: '',
          qualificationDiscipline: '',
        })
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    const token = localStorage.getItem('token')
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          role: editingUser.role,
          highSchoolCompleted: editingUser.highSchoolCompleted,
          qualification: editingUser.qualification,
          qualificationDiscipline: editingUser.qualificationDiscipline,
        })
      })
      
      if (res.ok) {
        setShowEditModal(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800'
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canCreateRole = (role: string) => {
    if (userRole === 'ADMIN') return true
    if (userRole === 'MANAGER' && (role === 'TEACHER' || role === 'STUDENT')) return true
    return false
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Created</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium text-gray-900">{user.name}</td>
                  <td className="py-3 px-6 text-gray-600">{user.email}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <button
                      onClick={() => {
                        setEditingUser(user)
                        setShowEditModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New User</h2>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER" disabled={!canCreateRole('TEACHER')}>Teacher</option>
                    <option value="MANAGER" disabled={!canCreateRole('MANAGER')}>Manager</option>
                    <option value="ADMIN" disabled={!canCreateRole('ADMIN')}>Admin</option>
                  </select>
                </div>
                
                {formData.role === 'STUDENT' && (
                  <>
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
                  </>
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
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowEditModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit User</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="MANAGER" disabled={userRole !== 'ADMIN'}>Manager</option>
                    <option value="ADMIN" disabled={userRole !== 'ADMIN'}>Admin</option>
                  </select>
                </div>
                
                {editingUser.role === 'STUDENT' && (
                  <>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingUser.highSchoolCompleted || false}
                          onChange={(e) => setEditingUser({ ...editingUser, highSchoolCompleted: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">High School Completed</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <select
                        value={editingUser.qualification || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, qualification: e.target.value })}
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
                        value={editingUser.qualificationDiscipline || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, qualificationDiscipline: e.target.value })}
                        placeholder="e.g., Computer Science"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}