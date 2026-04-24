'use client'

import { useEffect, useState } from 'react'
import { Edit, Trash2, UserPlus, BookOpen } from 'lucide-react'
import Link from 'next/link'

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
          <h1 className="text-3xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-1">Manage teacher records and course assignments</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <UserPlus size={20} />
          Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Courses</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Students</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Joined</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium text-gray-900">{teacher.name}</td>
                  <td className="py-3 px-6 text-gray-600">{teacher.email}</td>
                  <td className="py-3 px-6 text-gray-600">{teacher.coursesTaught}</td>
                  <td className="py-3 px-6 text-gray-600">{teacher.studentsEnrolled}</td>
                  <td className="py-3 px-6 text-gray-500">
                    {new Date(teacher.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <Link href={`/admin/teachers/${teacher.id}/courses`} className="text-green-600 hover:text-green-700 mr-3">
                      <BookOpen size={18} />
                    </Link>
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