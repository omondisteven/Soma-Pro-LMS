'use client'

import { useEffect, useState } from 'react'
import { Edit, Trash2, UserPlus, GraduationCap } from 'lucide-react'

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
          <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600 mt-1">Manage student records and profiles</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <UserPlus size={20} />
          Add Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Education</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Enrolled Courses</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Registered</th>
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
                  <td className="py-3 px-6 text-gray-500">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <button className="text-blue-600 hover:text-blue-700 mr-3">
                      <Edit size={18} />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}